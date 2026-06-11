import { useMutation } from "@tanstack/react-query";
import orpcClient from "@/lib/orpc/client";

const acceptLatestPolicyProcedure = orpcClient.compliance.acceptLatestPolicy;
export const useAcceptLatestPolicy = () => {
	return useMutation({
		mutationFn: () => acceptLatestPolicyProcedure.call({}),
	});
};

const acceptLatestTermsProcedure = orpcClient.compliance.acceptLatestTerms;
export const useAcceptLatestTerms = () => {
	return useMutation({
		mutationFn: () => acceptLatestTermsProcedure.call({}),
	});
};
