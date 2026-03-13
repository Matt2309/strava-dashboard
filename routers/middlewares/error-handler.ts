import { os } from "@orpc/server";

export const errorHandlerMiddleware = os.middleware(
  async ({ next, context }) => {
    try {
      const response = await next({
        context: context,
      });

      return response;
    } catch (error) {
      console.error("ERROR", error);
      throw error;
    }
  },
);
