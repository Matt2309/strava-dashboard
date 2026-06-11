import { prisma } from "@/lib/prisma";

export async function getLatestTerms() {
	return prisma.termsConditions.findFirst({
		where: { isActive: true },
		orderBy: { publishedAt: "desc" },
	});
}

export async function updateTermsAcceptance(userId: string, termsId: string) {
	return prisma.user.update({
		where: { id: userId },
		data: {
			termsConditionsId: termsId,
			termsConsentTimestamp: new Date(),
		},
	});
}

export async function checkUserTermsCompliance(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			termsConditionsId: true,
			termsConsentTimestamp: true,
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	const activeTerms = await getLatestTerms();

	if (!activeTerms) {
		return true;
	}

	return user.termsConditionsId === activeTerms.id;
}
