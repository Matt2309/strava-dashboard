import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
	processWebhookEvent,
	webhookEventSchema,
} from "@/server/services/strava.service";

// ---------------------------------------------------------------------------
// GET — Webhook verification (Strava hub challenge)
// ---------------------------------------------------------------------------

const verificationSchema = z.object({
	"hub.mode": z.literal("subscribe"),
	"hub.challenge": z.string(),
	"hub.verify_token": z.string(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
	const searchParams = Object.fromEntries(request.nextUrl.searchParams);
	const parsed = verificationSchema.safeParse(searchParams);

	if (!parsed.success) {
		return NextResponse.json(
			{ error: "Invalid verification request" },
			{ status: 400 },
		);
	}

	const { "hub.challenge": challenge, "hub.verify_token": verifyToken } =
		parsed.data;

	const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
	if (!expectedToken || verifyToken !== expectedToken) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return NextResponse.json({ "hub.challenge": challenge });
}

// ---------------------------------------------------------------------------
// POST — Webhook event delivery
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
	// Respond 200 immediately to prevent Strava from retrying the delivery
	const body: unknown = await request.json().catch(() => null);

	// Parse the event — if invalid, still return 200 so Strava doesn't retry
	const parsed = webhookEventSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ received: true }, { status: 200 });
	}

	// Process asynchronously without blocking the response
	processWebhookEvent(parsed.data).catch((err: unknown) => {
		console.error("[Strava Webhook] Failed to process event", err);
	});

	return NextResponse.json({ received: true }, { status: 200 });
}
