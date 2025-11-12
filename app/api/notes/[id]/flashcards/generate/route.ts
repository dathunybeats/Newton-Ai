import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Flashcard {
  question: string;
  answer: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: noteId } = await params;

    // Get the note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, title, content, user_id")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if note has content
    if (!note.content || note.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note has no content to generate flashcards from. Please wait for the note to be processed or add content manually." },
        { status: 400 }
      );
    }

    // Check if flashcards already exist
    const { data: existingFlashcards } = await supabase
      .from("flashcards")
      .select("id")
      .eq("note_id", noteId)
      .limit(1);

    if (existingFlashcards && existingFlashcards.length > 0) {
      return NextResponse.json(
        { error: "Flashcards already exist for this note" },
        { status: 400 }
      );
    }

    // Generate flashcards using OpenAI
    const prompt = `You are a study assistant that creates flashcards from educational content.

Given the following note content, generate 10-15 flashcard question-answer pairs.

Guidelines:
- Create clear, concise questions
- Mix question types (definition, concept, application, comparison)
- Answers should be brief but complete (1-3 sentences)
- Focus on key concepts and important information
- Questions should test understanding, not just memory

Note Title: ${note.title}

Note Content:
${note.content}

Return ONLY a JSON array of objects with "question" and "answer" fields. No additional text.
Example format: [{"question": "What is...", "answer": "It is..."}, ...]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful study assistant that creates educational flashcards. Return only valid JSON arrays.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content?.trim();
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response (handle markdown code blocks)
    let flashcards: Flashcard[];
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = responseText;
      if (responseText.startsWith('```')) {
        cleanedResponse = responseText
          .replace(/^```json\n?/, '')
          .replace(/^```\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
      }
      flashcards = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseText);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate flashcards
    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new Error("No flashcards generated");
    }

    // Save flashcards to database
    const flashcardsToInsert = flashcards.map((card) => ({
      user_id: user.id,
      note_id: noteId,
      question: card.question,
      answer: card.answer,
    }));

    const { data: savedFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      flashcards: savedFlashcards,
      count: savedFlashcards?.length || 0,
    });
  } catch (error: any) {
    console.error("Flashcard generation error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to generate flashcards",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
