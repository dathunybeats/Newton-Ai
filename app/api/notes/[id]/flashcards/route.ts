import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

    // Get flashcards for this note
    const { data: flashcards, error } = await supabase
      .from("flashcards")
      .select("id, question, answer, created_at")
      .eq("note_id", noteId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      flashcards: flashcards || [],
      count: flashcards?.length || 0,
    });
  } catch (error: any) {
    console.error("Flashcard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}
