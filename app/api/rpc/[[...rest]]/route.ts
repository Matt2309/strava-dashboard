import { createHash } from "node:crypto";
import { RPCHandler } from "@orpc/server/fetch";
import { getSessionCookie } from "better-auth/cookies";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { appRouter } from "@/routers";

const handler = new RPCHandler(appRouter);

const RPC_RATE_LIMIT_MAX = 500;
const RPC_RATE_LIMIT_WINDOW_SECONDS = 60;

/**
 * GDPR audit gap #6 (docs/gdpr-compliance-audit.md § 6.1): better-auth's
 * rate limiter (see lib/auth.ts) only covers /api/auth. Every personal-data
 * operation (export, delete account, activities) goes through /api/rpc, so
 * it needs its own limiter. This only runs for actual HTTP requests to this
 * route — the .callable() procedures invoked directly from server
 * components (lib/orpc/server.ts) never go through here, so internal
 * rendering never consumes a client's quota.
 */
function rateLimitKey(request: Request): string | null {
	// Prefer the session cookie so the bucket is per-user, not per-IP (several
	// users can share one IP behind Cloudflare/NAT). Hash it so the raw
	// session token never sits in memory.
	const cookie = getSessionCookie(request);
	if (cookie)
		return `sess:${createHash("sha256").update(cookie).digest("hex")}`;

	const ip = getClientIp(request);
	return ip ? `ip:${ip}` : null;
}

const handleRequest = async (request: Request) => {
	const key = rateLimitKey(request);
	if (key) {
		const { allowed, retryAfter } = consumeRateLimit(
			key,
			RPC_RATE_LIMIT_MAX,
			RPC_RATE_LIMIT_WINDOW_SECONDS,
		);
		if (!allowed) {
			return new Response(
				JSON.stringify({ message: "Troppe richieste. Riprova più tardi." }),
				{
					status: 429,
					headers: {
						"Content-Type": "application/json",
						"Retry-After": String(retryAfter),
					},
				},
			);
		}
	}
	// key === null: neither a session cookie nor a resolvable IP — no bucket
	// to charge, same trade-off better-auth makes (see get-request-ip.mjs).

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
