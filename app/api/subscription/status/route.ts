import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatusAdmin } from "@/lib/subscriptions";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getSubscriptionStatusAdmin(user.id);

    return NextResponse.json({
      tier: status.tier,
      isActive: status.isActive,
      limits: status.limits,
    });
  } catch (error: any) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
