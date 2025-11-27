import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Innertube } from "youtubei.js";
import { canCreateNote, hasActiveSubscription } from "@/lib/subscriptions";
import {
  generateNotesFromContent,
  generateTitleAndDescription,
} from "@/lib/openai-helpers";
import { checkRateLimit } from "@/lib/rate-limit";

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export async function POST(request: NextRequest) {
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
          error: "Rate limit exceeded",
          message: `You've reached your limit of ${rateLimitResult.limit} notes per hour. ${
            isPaid ? "Please try again" : "Upgrade for higher limits"
          } in ${minutesUntilReset} minutes.`,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          resetIn: minutesUntilReset,
          upgradeRequired: !isPaid,
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

    // 3. Check subscription limits
    const noteCheck = await canCreateNote(user.id);

    if (!noteCheck.allowed) {
      return NextResponse.json(
        {
          error: "Note limit reached",
          message: `You've reached your limit of ${noteCheck.limit} notes on the ${noteCheck.tier} plan. Upgrade to create unlimited notes!`,
          currentCount: noteCheck.currentCount,
          limit: noteCheck.limit,
          tier: noteCheck.tier,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // 4. Get YouTube URL from request
    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // 5. Extract video ID
    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // 6. Fetch transcript using youtubei.js
    let transcriptText = "";

    try {
      const youtube = await Innertube.create();
      const info = await youtube.getInfo(videoId);
      const transcriptData = await info.getTranscript();

      if (!transcriptData || !transcriptData.transcript) {
        throw new Error("No transcript available");
      }

      // Extract text from transcript segments
      const segments = transcriptData.transcript.content?.body?.initial_segments || [];
      transcriptText = segments
        .map((segment: any) => segment.snippet?.text?.toString() || "")
        .filter((text: string) => text.trim().length > 0)
        .join(" ");

      if (!transcriptText || transcriptText.trim().length === 0) {
        throw new Error("Transcript is empty");
      }
    } catch (error: any) {
      console.error("Transcript fetch error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        videoId,
      });
      return NextResponse.json(
        {
          error:
            "Could not fetch transcript. The video may be private, deleted, or have captions disabled.",
          details: error.message || String(error),
        },
        { status: 400 }
      );
    }

    // 6. Generate notes with AI
    const generatedNotes = await generateNotesFromContent(
      transcriptText,
      "youtube"
    );

    // 7. Generate title and summary
    const { title, description } = await generateTitleAndDescription(
      transcriptText
    );

    // 8. Save to database
    const { data: note, error: dbError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: title,
        content: generatedNotes,
        youtube_url: youtubeUrl,
        transcript: transcriptText,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save note" },
        { status: 500 }
      );
    }

    // 9. Return success
    return NextResponse.json({
      success: true,
      noteId: note.id,
      note: note,
    });
  } catch (error: any) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
