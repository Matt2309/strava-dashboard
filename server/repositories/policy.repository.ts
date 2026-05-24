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
