import { decryptToken, encryptToken } from "@/lib/encryption";
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Transparent AES-256-GCM encryption for `Account.accessToken`,
 * `Account.refreshToken` and `Account.idToken` (GDPR audit gap #4 — see
 * docs/gdpr-compliance-audit.md § "CRITICAL GAPS" #4).
 *
 * Because `lib/auth.ts` hands this same (extended) Prisma client to
 * `prismaAdapter`, better-auth's own reads/writes of the `account` table
 * (OAuth callbacks, token refresh, account linking) go through this
 * extension too — there is no separate call site to keep in sync.
 *
 * `Account.password` (better-auth's bcrypt hash for email/password accounts)
 * is intentionally left untouched.
 */

const TOKEN_FIELDS = ["accessToken", "refreshToken", "idToken"] as const;
type TokenField = (typeof TOKEN_FIELDS)[number];

function isTokenField(field: string): field is TokenField {
	return (TOKEN_FIELDS as readonly string[]).includes(field);
}

/** Encrypts the token fields of a single `data` object, in place. */
function encryptDataObject(data: unknown): void {
	if (!data || typeof data !== "object") return;

	for (const [field, value] of Object.entries(
		data as Record<string, unknown>,
	)) {
		if (!isTokenField(field)) continue;

		if (value && typeof value === "object" && "set" in value) {
			(value as Record<string, unknown>).set = encryptToken(
				(value as { set: string | null }).set,
			);
		} else if (typeof value === "string" || value === null) {
			(data as Record<string, unknown>)[field] = encryptToken(value);
		}
	}
}

/** Encrypts token fields in the write payload of a mutating operation. */
function encryptWriteArgs(operation: string, args: Record<string, unknown>) {
	switch (operation) {
		case "create":
		case "update":
			encryptDataObject(args.data);
			break;
		case "createMany":
		case "createManyAndReturn":
		case "updateMany":
		case "updateManyAndReturn":
			if (Array.isArray(args.data)) {
				for (const item of args.data) encryptDataObject(item);
			} else {
				encryptDataObject(args.data);
			}
			break;
		case "upsert":
			encryptDataObject(args.create);
			encryptDataObject(args.update);
			break;
		default:
			break;
	}
}

/** Decrypts token fields of a single record, in place. */
function decryptRecord<T>(record: T): T {
	if (!record || typeof record !== "object") return record;

	for (const field of TOKEN_FIELDS) {
		const value = (record as Record<string, unknown>)[field];
		if (typeof value === "string" || value === null) {
			(record as Record<string, unknown>)[field] = decryptToken(value);
		}
	}

	return record;
}

/** Decrypts token fields in a query result (single record, array, or null). */
function decryptResult<T>(result: T): T {
	if (Array.isArray(result)) {
		for (const item of result) decryptRecord(item);
		return result;
	}
	return decryptRecord(result);
}

export const accountTokenEncryption = Prisma.defineExtension({
	name: "account-token-encryption",
	query: {
		account: {
			async $allOperations({ operation, args, query }) {
				encryptWriteArgs(operation, args as Record<string, unknown>);
				const result = await query(args);
				return decryptResult(result);
			},
		},
	},
});
