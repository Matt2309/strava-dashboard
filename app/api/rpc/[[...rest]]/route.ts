import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "@/routers";

const handler = new RPCHandler(appRouter);

const handleRequest = async (request: Request) => {
	const { response } = await handler.handle(request, {
		prefix: "/api/rpc",
		context: {},
	});

	return (
		response ??
		new Response("Not found", {
			status: 404,
		})
	);
};

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
