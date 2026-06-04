import { useMutation } from "@tanstack/react-query";
import orpcClient from "@/lib/orpc/client";

// --- acceptLatestPolicy ---
const acceptLatestPolicyProcedure = orpcClient.compliance.acceptLatestPolicy;
export const useAcceptLatestPolicy = () => {
    return useMutation({
        mutationFn: () => acceptLatestPolicyProcedure.call({}),
    });
};

