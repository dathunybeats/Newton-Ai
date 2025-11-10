import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanForProduct, WHOP_USER_METADATA_KEY } from "@/lib/payments/whop";

export const runtime = "nodejs";

type WebhookPayload = {
  id: string;
  type: string;
  api_version?: string;
  data?: any;
};

const WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

function verifySignature(body: string, signatureHeader: string | null, timestampHeader: string | null) {
  if (!WEBHOOK_SECRET || !signatureHeader || !timestampHeader) {
    return false;
  }

  // Whop signature is just the base64 string, no prefix to split
  const signature = signatureHeader.trim();
  const signedPayload = `${timestampHeader}.${body}`;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(signedPayload)
    .digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function toIsoDate(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

function extractUserId(data: any) {
  const key = WHOP_USER_METADATA_KEY;
  return (
    data?.metadata?.[key] ??
    data?.member?.metadata?.[key] ??
    data?.member?.external_id ??
    null
  );
}

function extractMembershipId(data: any) {
  return data?.id ?? data?.membership_id ?? data?.membership?.id ?? null;
}

function extractProductId(data: any) {
  return data?.plan_id ?? data?.product_id ?? data?.plan?.id ?? null;
}

async function upsertSubscription(params: {
  membershipId: string;
  userId: string;
  productId: string;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  cancelAt: string | null;
}) {
  const plan = getPlanForProduct(params.productId);
  if (!plan) {
    return null;
  }

  const updatePayload = {
    user_id: params.userId,
    whop_membership_id: params.membershipId,
    product_id: params.productId,
    plan_interval: plan.interval,
    status: params.status,
    period_start: params.periodStart,
    period_end: plan.interval === "lifetime" ? null : params.periodEnd,
    cancel_at: params.cancelAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(updatePayload, {
      onConflict: "whop_membership_id",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function logEvent(eventType: string, payload: WebhookPayload, subscriptionId: string | null) {
  const { error } = await supabaseAdmin.from("subscription_events").insert({
    subscription_id: subscriptionId,
    event_type: eventType,
    payload,
  });

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headersList = await headers();

  const signatureHeader = headersList.get("webhook-signature");
  const timestampHeader = headersList.get("webhook-timestamp");

  // Allow bypass in development when headers are missing (test webhooks)
  const isDev = process.env.NODE_ENV !== "production";
  const hasSignatureHeaders = signatureHeader && timestampHeader;

  if (isDev) {
    console.log("Whop webhook debug", {
      signatureHeader,
      timestampHeader,
      signedPayload: timestampHeader ? `${timestampHeader}.${rawBody}` : null,
    });
  }

  // In production, require signature headers
  if (!isDev && !hasSignatureHeaders) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  // Verify signature only if headers are present
  if (hasSignatureHeaders && !verifySignature(rawBody, signatureHeader, timestampHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Whop uses 'action' not 'type' in webhook payload
  const eventType = payload.type || (payload as any).action;
  
  if (!eventType) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  const data = payload.data ?? {};
  let subscriptionId: string | null = null;

  try {
    if (eventType === "membership_activated" || eventType === "membership_deactivated") {
      const membershipId = extractMembershipId(data);
      const userId = extractUserId(data);
      const productId = extractProductId(data);

      if (membershipId && userId && productId) {
        const status = eventType === "membership_activated" ? "active" : "canceled";
        subscriptionId = await upsertSubscription({
          membershipId,
          userId,
          productId,
          status,
          periodStart: toIsoDate(data.current_period_start ?? data.period_start),
          periodEnd: toIsoDate(data.current_period_end ?? data.period_end),
          cancelAt: toIsoDate(data.cancel_at),
        });
      }
    }

    await logEvent(eventType, payload, subscriptionId);
  } catch (error) {
    console.error("Whop webhook handling failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}