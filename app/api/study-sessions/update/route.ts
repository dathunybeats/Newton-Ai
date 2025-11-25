import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
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
    const { sessionId, totalDuration, pauseTime } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Update the study session
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (totalDuration !== undefined) {
      updateData.total_duration = totalDuration;
    }

    // Allow setting pause_time to null (for resume)
    if (pauseTime !== undefined) {
      updateData.pause_time = pauseTime;
    }

    const { data: session, error } = await supabase
      .from("study_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .select()
      .single();

    if (error) {
      console.error("Error updating study session:", error);
      return NextResponse.json(
        { error: "Failed to update study session" },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: "Active session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error in update session route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
