import { os } from "@orpc/server";
import { router as stravaRouter } from "@/routers/strava";
import { errorHandlerMiddleware } from "@/routers/middlewares/error-handler";

const baseRouter = os.use(errorHandlerMiddleware);

const appRouter = baseRouter.router({
  account: stravaRouter,
});

export default appRouter;
