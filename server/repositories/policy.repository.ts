import { prisma } from "@/lib/prisma";

/**
 * Get the latest privacy policy.
 */
export async function getLatestPolicy() {
    return prisma.privacyPolicy.findFirst({
        where: { isActive: true },
        orderBy: {
            publishedAt: 'desc'
        }
    })
}

/**
 * Check if the user has accepted the latest active privacy policy.
 * @param userId - The ID of the user.
 * @returns True if compliant, false otherwise.
 */
export async function checkUserPolicyCompliance(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            privacyPolicyId: true,
            privacyConsentTimestamp: true
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    const activePolicy = await getLatestPolicy();

    if (!activePolicy) {
        // No active policy, consider compliant
        return true;
    }

    // User is compliant if they have accepted the active policy
    return user.privacyPolicyId === activePolicy.id;
}