import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canCreateNote } from "@/lib/subscriptions";
import {
  generateNotesFromContent,
  generateTitleAndDescription,
} from "@/lib/openai-helpers";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate educational content from a user prompt
 */
async function generateContentFromPrompt(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert educational content generator. Your task is to take a user's learning prompt and generate comprehensive, detailed educational content on that topic.

**YOUR GOAL:**
Transform the user's prompt into rich, detailed educational content that can be used to create comprehensive study notes. Think of this as creating the "source material" from which notes will be extracted.

**CONTENT GUIDELINES:**
1. Be thorough and detailed - aim for 800-1500 words
2. Cover all major aspects of the topic
3. Include definitions, explanations, examples, and applications
4. Use clear, educational language
5. Organize information logically
6. Include relevant facts, figures, and key points
7. Provide context and background information
8. Explain concepts from fundamentals to advanced levels
9. Include real-world applications when relevant
10. Cover common misconceptions or important distinctions

**FORMAT:**
Write in a natural, flowing educational prose style (like a textbook or lecture). Don't use markdown formatting here - just clear paragraphs of educational content. The content will be processed later into structured notes.

Remember: You're creating the educational material that will be studied, not the study notes themselves.`,
      },
      {
        role: "user",
        content: `Generate comprehensive educational content about: ${prompt}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 3000,
  });

  return completion.choices[0]?.message?.content || "";
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

    // 2. Check subscription limits
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

    // 3. Get prompt from request
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 4. Generate educational content from the prompt
    console.log("Generating educational content from prompt...");
    const educationalContent = await generateContentFromPrompt(prompt.trim());

    if (!educationalContent || educationalContent.trim().length === 0) {
      throw new Error("Failed to generate educational content");
    }

    console.log(`Generated ${educationalContent.length} characters of educational content`);

    // 5. Generate structured notes from the educational content
    console.log("Converting educational content to structured notes...");
    const structuredNotes = await generateNotesFromContent(
      educationalContent,
      "pdf"
    );

    // 6. Generate title and description
    console.log("Generating title and description...");
    const { title, description } = await generateTitleAndDescription(
      educationalContent
    );

    // 7. Save to database
    const { data: note, error: dbError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: title,
        content: structuredNotes,
        transcript: educationalContent, // Store the generated content as transcript
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
    console.error("Generate note API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
