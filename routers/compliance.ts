import { os } from "@orpc/server";
import {errorHandlerMiddleware} from "@/routers/middlewares/error-handler";
import {
    checkUserPolicyCompliance,
    getLatestPolicy,
    updatePolicyAcceptance
} from "@/server/repositories/policy.repository";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {revalidatePath} from "next/cache";


/**
 * Retrieves the latest active privacy policy from the database.
 */
export const retrieveLatestPolicy = os
    .handler(async () => {
        return await getLatestPolicy();
    })
    .use(errorHandlerMiddleware)
    .callable();

/**
 * Update the user's privacy policy acceptance status.
 */
export const acceptLatestPolicy = os
    .handler(async () => {
        const activePolicy =  await getLatestPolicy();
        if (!activePolicy) throw new Error("Nessuna policy attiva trovata");

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            throw new Error("Unauthorized: No active session");
        }

        await updatePolicyAcceptance(session.user.id, activePolicy.id);
        revalidatePath("/", "layout")
    })
    .use(errorHandlerMiddleware)
    .callable();

export const isUserAcceptedLastPolicy = os
    .handler(async () => {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            throw new Error("Unauthorized: No active session");
        }
        return checkUserPolicyCompliance(session?.user?.id)
    })
    .use(errorHandlerMiddleware)
    .callable();

export const complianceRouter = os.router({
    retrieveLatestPolicy,
    acceptLatestPolicy,
    isUserAcceptedLastPolicy
});

