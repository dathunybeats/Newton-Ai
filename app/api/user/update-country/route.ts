import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/user/update-country - Update user's country based on IP geolocation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get country from request body (sent from client after geo lookup)
    const { country, country_code } = await request.json();

    if (!country || !country_code) {
      return NextResponse.json({ error: "Country data required" }, { status: 400 });
    }

    // Update user's profile with country info
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        country,
        country_code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating country:", updateError);
      return NextResponse.json({ error: "Failed to update country" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Country updated successfully",
    });

  } catch (error) {
    console.error("Error in update-country:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
