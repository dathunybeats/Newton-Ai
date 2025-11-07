import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Innertube } from "youtubei.js";
import OpenAI from "openai";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });
}

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

    // 2. Get YouTube URL from request
    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // 3. Extract video ID
    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // 4. Fetch transcript using youtubei.js
    let transcriptText = "";

    try {
      console.log("Initializing YouTube client...");
      const youtube = await Innertube.create();

      console.log("Fetching video info...");
      const info = await youtube.getInfo(videoId);

      console.log("Getting transcript...");
      const transcriptData = await info.getTranscript();

      if (!transcriptData || !transcriptData.transcript) {
        throw new Error("No transcript available");
      }

      console.log("Transcript segments:", transcriptData.transcript.content?.body?.initial_segments?.length);

      // Extract text from transcript segments
      const segments = transcriptData.transcript.content?.body?.initial_segments || [];
      transcriptText = segments
        .map((segment: any) => segment.snippet?.text?.toString() || "")
        .filter((text: string) => text.trim().length > 0)
        .join(" ");

      console.log("Transcript text length:", transcriptText.length);
      console.log("First 200 chars:", transcriptText.substring(0, 200));

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

    // 5. Generate notes with AI
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert note-taking assistant. Generate comprehensive, well-structured notes from video transcripts.

Format the notes in Markdown with:
- Clear headings and subheadings
- Bullet points for key information
- Tables where appropriate
- Code blocks if technical content
- Emphasis on important concepts

Make the notes educational, organized, and easy to review.`,
        },
        {
          role: "user",
          content: `Generate comprehensive study notes from this video transcript:\n\n${transcriptText}`,
        },
      ],
      temperature: 0.7,
    });

    const generatedNotes = completion.choices[0].message.content;

    // 6. Generate title and summary
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Generate a concise title (max 60 characters) and a brief description (max 160 characters) for the video based on its transcript. Return the response as a JSON object with 'title' and 'description' fields.",
        },
        {
          role: "user",
          content: `Transcript: ${transcriptText.substring(0, 2000)}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const summaryData = JSON.parse(
      summaryCompletion.choices[0].message.content || "{}"
    );
    const title = summaryData.title || "YouTube Video Notes";
    const description =
      summaryData.description || "Notes generated from YouTube video";

    // 7. Save to database
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

    // 8. Return success
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
