/**
 * Operator recovery for GDPR audit gap #11 (docs/gdpr-compliance-audit.md
 * § 3): the ONLY self-service recovery from a 2FA lockout is the 10 backup
 * codes issued at enrolment. If a user loses both their authenticator app
 * and their backup codes, there is no account UI that can help them back
 * in — this script is the documented, auditable way an operator restores
 * access after verifying the user's identity out of band.
 *
 * It does all four things a real recovery needs in one transaction:
 *  - deletes the `TwoFactor` row (secret + backup codes)
 *  - flips `User.twoFactorEnabled` back to false — deleting only the
 *    `TwoFactor` row while leaving this true would be a PERMANENT lockout:
 *    sign-in would still branch into the 2FA flow, and
 *    /two-factor/verify-totp would then throw TOTP_NOT_ENABLED forever
 *  - deletes the user's sessions, forcing re-authentication
 *  - deletes `Verification` rows keyed by this userId (the 2FA challenge
 *    cookie and the "trust this device" cookie both live there)
 * ...and records a TWO_FACTOR_DISABLED audit event with
 * `metadata: { reason: "operator_recovery" }` — an operator silently
 * stripping a user's second factor is a very different fact from a
 * documented, attributable, timestamped one (Art. 5(2) accountability).
 *
 * Usage (email or user id both work):
 *   pnpm db:disable-2fa <email-or-user-id>       (local)
 *   pnpm stg-db:disable-2fa <email-or-user-id>   (staging)
 *   pnpm prod-db:disable-2fa <email-or-user-id>  (production)
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

async function main() {
	const identifier = process.argv[2];
	if (!identifier) {
		throw new Error(
			"Usage: tsx scripts/disable-two-factor.ts <email-or-user-id>",
		);
	}

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL environment variable is not set.");
	}

	const adapter = new PrismaPg({ connectionString });
	const prisma = new PrismaClient({ adapter });

	const isEmail = identifier.includes("@");
	const user = await prisma.user.findFirst({
		where: isEmail ? { email: identifier } : { id: identifier },
		select: { id: true, email: true, twoFactorEnabled: true },
	});

	if (!user) {
		throw new Error(`No user found for "${identifier}".`);
	}

	if (!user.twoFactorEnabled) {
		console.log(`User ${user.id} does not have 2FA enabled — nothing to do.`);
		await prisma.$disconnect();
		return;
	}

	await prisma.$transaction(async (tx) => {
		await tx.twoFactor.deleteMany({ where: { userId: user.id } });
		await tx.user.update({
			where: { id: user.id },
			data: { twoFactorEnabled: false },
		});
		await tx.session.deleteMany({ where: { userId: user.id } });
		await tx.verification.deleteMany({ where: { value: user.id } });
		await tx.auditLog.create({
			data: {
				subjectId: user.id,
				action: "TWO_FACTOR_DISABLED",
				metadata: { reason: "operator_recovery" },
			},
		});
	});

	console.log(`2FA disabled for user ${user.id} (${user.email}).`);
	console.log(
		"Every existing session was revoked; the user must sign in again.",
	);

	await prisma.$disconnect();
}

main().catch((error) => {
	console.error("2FA recovery failed:", error);
	process.exit(1);
});
