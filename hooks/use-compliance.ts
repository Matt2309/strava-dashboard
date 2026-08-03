import { useMutation } from "@tanstack/react-query";
import orpcClient from "@/lib/orpc/client";

const acceptLegalDocumentsProcedure =
	orpcClient.compliance.acceptLegalDocuments;
export const useAcceptLegalDocuments = () => {
	return useMutation({
		mutationFn: (input: { policy: boolean; terms: boolean }) =>
			acceptLegalDocumentsProcedure.call(input),
	});
};

// --- exportUserData (Art. 15/20 — Right of Access & Portability) ---
// A mutation, not a query: it must run only on explicit user confirmation
// and never be cached (staleTime: 0 + refetchOnWindowFocus would otherwise
// silently re-fetch a heavy payload).
const exportUserDataProcedure = orpcClient.compliance.exportUserData;
export const useExportUserData = () => {
	return useMutation({
		mutationFn: () => exportUserDataProcedure.call({}),
	});
};

// --- deleteAccount (Art. 17 — Right to Erasure) ---
const deleteAccountProcedure = orpcClient.compliance.deleteAccount;
export const useDeleteAccount = () => {
	return useMutation({
		mutationFn: () => deleteAccountProcedure.call({}),
	});
};
