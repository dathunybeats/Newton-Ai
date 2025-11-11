import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscriptionStatusAdmin } from "@/lib/subscriptions";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check subscription status
    const status = await getSubscriptionStatusAdmin(user.id);

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      tier: status.tier,
      isActive: status.isActive,
      limits: status.limits,
      subscription: status.subscription,
    });
  } catch (error) {
    console.error("Test subscription error:", error);
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}
