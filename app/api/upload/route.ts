import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { canCreateNote } from "@/lib/subscriptions";
import { extractTextFromPDFFile } from "@/lib/pdf-helpers";
import {
  generateNotesFromContent,
  generateTitleAndDescription,
} from "@/lib/openai-helpers";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
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

    // Check subscription limits
    const noteCheck = await canCreateNote(user.id);

    console.log("Note creation check:", {
      userId: user.id,
      allowed: noteCheck.allowed,
      currentCount: noteCheck.currentCount,
      limit: noteCheck.limit,
      tier: noteCheck.tier
    });

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

    // Get the file from the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "audio/aac",
      "audio/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and audio files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Determine file type category
    let fileType = "pdf";
    if (file.type.startsWith("audio/")) {
      fileType = "audio";
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/\s+/g, "_");
    const uniqueFilename = `${user.id}/${timestamp}-${sanitizedName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Calculate file size in MB
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    // Create upload record in database
    const { data: uploadRecord, error: dbError } = await supabase
      .from("uploads")
      .insert({
        user_id: user.id,
        filename: file.name,
        file_type: fileType,
        file_size_mb: parseFloat(fileSizeMB),
        storage_path: uploadData.path,
        status: "completed",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      // Cleanup uploaded file if database insert fails
      await supabase.storage.from("uploads").remove([uploadData.path]);
      return NextResponse.json(
        { error: "Failed to create upload record" },
        { status: 500 }
      );
    }

    // Generate notes for PDFs and Audio
    let noteContent = "";
    let noteTitle = file.name.replace(/\.[^/.]+$/, ""); // Default: filename without extension
    let extractedText = "";

    if (fileType === "pdf") {
      try {
        console.log("Extracting text from PDF...");

        // Extract text from PDF
        extractedText = await extractTextFromPDFFile(buffer);

        console.log(
          `Extracted ${extractedText.length} characters from PDF`
        );

        // Generate AI notes from extracted text
        console.log("Generating AI notes from PDF content...");
        noteContent = await generateNotesFromContent(extractedText, "pdf");

        // Generate better title and description
        console.log("Generating title and description...");
        const { title } = await generateTitleAndDescription(extractedText);
        noteTitle = title;

        console.log("PDF notes generated successfully");
      } catch (error: any) {
        console.error("PDF processing error:", error);
        // Continue with empty content rather than failing the entire upload
        // This allows the file to still be uploaded even if AI processing fails
        noteContent = "";
        extractedText = "";
      }
    } else if (fileType === "audio") {
      try {
        console.log("Transcribing audio file...");

        // Transcribe audio using OpenAI Whisper
        const audioFile = new File([buffer], file.name, { type: file.type });
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
        });

        extractedText = transcription.text;
        console.log(`Transcribed ${extractedText.length} characters from audio`);

        // Generate AI notes from transcription
        console.log("Generating AI notes from audio transcription...");
        noteContent = await generateNotesFromContent(extractedText, "audio");

        // Generate better title
        console.log("Generating title...");
        const { title } = await generateTitleAndDescription(extractedText);
        noteTitle = title;

        console.log("Audio notes generated successfully");
      } catch (error: any) {
        console.error("Audio processing error:", error);
        noteContent = "";
        extractedText = "";
      }
    }

    // Create a note for this upload
    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        upload_id: uploadRecord.id,
        title: noteTitle,
        content: noteContent, // Now populated for PDFs!
        transcript: extractedText || null, // Store original PDF text
      })
      .select()
      .single();

    if (noteError) {
      console.error("Note creation error:", noteError);
      return NextResponse.json(
        { error: "Failed to create note" },
        { status: 500 }
      );
    }

    // Get PDF URL from storage
    let pdfUrl = null;
    if (fileType === "pdf") {
      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(uploadData.path);

      if (urlData) {
        pdfUrl = urlData.publicUrl;
      }
    }

    return NextResponse.json({
      success: true,
      noteId: noteData.id,
      upload: uploadRecord,
      note: {
        ...noteData,
        uploads: {
          filename: file.name,
          file_type: fileType,
          storage_path: uploadData.path,
        },
      },
      pdfUrl,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
