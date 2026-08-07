import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { accountTokenEncryption } from "@/lib/prisma-extensions/account-token-encryption";

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL environment variable is not set.");
	}
	const adapter = new PrismaPg({ connectionString });
	// $extends applies AES-256-GCM encryption to Account OAuth tokens on
	// write/read — see lib/prisma-extensions/account-token-encryption.ts.
	return new PrismaClient({ adapter }).$extends(accountTokenEncryption);
}

declare global {
	// eslint-disable-next-line no-var
	var __prisma: ReturnType<typeof createPrismaClient> | undefined;
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalThis.__prisma = prisma;
}
