import { os } from "@orpc/server";

interface ErrorWithStatusCode extends Error {
	statusCode?: number;
}

export const errorHandlerMiddleware = os.middleware(
	async ({ next, context }) => {
		try {
			return await next({
				context: context,
			});
		} catch (error) {
			const err = error as ErrorWithStatusCode;
			const statusCode = err?.statusCode ?? 500;
			console.error(`ERROR [${statusCode}]`, error);
			throw error;
		}
	},
);
