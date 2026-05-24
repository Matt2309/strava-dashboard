import { os } from "@orpc/server";
import {errorHandlerMiddleware} from "@/routers/middlewares/error-handler";
import {getLatestPolicy} from "@/server/repositories/policy.repository";


/**
 * Retrieves the latest active privacy policy from the database.
 */
export const retrieveLatestPolicy = os
    .handler(async () => {
        return await getLatestPolicy();
    })
    .use(errorHandlerMiddleware)
    .callable();

export const complianceRouter = os.router({
    retrieveLatestPolicy
});
