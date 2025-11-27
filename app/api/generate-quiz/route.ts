import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { content, title, noteId } = await request.json();

    if (!content || !title || !noteId) {
      return NextResponse.json(
        { error: "Content, title, and noteId are required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user owns this note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, user_id")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .single();

    if (noteError || !note) {
      console.error("Note verification error:", noteError);
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    const systemPrompt = `You are an educational quiz generator. Generate quiz questions in valid JSON format only.`;

    const userPrompt = `Based on the following note content, generate exactly 15 multiple-choice questions that will help the user learn and retain the most important concepts.

Note Title: ${title}

Note Content:
${content}

Requirements:
- Create 15 questions that cover the most important topics and concepts from the note
- Each question should have 4 answer options
- Questions should test understanding, not just memorization
- Focus on key concepts, main ideas, and practical applications
- Include a brief explanation for each correct answer
- Make the questions progressive (start with basic concepts, move to more complex ones)

Return a JSON object with a "questions" field containing the array:
{
  "questions": [
    {
      "id": "q1",
      "prompt": "Question text here?",
      "options": [
        {"id": "a", "label": "Option A text"},
        {"id": "b", "label": "Option B text"},
        {"id": "c", "label": "Option C text"},
        {"id": "d", "label": "Option D text"}
      ],
      "answerId": "a",
      "explanation": "Brief explanation of why this is correct and what concept it tests."
    }
  ]
}`;

    const { text } = await generateText({
      model: openai('gpt-4o', { structuredOutputs: true }),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      maxOutputTokens: 4096,
    });

    // Parse JSON response
    const parsedResponse = JSON.parse(text) as { questions?: any[] } | any[];
    let questions;

    if (Array.isArray(parsedResponse)) {
      questions = parsedResponse;
    } else if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
      questions = parsedResponse.questions;
    } else {
      console.error("Unexpected response format:", parsedResponse);
      throw new Error("Response does not contain a questions array");
    }

    // Validate the questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("Invalid questions format:", questions);
      throw new Error("Questions must be a non-empty array");
    }

    // Save quiz questions to the database
    const { data: updateData, error: updateError } = await supabase
      .from("notes")
      .update({ quiz_questions: questions })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select();

    if (updateError) {
      console.error("Error saving quiz questions:", updateError);
      return NextResponse.json(
        { error: "Failed to save quiz questions", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz questions" },
      { status: 500 }
    );
  }
}
