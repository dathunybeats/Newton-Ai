import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/subscriptions";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Test endpoint to verify rate limiting is working
 * WITHOUT making expensive OpenAI API calls
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check rate limit
    const isPaid = await hasActiveSubscription(user.id);
    const rateLimitResult = await checkRateLimit(user.id, isPaid, "note");

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      const minutesUntilReset = Math.ceil(
        (resetDate.getTime() - Date.now()) / 1000 / 60
      );

      return NextResponse.json(
        {
          success: false,
          rateLimited: true,
          error: "Rate limit exceeded",
          message: `You've reached your limit of ${rateLimitResult.limit} notes per hour. ${
            isPaid ? "Please try again" : "Upgrade for higher limits"
          } in ${minutesUntilReset} minutes.`,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          resetIn: minutesUntilReset,
          resetDate: resetDate.toISOString(),
          isPaid,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // 3. Success - rate limit not exceeded
    const resetDate = new Date(rateLimitResult.reset);
    const minutesUntilReset = Math.ceil(
      (resetDate.getTime() - Date.now()) / 1000 / 60
    );

    return NextResponse.json(
      {
        success: true,
        rateLimited: false,
        message: "Rate limit check passed! You can create a note.",
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
        resetIn: minutesUntilReset,
        resetDate: resetDate.toISOString(),
        isPaid,
        userInfo: {
          userId: user.id,
          email: user.email,
          tier: isPaid ? "paid" : "free",
        },
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error("Test rate limit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
