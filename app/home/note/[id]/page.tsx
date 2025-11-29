"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNoteContext } from "@/contexts/NoteContext";
import { useSidebar } from "@/app/home/layout";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import MarkdownPreview from "@uiw/react-markdown-preview";
import FolderAssignmentModal from "@/components/notes/FolderAssignmentModal";
import NoteQuiz from "@/components/quiz/NoteQuiz";
import { FlashcardViewer } from "@/components/flashcards/FlashcardViewer";
import { Modal, ModalContent } from "@heroui/modal";
import { motion, AnimatePresence } from "framer-motion";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import {
  MessageSquare,
  PenTool,
  Headphones,
  X,
  Send,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic,
  MoreVertical,
  Trash2,
  FolderInput
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

// --- Components for Right Panel ---

const ChatPanel = ({ note }: { note: Note }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: `Hi! I'm your AI study assistant. Ask me anything about "${note.title}".` }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', content: "I'm processing your request... (This is a demo)" }]);
    }, 1000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          Chat
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-secondary text-foreground rounded-tl-sm'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="pr-10 rounded-full bg-secondary border-border focus:bg-background transition-all"
          />
          <button
            onClick={handleSend}
            className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SideNotesPanel = ({ note }: { note: Note }) => {
  const [content, setContent] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <PenTool className="w-4 h-4 text-purple-500" />
          Side Notes
        </h3>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts here..."
          className="w-full h-full resize-none bg-transparent border-none focus:ring-0 text-gray-700 placeholder:text-gray-400 text-sm leading-relaxed"
        />
      </div>
    </div>
  );
};

const PodcastPanel = ({ note }: { note: Note }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Headphones className="w-4 h-4 text-orange-500" />
          Podcast
        </h3>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center shadow-inner">
          <Mic className="w-16 h-16 text-orange-400/50" />
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-lg text-foreground line-clamp-2">{note.title}</h4>
          <p className="text-sm text-muted-foreground">AI Generated Podcast</p>
        </div>

        <div className="w-full space-y-4">
          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center justify-center gap-6">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <Button className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-11">
          Generate New Episode
        </Button>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function NotePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const noteId = params?.id as string;
  const tool = searchParams.get("tool");

  const { user, loading: authLoading } = useAuth();
  const { prefetchedNote, setPrefetchedNote, getNote } = useNoteContext();
  const { setSidebarOpen } = useSidebar();
  const { resolvedTheme } = useTheme();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Auto-save State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Quiz & Flashcard State
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  // Load Note Logic
  useEffect(() => {
    if (error) return;

    if (prefetchedNote && prefetchedNote.id === noteId) {
      setNote(prefetchedNote);
      setLoading(false);
      setPrefetchedNote(null);
      fetchFlashcards(noteId);
      return;
    }

    const cachedNote = getNote(noteId);
    if (cachedNote) {
      setNote(cachedNote);
      setLoading(false);
      fetchFlashcards(noteId);
      return;
    }

    if (!authLoading) {
      loadNote();
    }
  }, [noteId, authLoading, prefetchedNote, getNote, error]);

  // Quiz Generation Logic
  useEffect(() => {
    if (tool === "quiz" && note && !quizQuestions.length && !loadingQuiz) {
      if (note.quiz_questions && note.quiz_questions.length > 0) {
        setQuizQuestions(note.quiz_questions);
      } else {
        generateQuizQuestions();
      }
    }
  }, [tool, note]);

  const loadNote = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("notes")
        .select(`*, uploads (filename, file_type, storage_path)`)
        .eq("id", noteId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setError("Note not found");
        setLoading(false);
        return;
      }

      setNote(data);
      fetchFlashcards(noteId);
    } catch (err) {
      console.error("Error loading note:", err);
      setError("Failed to load note");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!note?.id) return;
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("notes").delete().eq("id", note.id);
      if (deleteError) throw deleteError;
      router.push("/home");
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
    }
  };

  // Auto-save handler with debouncing
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = useCallback((newContent: string) => {
    if (!note?.id || newContent === note.content) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set saving state immediately for better UX
    setIsSaving(true);

    // Debounce the actual save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("notes")
          .update({ content: newContent })
          .eq("id", note.id);

        if (!error) {
          setNote(prev => prev ? { ...prev, content: newContent } : prev);
          setLastSaved(new Date());
        } else {
          console.error("Auto-save error:", error);
        }
      } catch (err) {
        console.error("Auto-save error:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // 1 second debounce
  }, [note?.id, note?.content]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "Saved just now";
    if (seconds < 60) return `Saved ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Saved ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `Saved ${hours}h ago`;
  };

  const generateQuizQuestions = async () => {
    if (!note?.content || !note?.id) return;
    setLoadingQuiz(true);
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note.content, title: note.title, noteId: note.id }),
      });
      if (!response.ok) throw new Error("Failed to generate quiz");
      const data = await response.json();
      setQuizQuestions(data.questions || []);
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
      const response = await fetch(`/api/notes/${flashcardNoteId}/flashcards/generate`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to generate flashcards");
      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  // Helper function to extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    try {
      // Handle different YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      return null;
    } catch (error) {
      console.error("Error extracting YouTube video ID:", error);
      return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-gray-900"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">{error || "Note not found"}</h2>
          <Button onClick={() => router.push("/home")} variant="outline">Go back home</Button>
        </div>
      </div>
    );
  }

  const showRightPanel = tool === "chat" || tool === "notes" || tool === "podcast";
  const isFullPageTool = tool === "quiz" || tool === "flashcards";

  return (
    <main className="flex h-screen w-full bg-secondary overflow-hidden">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top Bar (Mobile Only / Minimal) */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground truncate">{note.title}</span>
          <div className="w-8" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Dynamic Content Based on Tool */}
          {tool === "quiz" ? (
            <div className={`max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 h-full`}>
              <div className="h-full flex flex-col">

                {loadingQuiz ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-gray-900"></div>
                  </div>
                ) : (
                  <NoteQuiz topic={note.title} questions={quizQuestions} />
                )}
              </div>
            </div>
          ) : tool === "flashcards" ? (
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 h-auto sm:h-full">
              <div className="flex flex-col h-auto sm:h-full">
                {loadingFlashcards ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground"></div>
                    <p className="text-muted-foreground animate-pulse">Generating flashcards...</p>
                  </div>
                ) : (
                  <FlashcardViewer flashcards={flashcards} title={`${note.title} Flashcards`} />
                )}
              </div>
            </div>
          ) : (
            /* Default Note View */
            <>
              {/* Header Section - Constrained Width */}
              <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 pb-0">
                <div className="space-y-2">
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
                          {note.title}
                        </h1>
                        {/* Save Status Indicator */}
                        <div className="mt-2">
                          {isSaving ? (
                            <span className="text-sm text-muted-foreground">Saving...</span>
                          ) : lastSaved ? (
                            <span className="text-sm text-muted-foreground">
                              {formatLastSaved(lastSaved)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFolderModalOpen(true)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Move to folder"
                        >
                          <FolderInput className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="text-muted-foreground hover:text-red-600"
                          title="Delete note"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* YouTube Embed */}
                  {note.youtube_url && (() => {
                    const videoId = getYouTubeVideoId(note.youtube_url);
                    if (!videoId) return null;

                    return (
                      <div className="max-w-3xl mx-auto mb-0">
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border bg-black aspect-video">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Editor Section - Full Width */}
              <div className="pb-20 -mt-2">
                <TiptapEditor
                  content={note.content}
                  onChange={handleContentChange}
                  editable={true}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel (Tools) */}
      <AnimatePresence mode="wait">
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-l border-border bg-card h-full shrink-0 hidden lg:block shadow-xl z-20"
          >
            {tool === "chat" && <ChatPanel note={note} />}
            {tool === "notes" && <SideNotesPanel note={note} />}
            {tool === "podcast" && <PodcastPanel note={note} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Tool Drawer/Sheet could go here if needed */}

      {/* Modals */}
      {note && (
        <>
          <FolderAssignmentModal
            isOpen={isFolderModalOpen}
            onOpenChange={setIsFolderModalOpen}
            noteId={note.id}
            currentFolderId={note.folder_id ?? null}
            onFolderChange={(folderId) => setNote(prev => prev ? { ...prev, folder_id: folderId ?? null } : prev)}
          />
          <Modal
            isOpen={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            hideCloseButton={true}
            backdrop="blur"
            motionProps={{
              variants: {
                enter: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    duration: 0.3,
                    ease: "easeOut"
                  }
                },
                exit: {
                  y: -20,
                  opacity: 0,
                  transition: {
                    duration: 0.2,
                    ease: "easeIn"
                  }
                }
              }
            }}
            classNames={{
              wrapper: "z-50 items-center",
              backdrop: "bg-black/30 backdrop-blur-sm backdrop-saturate-150",
              base: "bg-card border border-border rounded-2xl w-[calc(100vw-2rem)] sm:w-full sm:max-w-[480px] my-0",
              header: "p-0",
              body: "p-0",
              footer: "p-0"
            }}
          >
            <ModalContent>
              {(onClose) => (
                <div className="flex flex-col gap-3 p-5">
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
