import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content || "";

    console.log("OpenAI Response (first 500 chars):", responseText.substring(0, 500));

    // Parse the JSON response
    let parsedResponse;
    let questions;

    try {
      // Parse the JSON object
      parsedResponse = JSON.parse(responseText);

      // Extract questions array from the response
      if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
        questions = parsedResponse.questions;
      } else if (Array.isArray(parsedResponse)) {
        // In case it returns an array directly
        questions = parsedResponse;
      } else {
        console.error("Unexpected response format:", parsedResponse);
        throw new Error("Response does not contain a questions array");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Response text:", responseText);
      throw new Error("Failed to parse quiz questions from OpenAI response");
    }

    // Validate the questions format
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("Invalid questions format:", questions);
      throw new Error("Questions must be a non-empty array");
    }

    console.log(`Successfully parsed ${questions.length} questions`);

    // Save quiz questions to the database
    console.log("Saving quiz questions to database for note:", noteId);
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

    console.log("Quiz questions saved successfully:", updateData);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz questions" },
      { status: 500 }
    );
  }
}
