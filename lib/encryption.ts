import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM helpers for encrypting OAuth tokens at rest (GDPR audit gap #4
 * — see docs/gdpr-compliance-audit.md § "CRITICAL GAPS" #4). Used exclusively
 * by the Prisma `account` query extension (see
 * lib/prisma-extensions/account-token-encryption.ts) and by the one-off
 * backfill script (scripts/encrypt-account-tokens.ts).
 *
 * Known limitation: because ciphertext is non-deterministic (random IV per
 * write), `Account` rows can no longer be looked up by an equality filter on
 * `accessToken`/`refreshToken`/`idToken`. Nothing in the codebase currently
 * does this (verified), but keep it in mind if that ever changes.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

/**
 * Prefix that marks a value as ciphertext produced by this module. Existing
 * plaintext tokens (e.g. already on the staging DB) never have this prefix,
 * so `decryptToken` can tell them apart from ciphertext and pass them through
 * unchanged instead of crashing — this is what lets the app keep working
 * against a DB that hasn't been backfilled yet.
 */
export const ENCRYPTED_PREFIX = "enc:v1:";

let cachedKey: Buffer | null = null;

/**
 * Resolves and caches the encryption key from `ENCRYPTION_KEY`. Deliberately
 * lazy (never read at module load) so that `next build` — which imports every
 * server module — doesn't fail in environments/steps that don't have the key
 * configured. Failure only happens the first time encryption/decryption of an
 * already-encrypted value is actually attempted.
 */
function getEncryptionKey(): Buffer {
	if (cachedKey) return cachedKey;

	const raw = process.env.ENCRYPTION_KEY;
	if (!raw) {
		throw new Error(
			"ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -base64 32",
		);
	}

	let key: Buffer;
	if (/^[0-9a-fA-F]{64}$/.test(raw)) {
		key = Buffer.from(raw, "hex");
	} else {
		key = Buffer.from(raw, "base64");
	}

	if (key.length !== KEY_LENGTH_BYTES) {
		throw new Error(
			`ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH_BYTES} bytes (got ${key.length}). ` +
				"Generate one with: openssl rand -base64 32",
		);
	}

	cachedKey = key;
	return key;
}

/** Returns true if `value` looks like ciphertext produced by `encryptToken`. */
export function isEncrypted(value: string): boolean {
	return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Encrypts a token for storage. Pass-through for null/undefined/empty values
 * and for values that are already encrypted (idempotent — safe to call
 * unconditionally from write paths).
 */
export function encryptToken<T extends string | null | undefined>(value: T): T {
	if (value === null || value === undefined || value === "") return value;
	if (isEncrypted(value)) return value;

	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH_BYTES);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([
		cipher.update(value, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	const serialized = [
		iv.toString("base64url"),
		authTag.toString("base64url"),
		ciphertext.toString("base64url"),
	].join(".");

	return (ENCRYPTED_PREFIX + serialized) as T;
}

/**
 * Decrypts a token read from storage. Pass-through for null/undefined and for
 * legacy plaintext values (no `enc:v1:` prefix) — this is what keeps existing
 * unencrypted rows (e.g. on staging) readable without a prior migration.
 *
 * Never throws: if decryption fails (wrong/rotated key, corrupted data), logs
 * the error and returns null so callers degrade to "not connected" instead of
 * crashing (see `isStravaConnected` in server/services/strava.service.ts).
 */
export function decryptToken<T extends string | null | undefined>(
	value: T,
): T | null {
	if (value === null || value === undefined || value === "") return value;
	if (!isEncrypted(value)) return value;

	try {
		const key = getEncryptionKey();
		const serialized = value.slice(ENCRYPTED_PREFIX.length);
		const [ivPart, authTagPart, ciphertextPart] = serialized.split(".");
		if (!ivPart || !authTagPart || !ciphertextPart) {
			throw new Error("Malformed ciphertext envelope");
		}

		const iv = Buffer.from(ivPart, "base64url");
		const authTag = Buffer.from(authTagPart, "base64url");
		const ciphertext = Buffer.from(ciphertextPart, "base64url");

		const decipher = createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);
		const plaintext = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]);

		return plaintext.toString("utf8") as T;
	} catch (error) {
		console.error("Failed to decrypt token — degrading to null:", error);
		return null;
	}
}
