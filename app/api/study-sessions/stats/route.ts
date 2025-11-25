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

    // Get user's study stats
    const { data: stats, error: statsError } = await supabase
      .from("study_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If no stats exist yet, create initial stats
    if (statsError && statsError.code === "PGRST116") {
      const { data: newStats, error: insertError } = await supabase
        .from("study_stats")
        .insert({
          user_id: user.id,
          total_time: 0,
          total_sessions: 0,
          current_streak: 0,
          longest_streak: 0,
          weekly_goal: 72000, // 20 hours default
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating study stats:", insertError);
        return NextResponse.json(
          { error: "Failed to create study stats" },
          { status: 500 }
        );
      }

      // Get weekly time using the function
      const { data: weeklyData, error: weeklyError } = await supabase
        .rpc("get_weekly_study_time", { p_user_id: user.id });

      if (weeklyError) {
        console.error("Error fetching weekly time:", weeklyError);
      }

      return NextResponse.json({
        stats: {
          ...newStats,
          weekly_time: weeklyData || 0,
        },
      });
    }

    if (statsError) {
      console.error("Error fetching study stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch study stats" },
        { status: 500 }
      );
    }

    // Get weekly time using the function
    const { data: weeklyData, error: weeklyError } = await supabase
      .rpc("get_weekly_study_time", { p_user_id: user.id });

    if (weeklyError) {
      console.error("Error fetching weekly time:", weeklyError);
    }

    return NextResponse.json({
      stats: {
        ...stats,
        weekly_time: weeklyData || 0,
      },
    });
  } catch (error) {
    console.error("Error in stats route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
