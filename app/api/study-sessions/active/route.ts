import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Get the user's active session
    const { data: session, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found" error
      console.error("Error fetching active session:", error);
      return NextResponse.json(
        { error: "Failed to fetch active session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: session || null });
  } catch (error) {
    console.error("Error in active session route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
