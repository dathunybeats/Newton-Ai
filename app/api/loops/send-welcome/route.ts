import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, updateLoopsContact } from "@/lib/loops";

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, userId } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if API key is set
    if (!process.env.LOOPS_API_KEY) {
      return NextResponse.json(
        { error: "LOOPS_API_KEY not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    // Send welcome email (only this, skip contact update for now)
    const result = await sendWelcomeEmail(email, firstName);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    // Optionally update contact (don't fail if this fails)
    if (userId || firstName) {
      try {
        await updateLoopsContact(email, {
          userId: userId,
          firstName: firstName,
          status: "active",
        });
      } catch (contactError) {
        console.error("Failed to update contact (non-critical):", contactError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in send-welcome:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
