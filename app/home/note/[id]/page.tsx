"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNoteContext } from "@/contexts/NoteContext";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content: string;
  upload_id: string;
  created_at: string;
  youtube_url?: string;
  transcript?: string;
  uploads: {
    filename: string;
    file_type: string;
    storage_path: string;
  };
}

type TabType = "note" | "quiz" | "flashcards" | "transcript";

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
  const { prefetchedNote, setPrefetchedNote } = useNoteContext();

  const [note, setNote] = useState<Note | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("note");

  useEffect(() => {
    // Check if we have prefetched data for this note
    if (prefetchedNote && prefetchedNote.id === noteId) {
      // Use prefetched data immediately - no loading!
      setNote(prefetchedNote);
      setPdfUrl(prefetchedNote.pdfUrl || null);
      setLoading(false);
      // Clear prefetched data after using it
      setPrefetchedNote(null);
    } else if (!authLoading) {
      // Fall back to fetching if no prefetched data
      loadNote();
    }
  }, [noteId, authLoading, prefetchedNote]);

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
    <div className="flex w-full flex-col px-8 max-[600px]:px-4 !flex-row pl-0">
      <div className="w-full ml-8 max-[600px]:ml-0 h-auto">
        <div className="flex flex-col space-y-3 pt-5">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-3">
          <button className="items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-200 text-gray-700 hover:bg-gray-300 size-9 hidden max-[866px]:flex">
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
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              <path d="M9 3v18"></path>
              <path d="m14 9 3 3-3 3"></path>
            </svg>
          </button>
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-gray-600 sm:gap-2.5">
              <li className="inline-flex items-center gap-1.5">
                <Link
                  className="flex items-center hover:text-gray-900"
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
                    className="mr-1"
                  >
                    <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  All notes
                </Link>
              </li>
              <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
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
              <li className="inline-flex items-center gap-1.5">
                <span
                  role="link"
                  aria-disabled="true"
                  aria-current="page"
                  className="font-normal text-gray-900"
                >
                  {note.title}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Tab Navigation */}
        <div className="w-full relative bg-gray-200 rounded-2xl p-1 border border-gray-200">
          {/* Sliding background indicator */}
          <div
            className="absolute top-1 bottom-1 bg-gray-900 rounded-xl transition-all duration-300 ease-in-out"
            style={{
              left: activeTab === "note" ? "0.25rem" :
                    activeTab === "quiz" ? "calc(25% + 0.125rem)" :
                    activeTab === "flashcards" ? "calc(50% + 0.125rem)" :
                    "calc(75% + 0.125rem)",
              width: "calc(25% - 0.25rem)"
            }}
          />

          <div className="grid grid-cols-4 max-[600px]:grid-cols-2 gap-2 relative">
            <button
              onClick={() => setActiveTab("note")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 z-10 ${
                activeTab === "note"
                  ? "text-white"
                  : "hover:text-gray-900 text-gray-700"
              }`}
          >
            <svg
              className="mr-1"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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
            Note
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 z-10 ${
              activeTab === "quiz"
                ? "text-white"
                : "hover:text-gray-900 text-gray-700"
            }`}
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
              className="mr-1"
            >
              <path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"></path>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              <circle cx="17.5" cy="17.5" r="3.5"></circle>
            </svg>
            Quiz
          </button>
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 z-10 ${
              activeTab === "flashcards"
                ? "text-white"
                : "hover:text-gray-900 text-gray-700"
            }`}
          >
            <div className="flex items-center h-5 w-4 rounded justify-center border border-current mr-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
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
            Flashcards
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 z-10 ${
              activeTab === "transcript"
                ? "text-white"
                : "hover:text-gray-900 text-gray-700"
            }`}
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
              className="mr-1"
            >
              <rect width="18" height="14" x="3" y="5" rx="2" ry="2"></rect>
              <path d="M7 15h4M15 15h2M7 11h2M13 11h4"></path>
            </svg>
            Transcript
          </button>
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-lg bg-white text-gray-900  relative border-1 border-gray-200">
          <div className="relative overflow-hidden h-[calc(100dvh-10rem)]">
            <div className="h-full w-full rounded-[inherit] overflow-y-auto">
              <div style={{ minWidth: "100%", display: "table" }}>
                <div className="flex flex-col space-y-1.5 p-6"></div>
                <div className="p-6 pt-0">
                  <div className="flex flex-col mx-auto w-full max-w-2xl space-y-3 pt-5 max-[600px]:pt-0">
                    {activeTab === "note" && (
                      <div className="animate-in fade-in duration-300">
                        {/* YouTube Video Embed */}
                        {note.youtube_url && (() => {
                          const videoId = getYouTubeVideoId(note.youtube_url);
                          return videoId ? (
                            <div className="mb-6">
                              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {note.content ? (
                          <div className="prose max-w-none">
                            <div
                              className="text-gray-700"
                              dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                          </div>
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
                      </div>
                    )}

                    {activeTab === "quiz" && (
                      <div className="animate-in fade-in duration-300">
                        <div className="text-center py-12">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Quiz
                          </h3>
                          <p className="text-gray-600">Coming soon...</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "flashcards" && (
                      <div className="animate-in fade-in duration-300">
                        <div className="text-center py-12">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Flashcards
                          </h3>
                          <p className="text-gray-600">Coming soon...</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "transcript" && (
                      <div className="animate-in fade-in duration-300">
                        {note.transcript ? (
                          <div className="prose max-w-none">
                            <div className="text-gray-700 whitespace-pre-wrap">
                              {note.transcript}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No Transcript Available
                            </h3>
                            <p className="text-gray-600">
                              This note doesn't have a transcript
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center p-6 pt-0"></div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
