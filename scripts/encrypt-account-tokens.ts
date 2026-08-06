/**
 * One-off backfill for GDPR audit gap #4 (docs/gdpr-compliance-audit.md
 * § "CRITICAL GAPS" #4): encrypts any `Account.accessToken` /
 * `refreshToken` / `idToken` still stored in plaintext (e.g. rows created
 * before the AES-256-GCM Prisma extension existed).
 *
 * Safe to run at any time and any number of times:
 *  - Rows already encrypted (`enc:v1:` prefix) are left untouched.
 *  - The app does NOT depend on this script having run — the encryption
 *    extension's `decryptToken` passes plaintext through unchanged — so
 *    this can be run whenever is convenient after deploying, without a
 *    maintenance window.
 *
 * IMPORTANT: this script intentionally builds its own PrismaClient WITHOUT
 * the `accountTokenEncryption` extension. Using the extended client (e.g.
 * the one exported from lib/prisma.ts) would decrypt on read and re-encrypt
 * on write, making every row look "already encrypted" and turning this
 * script into a silent no-op.
 *
 * Usage:
 *   pnpm db:encrypt-tokens       (local)
 *   pnpm stg-db:encrypt-tokens   (staging)
 *   pnpm prod-db:encrypt-tokens  (production)
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { encryptToken, isEncrypted } from "@/lib/encryption";
import { PrismaClient } from "@/lib/generated/prisma/client";

const TOKEN_FIELDS = ["accessToken", "refreshToken", "idToken"] as const;
type TokenField = (typeof TOKEN_FIELDS)[number];

async function main() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL environment variable is not set.");
	}

	const adapter = new PrismaPg({ connectionString });
	const prisma = new PrismaClient({ adapter }); // NOT extended — see header comment

	const accounts = await prisma.account.findMany({
		where: {
			OR: TOKEN_FIELDS.map((field) => ({ [field]: { not: null } })),
		},
		select: { id: true, accessToken: true, refreshToken: true, idToken: true },
	});

	let rowsUpdated = 0;
	let fieldsEncrypted = 0;
	let fieldsAlreadyEncrypted = 0;

	for (const account of accounts) {
		const data: Partial<Record<TokenField, string>> = {};

		for (const field of TOKEN_FIELDS) {
			const value = account[field];
			if (value === null) continue;
			if (isEncrypted(value)) {
				fieldsAlreadyEncrypted++;
				continue;
			}
			data[field] = encryptToken(value);
			fieldsEncrypted++;
		}

		if (Object.keys(data).length === 0) continue;

		await prisma.account.update({ where: { id: account.id }, data });
		rowsUpdated++;
	}

	console.log("Account token encryption backfill complete:");
	console.log(`  Accounts scanned:        ${accounts.length}`);
	console.log(`  Rows updated:            ${rowsUpdated}`);
	console.log(`  Fields newly encrypted:  ${fieldsEncrypted}`);
	console.log(`  Fields already encrypted:${fieldsAlreadyEncrypted}`);

	await prisma.$disconnect();
}

main().catch((error) => {
	console.error("Backfill failed:", error);
	process.exit(1);
});
