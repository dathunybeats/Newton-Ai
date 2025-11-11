"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNoteContext } from "@/contexts/NoteContext";
import { useSidebar } from "@/app/home/layout";
import Link from "next/link";
import MarkdownPreview from "@uiw/react-markdown-preview";
import FolderAssignmentModal from "@/components/notes/FolderAssignmentModal";
import NoteQuiz from "@/components/quiz/NoteQuiz";
import { FlashcardViewer } from "@/components/flashcards/FlashcardViewer";
import { Modal, ModalContent } from "@heroui/modal";

interface Note {
  id: string;
  title: string;
  content: string;
  upload_id?: string | null;
  created_at: string;
  youtube_url?: string;
  transcript?: string;
  folder_id?: string | null;
  quiz_questions?: any[] | null;
  uploads?: {
    filename: string;
    file_type: string;
    storage_path: string;
  };
}

type TabType = "note" | "quiz" | "flashcards" | "transcript";

type TranscriptSegment = {
  id: string;
  timeLabel?: string;
  text: string;
};

// Extract video ID from YouTube URL
function getYouTubeVideoId(url: string): string | null {
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

export default function NotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string;
  const { user, loading: authLoading } = useAuth();
  const { prefetchedNote, setPrefetchedNote, getNote } = useNoteContext();
  const { setSidebarOpen } = useSidebar();

  const [note, setNote] = useState<Note | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("note");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  const transcriptSegments = useMemo(() => {
    if (!note?.transcript) return [];
    return formatTranscript(note.transcript ?? "");
  }, [note?.transcript]);

  useEffect(() => {
    // Priority 1: Check prefetched data (from navigation)
    if (prefetchedNote && prefetchedNote.id === noteId) {
      setNote(prefetchedNote);
      setPdfUrl(prefetchedNote.pdfUrl || null);
      setLoading(false);
      setPrefetchedNote(null);
      // Fetch flashcards for prefetched note
      fetchFlashcards(noteId);
      return;
    }

    // Priority 2: Check cache (instant load!)
    const cachedNote = getNote(noteId);
    if (cachedNote) {
      setNote(cachedNote);
      setPdfUrl(cachedNote.pdfUrl || null);
      setLoading(false);
      // Fetch flashcards for cached note
      fetchFlashcards(noteId);
      return;
    }

    // Priority 3: Fetch from database (cache miss)
    if (!authLoading) {
      loadNote();
    }
  }, [noteId, authLoading, prefetchedNote, getNote]);

  useEffect(() => {
    if (activeTab === "quiz" && note && !quizQuestions.length && !loadingQuiz) {
      console.log("Quiz tab opened. Checking for saved questions...");
      console.log("Note has quiz_questions?", note.quiz_questions ? `Yes (${note.quiz_questions.length} questions)` : "No");

      // Check if quiz questions already exist in the database
      if (note.quiz_questions && note.quiz_questions.length > 0) {
        console.log("Loading saved quiz questions from database");
        setQuizQuestions(note.quiz_questions);
      } else {
        console.log("No saved questions found. Generating new quiz...");
        generateQuizQuestions();
      }
    }
  }, [activeTab, note]);

  const handleDeleteNote = async () => {
    if (!note?.id) return;

    try {
      const supabase = createClient();

      // Delete the note
      const { error: deleteError } = await supabase
        .from("notes")
        .delete()
        .eq("id", note.id);

      if (deleteError) {
        throw deleteError;
      }

      // Redirect to home after successful deletion
      router.push("/home");
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
    }
  };

  const generateQuizQuestions = async () => {
    if (!note?.content || !note?.id) return;

    setLoadingQuiz(true);
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: note.content,
          title: note.title,
          noteId: note.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();
      setQuizQuestions(data.questions || []);

      // Update the note state to include the new quiz questions
      setNote((prev) => prev ? { ...prev, quiz_questions: data.questions } : prev);
    } catch (error) {
      console.error("Error generating quiz:", error);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const fetchFlashcards = async (id?: string) => {
    const flashcardNoteId = id || note?.id;
    if (!flashcardNoteId) return;
    setLoadingFlashcards(true);
    try {
      const response = await fetch(`/api/notes/${flashcardNoteId}/flashcards`);
      if (!response.ok) throw new Error("Failed to fetch flashcards");
      const data = await response.json();
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
      } else {
        await generateFlashcards(flashcardNoteId);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const generateFlashcards = async (id?: string) => {
    const flashcardNoteId = id || note?.id;
    if (!flashcardNoteId) return;
    setLoadingFlashcards(true);
    try {
      const response = await fetch(`/api/notes/${flashcardNoteId}/flashcards/generate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to generate flashcards");
      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const loadNote = async () => {
    try {
      const supabase = createClient();

      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch note with upload details
      const { data, error } = await supabase
        .from("notes")
        .select(
          `
          *,
          uploads (
            filename,
            file_type,
            storage_path
          )
        `
        )
        .eq("id", noteId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError("Note not found");
        return;
      }

      setNote(data);

      // Fetch flashcards for this note
      fetchFlashcards(noteId);

      // Get PDF URL from storage if it's a PDF
      if (data.uploads?.file_type === "pdf") {
        const { data: urlData } = supabase.storage
          .from("uploads")
          .getPublicUrl(data.uploads.storage_path);

        if (urlData) {
          setPdfUrl(urlData.publicUrl);
        }
      }
    } catch (err) {
      console.error("Error loading note:", err);
      setError("Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Note not found"}
          </h2>
          <button
            onClick={() => router.push("/home")}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex justify-center bg-white w-full max-w-full min-w-0 h-screen max-h-screen overflow-hidden box-border px-1 sm:px-3 lg:px-4 py-2 sm:py-4 lg:py-6">


  <div className="w-full flex flex-col gap-4 sm:gap-6 text-black min-w-0 flex-1 min-h-0">
        <div className="w-full sticky top-0 z-20 bg-white flex flex-col gap-4 sm:gap-6 pt-1 pb-2 sm:pb-3">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-sm max-[872px]:text-base text-gray-600 min-w-0 w-full overflow-hidden">
            {/* Mobile Menu Button - Inline with breadcrumbs */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="hidden max-[872px]:flex items-center justify-center w-9 h-9 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </button>

            <nav aria-label="breadcrumb" className="flex-1 min-w-0 overflow-hidden">
              <ol className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 overflow-hidden">
                <li className="inline-flex items-center gap-1.5 flex-shrink-0">
                  <Link
                    className="flex items-center hover:text-gray-900 whitespace-nowrap"
                    href="/home"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1 flex-shrink-0"
                    >
                      <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    All notes
                  </Link>
                </li>
                <li role="presentation" aria-hidden="true" className="flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </li>
                <li className="inline-flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <span
                    className="truncate font-medium text-gray-900 block"
                    title={note.title}
                  >
                    {note.title}
                  </span>
                </li>
              </ol>
            </nav>
          </div>

          {/* Tab Navigation */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-100 rounded-xl p-1 border border-gray-200 overflow-hidden">
            <button
              onClick={() => setActiveTab("note")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm max-[872px]:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 h-10 px-2 sm:px-4 py-2 ${
                activeTab === "note"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            <svg
              className="mr-0.5 sm:mr-1 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 8.25V18c0 3-1.79 4-4 4H8c-2.21 0-4-1-4-4V8.25c0-3.25 1.79-4 4-4 0 .62.25 1.18.66 1.59.41.41.97.66 1.59.66h3.5C14.99 6.5 16 5.49 16 4.25c2.21 0 4 .75 4 4Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M16 4.25c0 1.24-1.01 2.25-2.25 2.25h-3.5c-.62 0-1.18-.25-1.59-.66C8.25 5.43 8 4.87 8 4.25 8 3.01 9.01 2 10.25 2h3.5c.62 0 1.18.25 1.59.66.41.41.66.97.66 1.59ZM8 13h4M8 17h8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span className="hidden xs:inline">Note</span>
          </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm max-[872px]:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 h-10 px-2 sm:px-4 py-2 ${
              activeTab === "quiz"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-0.5 sm:mr-1 flex-shrink-0"
            >
              <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"></path>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              <circle cx="17.5" cy="17.5" r="3.5"></circle>
            </svg>
            <span className="hidden xs:inline">Quiz</span>
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm max-[872px]:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 h-10 px-2 sm:px-4 py-2 ${
              activeTab === "flashcards"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center h-5 w-4 rounded justify-center border border-current mr-0.5 sm:mr-1 flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6.09 13.28h3.09v7.2c0 1.68.91 2.02 2.02.76l7.57-8.6c.93-1.05.54-1.92-.87-1.92h-3.09v-7.2c0-1.68-.91-2.02-2.02-.76l-7.57 8.6c-.92 1.06-.53 1.92.87 1.92Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </div>
            <span className="hidden xs:inline">Flashcards</span>
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm max-[872px]:text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 h-10 px-2 sm:px-4 py-2 ${
              activeTab === "transcript"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-0.5 sm:mr-1 flex-shrink-0"
            >
              <rect width="18" height="14" x="3" y="5" rx="2" ry="2"></rect>
              <path d="M7 15h4M15 15h2M7 11h2M13 11h4"></path>
            </svg>
            <span className="hidden xs:inline">Transcript</span>
          </button>
        </div>

        </div>

        {/* Content Card */}
        <div className="rounded-lg bg-white text-gray-900 border border-gray-200 p-3 sm:p-4 lg:p-6 w-full self-center flex-1 min-h-0 overflow-y-auto scrollbar-visible">


        <div className="flex flex-col w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 min-w-0">

            {activeTab === "note" && (
              <>
                {/* Hero Section */}
                <section id="hero" className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl xl:text-5xl break-words">
                    {note.title}
                  </h1>
                  {note.created_at && (
                    <p className="text-sm md:text-base text-gray-600">
                      {new Date(note.created_at).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </section>

                {/* Action Bar */}
                <section className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 min-w-0 w-full">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setIsFolderModalOpen(true)}
                                  className="justify-center whitespace-nowrap text-xs sm:text-sm font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800 h-9 px-2 sm:px-3 flex items-center rounded-md"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 flex-shrink-0">
                                    <path d="M12 10v6"></path>
                                    <path d="M9 13h6"></path>
                                    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
                                  </svg>
                                  <span className="text-xs sm:text-sm font-medium leading-none">Add folder</span>
                                </button>
                                {note.youtube_url && (
                                  <div className="flex items-center gap-1">
                                    <svg className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path fill="red" d="M17 4H7C4 4 2 6 2 9v6c0 3 2 5 5 5h10c3 0 5-2 5-5V9c0-3-2-5-5-5zm-3.11 9.03l-2.47 1.48c-1 .6-1.82.14-1.82-1.03v-2.97c0-1.17.82-1.63 1.82-1.03l2.47 1.48c.95.58.95 1.5 0 2.07z"></path>
                                    </svg>
                                    <span className="text-xs sm:text-sm font-medium leading-none whitespace-nowrap">Youtube video</span>
                                  </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setIsDeleteModalOpen(true)}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-red-500 hover:bg-red-600 text-white size-9 cursor-pointer hover:shadow-md"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                    <line x1="10" x2="10" y1="11" y2="17"></line>
                                    <line x1="14" x2="14" y1="11" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                </section>

                {/* YouTube Video Embed */}
                {note.youtube_url && (() => {
                  const videoId = getYouTubeVideoId(note.youtube_url);
                  return videoId ? (
                    <section className="w-full">
                      <div className="w-full aspect-video relative rounded-lg overflow-hidden">
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    </section>
                  ) : null;
                })()}

                {/* Note Content */}
                {note.content ? (
                        <section id="note-content" data-color-mode="light" className="min-w-0 w-full max-w-full">
        <MarkdownPreview
          source={note.content}
          className="wmde-markdown wmde-markdown-color markdown !btransparent"
          wrapperElement={{
            "data-color-mode": "light"
          }}
        />
      </section>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto text-gray-400 mb-4"
                    >
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                      <path d="M20 3v4"></path>
                      <path d="M22 5h-4"></path>
                      <path d="M4 17v2"></path>
                      <path d="M5 18H3"></path>
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No notes yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      AI-generated notes will appear here
                    </p>
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
                      Generate Notes
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === "quiz" && (
              <>
                {loadingQuiz ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating quiz questions...</p>
                    </div>
                  </div>
                ) : (
                  <NoteQuiz topic={note.title} questions={quizQuestions} />
                )}
              </>
            )}

            {activeTab === "flashcards" && (
              <>
                {loadingFlashcards ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating flashcards...</p>
                    </div>
                  </div>
                ) : (
                  <FlashcardViewer
                    flashcards={flashcards}
                    title={`${note?.title || "Note"} Flashcards`}
                  />
                )}
              </>
            )}

            {activeTab === "transcript" && (
              <>
                {transcriptSegments.length ? (
                  <>
                    <h3 className="text-2xl font-semibold tracking-tight">
                      Transcript
                    </h3>
                    <div className="flex flex-col space-y-6">
                      {transcriptSegments.map((segment) => (
                        <div key={segment.id} className="space-y-2">
                          {segment.timeLabel && (
                            <span className="text-purple-400 text-sm font-bold break-words">
                              {segment.timeLabel}
                            </span>
                          )}
                          <p className="whitespace-pre-line text-sm leading-7 text-zinc-800 break-words">
                            {segment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Transcript Available
                    </h3>
                    <p className="text-gray-600">
                      This note doesn&apos;t have a transcript
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {note && (
        <>
          <FolderAssignmentModal
            isOpen={isFolderModalOpen}
            onOpenChange={setIsFolderModalOpen}
            noteId={note.id}
            currentFolderId={note.folder_id ?? null}
            onFolderChange={(folderId) => {
              setNote((prev) =>
                prev ? { ...prev, folder_id: folderId ?? null } : prev
              );
            }}
          />

          <Modal
            isOpen={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            placement="center"
            backdrop="blur"
            hideCloseButton
            classNames={{
              backdrop: "bg-black/60"
            }}
          >
            <ModalContent className="bg-white rounded-2xl">
              {(onClose) => (
                <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl">
                  <div className="flex flex-col gap-1.5 text-black">
                    <h3 className="text-lg font-semibold">Delete Note</h3>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete this note? This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      onClick={onClose}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium transition-colors h-10 px-4 py-2 bg-gray-200 text-black hover:bg-gray-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteNote}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium transition-colors h-10 px-4 py-2 bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </ModalContent>
          </Modal>
        </>
      )}
    </main>
  );
}

const WORDS_PER_SEGMENT = 80;
const SECONDS_PER_WORD = 0.55;
const DEFAULT_SEGMENT_DURATION = 20;

function formatTranscript(rawTranscript: string): TranscriptSegment[] {
  const trimmed = rawTranscript?.trim();
  if (!trimmed) return [];

  const fromJson = parseJsonTranscript(trimmed);
  if (fromJson.length) return fromJson;

  const fromParagraphs = parseParagraphTranscript(trimmed);
  if (fromParagraphs.length) return fromParagraphs;

  return chunkTranscript(trimmed);
}

function parseJsonTranscript(payload: string): TranscriptSegment[] {
  try {
    const parsed = JSON.parse(payload);
    const segmentsArray = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.segments)
        ? parsed.segments
        : [];

    if (!segmentsArray.length) return [];

    return segmentsArray
      .map((segment: any, index: number) => {
        const text = extractSegmentText(segment);
        if (!text) return null;

        const start =
          typeof segment.start_time === "number"
            ? segment.start_time
            : typeof segment.start === "number"
              ? segment.start
              : typeof segment.offset_ms === "number"
                ? segment.offset_ms / 1000
                : index * DEFAULT_SEGMENT_DURATION;

        const duration =
          typeof segment.duration === "number"
            ? segment.duration
            : typeof segment.duration_ms === "number"
              ? segment.duration_ms / 1000
              : typeof segment.end === "number"
                ? segment.end - start
                : DEFAULT_SEGMENT_DURATION;

        const end =
          typeof segment.end === "number" ? segment.end : start + duration;

        return {
          id: `json-${index}`,
          timeLabel: `${formatTime(start)} : ${formatTime(end)}`,
          text,
        };
      })
      .filter(Boolean) as TranscriptSegment[];
  } catch {
    return [];
  }
}

function parseParagraphTranscript(payload: string): TranscriptSegment[] {
  const paragraphs = payload
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) return [];

  return paragraphs.map((paragraph, index) => {
    const timeMatch = paragraph.match(
      /^(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:-|:)\s*(\d{1,2}:\d{2}(?::\d{2})?)/
    );

    return {
      id: `paragraph-${index}`,
      timeLabel: timeMatch
        ? `${normalizeTimeLabel(timeMatch[1])} : ${normalizeTimeLabel(
            timeMatch[2]
          )}`
        : undefined,
      text: timeMatch ? paragraph.replace(timeMatch[0], "").trim() : paragraph,
    };
  });
}

function chunkTranscript(payload: string): TranscriptSegment[] {
  const words = payload.split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const segments: TranscriptSegment[] = [];
  let cursor = 0;
  let startSeconds = 0;

  while (cursor < words.length) {
    const slice = words.slice(cursor, cursor + WORDS_PER_SEGMENT);
    const durationSeconds = slice.length * SECONDS_PER_WORD;
    const endSeconds = startSeconds + durationSeconds;

    segments.push({
      id: `chunk-${cursor}`,
      timeLabel: `${formatTime(startSeconds)} : ${formatTime(endSeconds)}`,
      text: slice.join(" "),
    });

    cursor += WORDS_PER_SEGMENT;
    startSeconds = endSeconds;
  }

  return segments;
}

function extractSegmentText(segment: any): string {
  if (!segment) return "";
  if (typeof segment === "string") return segment.trim();
  if (typeof segment.text === "string") return segment.text.trim();
  if (typeof segment.snippet?.text === "string")
    return String(segment.snippet.text).trim();
  return "";
}

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function normalizeTimeLabel(label: string): string {
  const parts = label.split(":").map((part) => part.padStart(2, "0"));
  if (parts.length === 2) return `${parts[0]}:${parts[1]}`;
  if (parts.length === 3) return `${parts[0]}:${parts[1]}:${parts[2]}`;
  return label;
}
