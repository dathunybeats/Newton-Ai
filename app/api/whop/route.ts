import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanForProduct, WHOP_USER_METADATA_KEY } from "@/lib/payments/whop";
import { whopSdk } from "@/lib/whop-sdk";

export const runtime = "nodejs";

type WebhookPayload = {
  id: string;
  type: string;
  api_version?: string;
  data?: any;
};


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
  try {
    // Get raw body and headers for Whop SDK verification
    const rawBody = await request.text();
    const headersList = await headers();
    const headersObject = Object.fromEntries(headersList);

    // Use Whop SDK to verify and unwrap the webhook
    // This handles signature verification automatically
    let webhookData: WebhookPayload;

    try {
      webhookData = whopSdk.webhooks.unwrap(rawBody, { headers: headersObject });
    } catch (error) {
      // Allow through if no webhook secret is configured (development/testing)
      if (!process.env.WHOP_WEBHOOK_SECRET) {
        webhookData = JSON.parse(rawBody);
      } else {
        console.error("Webhook signature verification failed:", error);
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Get event type (handle both 'type' and 'action' fields)
    const eventType = webhookData.type || (webhookData as any).action;

    if (!eventType) {
      return NextResponse.json({ error: "Missing event type" }, { status: 400 });
    }

    const data = webhookData.data ?? {};
    let subscriptionId: string | null = null;

    // Handle membership events
    if (
      eventType === "membership.went_valid" ||
      eventType === "membership_activated" ||
      eventType === "payment.succeeded" ||
      eventType === "payment_succeeded"
    ) {
      const membershipId = extractMembershipId(data);
      const userId = extractUserId(data);
      const productId = extractProductId(data);

      if (membershipId && userId && productId) {
        subscriptionId = await upsertSubscription({
          membershipId,
          userId,
          productId,
          status: "active",
          periodStart: toIsoDate(data.current_period_start ?? data.period_start),
          periodEnd: toIsoDate(data.current_period_end ?? data.period_end),
          cancelAt: toIsoDate(data.cancel_at),
        });
      } else {
        console.error("Webhook missing required fields:", { membershipId, userId, productId });
      }
    } else if (eventType === "membership.went_invalid" || eventType === "membership_deactivated") {
      const membershipId = extractMembershipId(data);
      const userId = extractUserId(data);
      const productId = extractProductId(data);

      if (membershipId && userId && productId) {
        subscriptionId = await upsertSubscription({
          membershipId,
          userId,
          productId,
          status: "canceled",
          periodStart: toIsoDate(data.current_period_start ?? data.period_start),
          periodEnd: toIsoDate(data.current_period_end ?? data.period_end),
          cancelAt: toIsoDate(data.cancel_at),
        });
      }
    }

    // Log the event
    await logEvent(eventType, webhookData, subscriptionId);

    // Return 200 quickly to avoid webhook retries
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Whop webhook handling failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}