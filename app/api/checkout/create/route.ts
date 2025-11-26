import { NextResponse } from "next/server";
import { whopSdk } from "@/lib/whop-sdk";
import { WHOP_USER_METADATA_KEY } from "@/lib/payments/whop";

export const runtime = "nodejs";

const WHOP_COMPANY_ID = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

if (!WHOP_COMPANY_ID) {
  console.error("Missing NEXT_PUBLIC_WHOP_COMPANY_ID environment variable");
}

interface CreateCheckoutRequest {
  planId: string;
  userId: string;
  email: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateCheckoutRequest = await request.json();
    const { planId, userId, email } = body;

    // Validate required fields
    if (!planId || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: planId, userId, email" },
        { status: 400 }
      );
    }

    if (!WHOP_COMPANY_ID) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Whop company ID" },
        { status: 500 }
      );
    }

    // Create checkout configuration with metadata using shared SDK
    // Using plan_id to reference existing plan (simpler approach)
    const checkoutConfig = await whopSdk.checkoutConfigurations.create({
      plan_id: planId,
      metadata: {
        [WHOP_USER_METADATA_KEY]: userId,
      },
      // Redirect URL after successful checkout
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.newtonstudy.app"}/success`,
    });

    // Add email as query parameter to prefill in checkout
    // Try common parameter names that Whop might support
    const purchaseUrl = new URL(checkoutConfig.purchase_url, process.env.NEXT_PUBLIC_SITE_URL || "https://whop.com");
    purchaseUrl.searchParams.set("email", email);
    purchaseUrl.searchParams.set("prefilled_email", email);

    const finalPurchaseUrl = purchaseUrl.toString();

    // Return the purchase URL
    return NextResponse.json({
      success: true,
      purchaseUrl: finalPurchaseUrl,
      sessionId: checkoutConfig.id,
    });
  } catch (error: any) {
    console.error("Failed to create checkout configuration:", error);

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
