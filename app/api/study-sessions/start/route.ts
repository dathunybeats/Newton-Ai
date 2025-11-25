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
    const { subject } = body;

    // Check if user already has an active session
    const { data: existingSession } = await supabase
      .from("study_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (existingSession) {
      return NextResponse.json(
        { error: "You already have an active study session" },
        { status: 400 }
      );
    }

    // Create a new study session
    const { data: session, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: user.id,
        subject: subject || null,
        start_time: new Date().toISOString(),
        is_active: true,
        total_duration: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating study session:", error);
      return NextResponse.json(
        { error: "Failed to start study session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error in start session route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
