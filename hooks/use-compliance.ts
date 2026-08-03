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
