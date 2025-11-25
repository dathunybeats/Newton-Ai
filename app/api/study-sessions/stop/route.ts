import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, totalDuration } = body;

    if (!sessionId || totalDuration === undefined) {
      return NextResponse.json(
        { error: "Session ID and total duration are required" },
        { status: 400 }
      );
    }

    // Stop the study session by marking it as inactive
    const { data: session, error } = await supabase
      .from("study_sessions")
      .update({
        is_active: false,
        end_time: new Date().toISOString(),
        total_duration: totalDuration,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .select()
      .single();

    if (error) {
      console.error("Error stopping study session:", error);
      return NextResponse.json(
        { error: "Failed to stop study session" },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Active session not found" },
        { status: 404 }
      );
    }

    // The trigger will automatically update study_stats

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error in stop session route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
