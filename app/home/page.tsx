"use client";

import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useMemo, type SVGProps } from "react";
import { useNoteContext } from "@/contexts/NoteContext";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import FolderAssignmentModal from "@/components/notes/FolderAssignmentModal";
import { Upload, Mic, FileText, Image as ImageIcon, Paperclip, Plus, Youtube } from "lucide-react";

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || null;
};

const YoutubeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 256 180"
    {...props}
  >
    <path
      fill="red"
      d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134Z"
    ></path>
    <path fill="#FFF" d="m102.421 128.06l66.328-38.418l-66.328-38.418z"></path>
  </svg>
);

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    setPrefetchedNote,
    notes,
    isLoading: isLoadingNotes,
    updateNoteInCache,
    deleteNoteFromCache,
    addNoteToCache,
    folders,
  } = useNoteContext();
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [newNoteName, setNewNoteName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [folderModalNote, setFolderModalNote] = useState<{
    noteId: string;
    folderId: string | null;
  } | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [userTier, setUserTier] = useState<"free" | "monthly" | "yearly" | "lifetime">("free");
  const [isLoadingTier, setIsLoadingTier] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const searchParams = useSearchParams();
  const activeFolderId = searchParams.get("folder");

  const filteredNotes = useMemo(() => {
    if (!activeFolderId) return notes;
    if (activeFolderId === "null") {
      return notes.filter((note) => !note.folder_id);
    }
    return notes.filter((note) => note.folder_id === activeFolderId);
  }, [notes, activeFolderId]);

  const activeFolderName = useMemo(() => {
    if (!activeFolderId || activeFolderId === "null") return null;
    return folders.find((folder) => folder.id === activeFolderId)?.name ?? null;
  }, [activeFolderId, folders]);

  // Fetch user subscription tier
  useEffect(() => {
    async function fetchUserTier() {
      if (!user?.id) return;

      try {
        setIsLoadingTier(true);
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setUserTier(data.tier || "free");
        }
      } catch (error) {
        console.error("Error fetching subscription tier:", error);
      } finally {
        setIsLoadingTier(false);
      }
    }

    fetchUserTier();
  }, [user?.id]);

  // Extract PDF URLs from cached notes
  useEffect(() => {
    const urls: Record<string, string> = {};
    notes.forEach((note) => {
      if (note.pdfUrl) {
        urls[note.id] = note.pdfUrl;
      }
    });
    setPdfUrls(urls);
  }, [notes]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleSubmit = async () => {
    if (!textInput.trim()) return;

    // Check if user can create notes
    if (!canCreateNote()) {
      setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
      setUpgradeModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("Generating educational content from your prompt...");

    try {
      const response = await fetch("/api/generate-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: textInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a subscription limit error
        if (response.status === 403 && data.upgradeRequired) {
          setUpgradeMessage(data.message || "Upgrade to create unlimited notes!");
          setUpgradeModalOpen(true);
          return;
        }

        throw new Error(data.error || "Failed to generate note");
      }

      setProcessingMessage("Creating your study materials...");

      // Add to cache immediately
      addNoteToCache(data.note);

      // Set prefetched note for faster loading on the note page
      setPrefetchedNote(data.note);

      // Clear input
      setTextInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Redirect to note page
      router.push(`/home/note/${data.noteId}`);
    } catch (error) {
      console.error("Generate note error:", error);
      alert(error instanceof Error ? error.message : "Failed to generate note");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleGenerateNote = async () => {
    if (!youtubeLink.trim()) return;

    setIsProcessing(true);
    setYoutubeError(null);
    setProcessingMessage("Fetching video transcript...");

    try {
      const response = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl: youtubeLink }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is a subscription limit error
        if (response.status === 403 && data.upgradeRequired) {
          setYoutubeModalOpen(false);
          setUpgradeMessage(data.message || "Upgrade to create unlimited notes!");
          setUpgradeModalOpen(true);
          return;
        }

        const errorMsg = data.details
          ? `${data.error}\n\nDetails: ${data.details}`
          : data.error || "Failed to generate notes";
        throw new Error(errorMsg);
      }

      setProcessingMessage("Generating notes with AI...");

      // Add to cache immediately
      addNoteToCache(data.note);

      // Set prefetched note for faster loading on the note page
      setPrefetchedNote(data.note);

      // Close modal and redirect
      setYoutubeModalOpen(false);
      setYoutubeLink("");
      router.push(`/home/note/${data.noteId}`);
    } catch (error) {
      console.error("YouTube generation error:", error);
      setYoutubeError(error instanceof Error ? error.message : "Failed to generate notes");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();

        // Check if this is a subscription limit error
        if (response.status === 403 && error.upgradeRequired) {
          setUploadModalOpen(false);
          setUploadedFile(null);
          setUpgradeMessage(error.message || "Upgrade to create unlimited notes!");
          setUpgradeModalOpen(true);
          return;
        }

        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      const noteWithUrl = {
        ...data.note,
        pdfUrl: data.pdfUrl,
      };

      // Add to cache immediately
      addNoteToCache(noteWithUrl);

      setPrefetchedNote(noteWithUrl);

      router.push(`/home/note/${data.note.id}`);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to upload file");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    const validTypes = [
      "application/pdf",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "audio/aac",
      "audio/webm"
    ];
    if (file && validTypes.includes(file.type)) {
      setUploadedFile(file);
    }
  };

  const openFolderModal = (noteId: string, folderId: string | null) => {
    setFolderModalNote({ noteId, folderId });
  };

  const openDeleteModal = (noteId: string) => {
    setSelectedNoteId(noteId);
    setDeleteModalOpen(true);
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;

    const noteIdToDelete = selectedNoteId;

    // Optimistically remove from cache
    deleteNoteFromCache(noteIdToDelete);
    setDeleteModalOpen(false);
    setSelectedNoteId(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteIdToDelete);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
      // TODO: Could implement rollback here by re-adding the note to cache
    }
  };

  const handleRenameNote = async () => {
    if (!selectedNoteId || !newNoteName.trim()) {
      return;
    }

    const noteIdToRename = selectedNoteId;
    const oldTitle = notes.find(n => n.id === noteIdToRename)?.title;

    // Optimistically update cache
    updateNoteInCache(noteIdToRename, { title: newNoteName.trim() });
    setRenameModalOpen(false);
    setSelectedNoteId(null);
    setNewNoteName("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("notes")
        .update({ title: newNoteName.trim() })
        .eq("id", noteIdToRename);

      if (error) throw error;
    } catch (error) {
      console.error("Error renaming note:", error);
      alert("Failed to rename note");
      // Rollback on error
      if (oldTitle) {
        updateNoteInCache(noteIdToRename, { title: oldTitle });
      }
    }
  };

  const openRenameModal = (noteId: string, currentTitle: string) => {
    setSelectedNoteId(noteId);
    setNewNoteName(currentTitle);
    setRenameModalOpen(true);
  };

  // Helper function to check if user can create notes
  const canCreateNote = () => {
    // Paid users have unlimited notes
    if (userTier === "monthly" || userTier === "yearly" || userTier === "lifetime") {
      return true;
    }
    // Free users are limited to 3 notes
    return notes.length < 3;
  };

  // Recording functions
  const startRecording = async () => {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
        } else {
          clearInterval(timerInterval);
        }
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setRecordingError("Failed to access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGenerateFromRecording = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    setUploadProgress(0);
    setRecordingError(null);

    try {
      const formData = new FormData();
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append("file", audioFile);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.upgradeRequired) {
          setRecordModalOpen(false);
          setUpgradeMessage(data.message || "Upgrade to create unlimited notes!");
          setUpgradeModalOpen(true);
          return;
        }
        throw new Error(data.error || "Failed to generate notes");
      }

      addNoteToCache(data.note);
      setPrefetchedNote(data.note);

      setRecordModalOpen(false);
      setAudioBlob(null);
      setRecordingTime(0);
      router.push(`/home/note/${data.noteId}`);
    } catch (error) {
      console.error("Recording generation error:", error);
      setRecordingError(error instanceof Error ? error.message : "Failed to generate notes");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setAudioBlob(null);
    setRecordingTime(0);
    setRecordingError(null);
    setRecordModalOpen(false);
  };

  return (
    <main className="flex-1 flex justify-center overflow-y-auto px-4 sm:px-8 md:px-10 lg:px-12 py-12 sm:py-20 bg-white w-full">
      <div className="w-full max-w-6xl flex flex-col items-center sm:gap-3 text-black">
        <h2 className="text-center font-medium sm:text-3xl 2xl:text-4xl text-xl mb-3 text-black">
          What do you want to learn?
        </h2>
        <div className="flex flex-col text-center 2xl:max-w-[672px] xl:max-w-[576px] md:max-w-[512px] w-full z-30">
          <div className="sm:justify-center sm:items-center gap-3 sm:flex grid grid-cols-1 w-full">
            <div className="w-full flex-1 sm:w-1/3">
              <div
                onClick={() => {
                  if (!canCreateNote()) {
                    setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
                    setUpgradeModalOpen(true);
                  } else {
                    setUploadModalOpen(true);
                  }
                }}
                className="border border-gray-200 text-card-foreground rounded-3xl group shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:dark:border-gray-300 bg-white dark:bg-white cursor-pointer transition-all duration-200 relative"
                data-state="closed"
              >
                <div className="p-4 px-5 sm:h-[112px] flex flex-col sm:flex-col items-start justify-center gap-y-1">
                  <div className="flex items-center gap-x-3 sm:block space-y-2">
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
                      className="lucide lucide-upload h-6 w-6 text-black group-hover:text-black transition-colors sm:mb-2 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" x2="12" y1="3" y2="15"></line>
                    </svg>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-x-1">
                        <h3 className="font-medium text-sm sm:text-base text-left text-black group-hover:text-black transition-colors">
                          Upload
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-left text-black transition-colors">
                        File, audio, video
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full flex-1 sm:w-1/3">
              <div
                onClick={() => {
                  if (!canCreateNote()) {
                    setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
                    setUpgradeModalOpen(true);
                  } else {
                    setYoutubeModalOpen(true);
                  }
                }}
                className="border border-gray-200 text-card-foreground rounded-3xl group shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:dark:border-gray-300 bg-white dark:bg-white cursor-pointer transition-all duration-200 relative"
                data-state="closed"
              >
                <div className="p-4 px-5 sm:h-[112px] flex flex-col sm:flex-col items-start justify-center gap-y-1">
                  <div className="flex items-center gap-x-3 sm:block space-y-2">
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
                      className="lucide lucide-link2 lucide-link-2 h-6 w-6 text-black group-hover:text-black transition-colors sm:mb-2 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M9 17H7A5 5 0 0 1 7 7h2"></path>
                      <path d="M15 7h2a5 5 0 1 1 0 10h-2"></path>
                      <line x1="8" x2="16" y1="12" y2="12"></line>
                    </svg>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-x-1">
                        <h3 className="font-medium text-sm sm:text-base text-left text-black group-hover:text-black transition-colors">
                          YouTube
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-left text-black transition-colors">
                        Paste YouTube link
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full flex-1 sm:w-1/3">
              <div
                onClick={() => {
                  if (!canCreateNote()) {
                    setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
                    setUpgradeModalOpen(true);
                  } else {
                    setRecordModalOpen(true);
                  }
                }}
                className="border border-gray-200 text-card-foreground rounded-3xl group shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:dark:border-gray-300 bg-white dark:bg-white cursor-pointer transition-all duration-200 relative"
                data-state="closed"
              >
                <div className="p-4 px-5 sm:h-[112px] flex flex-col sm:flex-col items-start justify-center gap-y-1">
                  <div className="flex items-center gap-x-3 sm:block space-y-2">
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
                      className="lucide lucide-mic h-6 w-6 text-black group-hover:text-black transition-colors sm:mb-2 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" x2="12" y1="19" y2="22"></line>
                    </svg>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-x-1">
                        <h3 className="font-medium text-sm sm:text-base text-left text-black group-hover:text-black transition-colors">
                          Record
                        </h3>
                      </div>
                      <p className="text-[10px] md:text-xs lg:text-sm text-left text-black transition-colors">
                        Record class, video call
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ChatGPT-style Composer */}
          <div className="w-full mt-6 2xl:max-w-[672px] xl:max-w-[576px] md:max-w-[512px]">
            {/* Processing Indicator */}
            {isProcessing && processingMessage && (
              <div className="mb-3 flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-2xl py-2 px-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
                <span>{processingMessage}</span>
              </div>
            )}

            <div
              className="bg-white cursor-text overflow-hidden p-2 grid grid-cols-[auto_1fr_auto] gap-3 items-center border border-gray-200 hover:border-gray-300 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all duration-200 ease-out"
              style={{ borderRadius: '24px' }}
            >
              {/* Leading - Plus Button */}
              <div className="flex items-center pl-1">
                <Dropdown>
                  <DropdownTrigger>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 active:scale-95"
                      aria-label="Add content"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Add content actions"
                    className="p-2 bg-white rounded-xl border border-gray-100 shadow-xl w-[200px]"
                    itemClasses={{
                      base: "rounded-lg data-[hover=true]:bg-gray-50 data-[hover=true]:text-black text-gray-600 transition-colors duration-200",
                      title: "text-sm font-medium",
                      description: "text-xs text-gray-400"
                    }}
                  >
                    <DropdownItem
                      key="upload"
                      startContent={<Upload className="w-4 h-4" />}
                      onPress={() => {
                        if (!canCreateNote()) {
                          setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
                          setUpgradeModalOpen(true);
                        } else {
                          setUploadModalOpen(true);
                        }
                      }}
                    >
                      Upload File
                    </DropdownItem>
                    <DropdownItem
                      key="youtube"
                      startContent={<Youtube className="w-4 h-4" />}
                      onPress={() => {
                        if (!canCreateNote()) {
                          setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
                          setUpgradeModalOpen(true);
                        } else {
                          setYoutubeModalOpen(true);
                        }
                      }}
                    >
                      YouTube Video
                    </DropdownItem>
                    <DropdownItem
                      key="record"
                      startContent={<Mic className="w-4 h-4" />}
                      onPress={() => {
                        if (!canCreateNote()) {
                          setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
                          setUpgradeModalOpen(true);
                        } else {
                          setRecordModalOpen(true);
                        }
                      }}
                    >
                      Record Audio
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Primary - Text Input */}
              <div className="flex-1 -my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5">
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && textInput.trim() && !isProcessing) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Learn anything"
                  disabled={isProcessing}
                  rows={1}
                  className="w-full resize-none bg-transparent text-base text-gray-900 placeholder:text-gray-500 focus:outline-none py-3 overflow-hidden"
                  style={{
                    maxHeight: '200px',
                    minHeight: '24px',
                    scrollbarWidth: 'thin'
                  }}
                />
              </div>

              {/* Trailing - Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Microphone Button */}
                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!canCreateNote()) {
                      setUpgradeMessage("You've reached your limit of 3 notes on the free plan. Upgrade to create unlimited notes!");
                      setUpgradeModalOpen(true);
                    } else {
                      setRecordModalOpen(true);
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                  aria-label="Voice input"
                  title="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!textInput.trim() || isProcessing}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${textInput.trim() && !isProcessing
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  aria-label="Send prompt"
                  title="Send prompt"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notes Section */}
        <div className="w-full mt-12">
          <div className="mb-11">
            <div className="text-left w-full flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-base lg:text-lg font-bold text-gray-900">Notes</span>
              </div>
              <Link href="/home" className="self-center">
                <button className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 rounded-lg px-3 text-xs sm:text-sm font-medium text-gray-900 hover:text-gray-600">
                  <span>View all</span>
                </button>
              </Link>
            </div>
            {(isLoadingNotes || filteredNotes.length > 0) && (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
              >
                {isLoadingNotes ? (
                  // Skeleton loading cards
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex flex-col justify-between shadow-[0_4px_10px_rgba(0,0,0,0.02)] border-gray-200 bg-white rounded-2xl border animate-pulse"
                    >
                      <div className="relative flex-col justify-center items-center rounded-lg w-full">
                        {/* Skeleton Thumbnail */}
                        <div className="rounded-t-2xl overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100">
                          <div className="aspect-video w-full relative overflow-hidden flex items-center justify-center bg-gray-200">
                          </div>
                        </div>
                        {/* Skeleton Content */}
                        <div className="w-full my-2.5 flex gap-2 px-3 py-1 relative items-center">
                          <div className="w-4 h-4 bg-gray-200 rounded flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <Link
                          href={`/home/note/${note.id}`}
                          className="flex flex-col justify-between shadow-[0_4px_10px_rgba(0,0,0,0.02)] border-gray-200 hover:border-gray-300 bg-white cursor-pointer transition-all duration-200 rounded-2xl border group"
                        >
                          <div className="relative cursor-pointer flex-col justify-center items-center rounded-lg transition duration-200 group hover:shadow-none w-full drop-shadow-none">
                            {/* Options Menu */}
                            <div className="absolute z-30 top-2.5 right-2.5">
                              <Dropdown>
                                <DropdownTrigger>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="p-1.5 hover:scale-110 duration-200 cursor-pointer rounded-full lg:bg-transparent group-hover:bg-white transition-all"
                                  >
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
                                      className="w-4 h-4 opacity-100 xl:opacity-0 group-hover:opacity-100 text-black"
                                    >
                                      <circle cx="12" cy="12" r="1"></circle>
                                      <circle cx="12" cy="5" r="1"></circle>
                                      <circle cx="12" cy="19" r="1"></circle>
                                    </svg>
                                  </button>
                                </DropdownTrigger>
                                <DropdownMenu
                                  aria-label="Note actions"
                                  className="bg-white min-w-[160px]"
                                  classNames={{
                                    base: "bg-white shadow-lg border border-gray-200 rounded-lg min-w-[160px]",
                                    list: "bg-white"
                                  }}
                                  onAction={(key) => {
                                    const action = String(key);
                                    if (action === "folder") {
                                      openFolderModal(note.id, note.folder_id ?? null);
                                    } else if (action === "rename") {
                                      openRenameModal(note.id, note.title);
                                    } else if (action === "delete") {
                                      openDeleteModal(note.id);
                                    }
                                  }}
                                >
                                  <DropdownItem
                                    key="folder"
                                    className="text-black hover:bg-gray-100"
                                    classNames={{
                                      base: "text-black",
                                      title: "text-black"
                                    }}
                                    startContent={
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
                                        className="text-black"
                                      >
                                        <path d="M3 19V6a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.6.8l1 1.2H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                                        <path d="M3 10h18" />
                                      </svg>
                                    }
                                  >
                                    Add to folder
                                  </DropdownItem>
                                  <DropdownItem
                                    key="rename"
                                    className="text-black hover:bg-gray-100"
                                    classNames={{
                                      base: "text-black",
                                      title: "text-black"
                                    }}
                                    startContent={
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
                                        className="text-black"
                                      >
                                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                                        <path d="m15 5 4 4"></path>
                                      </svg>
                                    }
                                  >
                                    Rename
                                  </DropdownItem>
                                  <DropdownItem
                                    key="delete"
                                    className="text-red-600 hover:bg-red-50"
                                    classNames={{
                                      base: "text-red-600",
                                      title: "text-red-600"
                                    }}
                                    color="danger"
                                    startContent={
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
                                        className="text-red-600"
                                      >
                                        <path d="M3 6h18"></path>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                        <line x1="10" x2="10" y1="11" y2="17"></line>
                                        <line x1="14" x2="14" y1="11" y2="17"></line>
                                      </svg>
                                    }
                                  >
                                    Delete
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>

                            {/* Thumbnail */}
                            <div className="rounded-t-2xl overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100">
                              <div className="aspect-video w-full relative overflow-hidden flex items-center justify-center">
                                {note.uploads?.file_type === "pdf" ? (
                                  // PDF Indicator with document preview style
                                  <div className="w-full h-full flex items-center justify-center p-8">
                                    <div className="relative">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="80"
                                        height="80"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-gray-400"
                                      >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="8" y1="13" x2="16" y2="13" />
                                        <line x1="8" y1="17" x2="16" y2="17" />
                                        <line x1="8" y1="9" x2="10" y2="9" />
                                      </svg>
                                      <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                        PDF
                                      </div>
                                    </div>
                                  </div>
                                ) : note.youtube_url ? (
                                  // YouTube Thumbnail
                                  (() => {
                                    const videoId = getYouTubeVideoId(note.youtube_url);
                                    return videoId ? (
                                      <img
                                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                        alt={note.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
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
                                          className="text-gray-400"
                                        >
                                          <polygon points="6 3 20 12 6 21 6 3"></polygon>
                                        </svg>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  // Fallback for audio or unknown type
                                  <div className="w-full h-full flex items-center justify-center">
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
                                      className="text-gray-400"
                                    >
                                      {note.uploads?.file_type === "pdf" ? (
                                        <>
                                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                          <polyline points="14 2 14 8 20 8" />
                                        </>
                                      ) : (
                                        <>
                                          <path d="M9 18V5l12-2v13" />
                                          <circle cx="6" cy="18" r="3" />
                                          <circle cx="18" cy="16" r="3" />
                                        </>
                                      )}
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="w-full my-2.5 flex gap-2 px-3 py-1 relative group items-center">
                              {note.uploads?.file_type === "pdf" ? (
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
                                  className="w-4 h-4 text-gray-500 flex-shrink-0 mr-1"
                                >
                                  <path d="M15 18H3"></path>
                                  <path d="M17 6H3"></path>
                                  <path d="M21 12H3"></path>
                                </svg>
                              ) : (
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
                                  className="w-4 h-4 text-black flex-shrink-0 mr-1"
                                >
                                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                                </svg>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 w-full">
                                    <h5 className="text-sm font-semibold truncate tracking-wide flex-1 text-black group-hover:text-gray-900">
                                      {note.title}
                                    </h5>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openRenameModal(note.id, note.title);
                                      }}
                                      className="p-1 rounded-full text-gray-400 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
                                      aria-label="Rename note"
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
                                        className="w-4 h-4"
                                      >
                                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                                        <path d="m15 5 4 4"></path>
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center justify-between gap-1.5">
                                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                    {note.youtube_url && (
                                      <YoutubeIcon
                                        width={18}
                                        height={12}
                                        className="-translate-x-0.5"
                                        style={{ filter: "grayscale(1)" }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            )}
            {!isLoadingNotes && activeFolderId && filteredNotes.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-12">
                No notes found in {activeFolderName ?? "this folder"} yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload PDF Dialog */}
      <AnimatePresence>
        {uploadModalOpen && (
          <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
            <DialogContent className="w-[92vw] max-w-lg p-5 sm:p-6 bg-white border border-gray-300 rounded-xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="scroll-m-20 text-2xl tracking-tight font-bold text-black text-center">
                  Upload File
                </DialogTitle>
              </DialogHeader>
              <div className="w-full flex flex-col items-center pt-3">
                <div className="flex flex-col w-full items-start mt-1 gap-2">
                  {uploadError && (
                    <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {uploadError}
                    </div>
                  )}

                  <div
                    tabIndex={0}
                    className="grid w-full focus:outline-none overflow-hidden"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="relative w-full cursor-pointer">
                      <div
                        className="w-full rounded-lg duration-300 ease-in-out border-gray-300"
                        role="presentation"
                        tabIndex={0}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed bg-white rounded-md border-gray-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-upload text-gray-400"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" x2="12" y1="3" y2="15"></line>
                          </svg>
                          <p className="text-gray-600 text-sm mt-1">
                            Drag or click to upload your file
                          </p>
                          <p className="text-gray-500 text-xs">Supported formats: PDF, MP3, WAV, OGG, M4A, AAC</p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        accept="application/pdf,.pdf,audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm"
                        tabIndex={-1}
                        type="file"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </div>
                    <div className="w-full px-1" aria-description="content file holder">
                      <div className="rounded-xl flex items-center flex-col gap-2">
                        {uploadedFile && (
                          <div className="mt-2 text-sm text-gray-600 w-full">
                            <div className="flex items-center justify-between">
                              <span>Selected: {uploadedFile.name}</span>
                              <span className="text-xs text-gray-500">
                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        )}
                        {isUploading && (
                          <div className="w-full mt-2">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-600">Uploading...</span>
                              <span className="text-sm text-gray-600">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <button
                  onClick={handleGenerateFromFile}
                  disabled={!uploadedFile || isUploading}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 gap-2 mt-3 w-full ${uploadedFile && !isUploading
                    ? "bg-black text-white hover:bg-gray-900 cursor-pointer"
                    : "bg-gray-200 text-black cursor-not-allowed opacity-50"
                    }`}
                >
                  {isUploading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
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
                      className="lucide lucide-sparkles"
                    >
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                      <path d="M20 3v4"></path>
                      <path d="M22 5h-4"></path>
                      <path d="M4 17v2"></path>
                      <path d="M5 18H3"></path>
                    </svg>
                  )}
                  {isUploading ? "Uploading..." : "Generate note"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* YouTube Video Note Dialog */}
      <AnimatePresence>
        {youtubeModalOpen && (
          <Dialog open={youtubeModalOpen} onOpenChange={setYoutubeModalOpen}>
            <DialogContent className="w-[92vw] max-w-lg p-5 sm:p-6 bg-white border border-gray-300 rounded-xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="scroll-m-20 text-2xl tracking-tight font-bold text-black text-center">
                  Youtube Video
                </DialogTitle>
              </DialogHeader>
              <div className="w-full flex flex-col items-center pt-2">
                <div className="flex flex-col w-full items-start gap-2">
                  {youtubeError && (
                    <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {youtubeError}
                    </div>
                  )}

                  <label
                    htmlFor="youtubeLink"
                    className="text-[16px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex flex-row items-center gap-1 text-black"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-link text-black"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    Youtube link
                  </label>
                  <input
                    id="youtubeLink"
                    name="youtubeLink"
                    type="text"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    disabled={isProcessing}
                    className="flex w-full rounded-2xl border border-gray-300 bg-transparent px-3 py-1 text-[15px]  transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 h-12 text-black"
                    placeholder="Ex. https://www.youtube.com/watch/example"
                  />

                  {isProcessing && processingMessage && (
                    <div className="w-full flex items-center gap-2 text-sm text-gray-600">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
                      <span>{processingMessage}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <button
                  onClick={handleGenerateNote}
                  disabled={!youtubeLink.trim() || isProcessing}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 gap-2 mt-3 w-full ${youtubeLink.trim() && !isProcessing
                    ? 'bg-black text-white hover:bg-gray-900 cursor-pointer'
                    : 'bg-gray-200 text-black cursor-not-allowed opacity-50'
                    }`}
                >
                  {isProcessing ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
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
                      className="lucide lucide-sparkles"
                    >
                      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                      <path d="M20 3v4"></path>
                      <path d="M22 5h-4"></path>
                      <path d="M4 17v2"></path>
                      <path d="M5 18H3"></path>
                    </svg>
                  )}
                  {isProcessing ? "Processing..." : "Generate Notes"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Recording Modal */}
      <AnimatePresence>
        {recordModalOpen && (
          <Dialog open={recordModalOpen} onOpenChange={cancelRecording}>
            <DialogContent className="w-[92vw] max-w-lg p-5 sm:p-6 bg-white border border-gray-300 rounded-xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="scroll-m-20 text-2xl tracking-tight font-bold text-black text-center">
                  Record Audio
                </DialogTitle>
              </DialogHeader>
              <div className="w-full flex flex-col items-center pt-3">
                <div className="flex flex-col w-full items-start gap-4">
                  {recordingError && (
                    <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {recordingError}
                    </div>
                  )}

                  {/* Recording Visualizer */}
                  <div className="w-full flex flex-col items-center justify-center py-8 gap-4">
                    {/* Animated Mic Icon */}
                    <div className={`relative ${isRecording ? 'animate-pulse' : ''}`}>
                      <div className={`absolute inset-0 rounded-full ${isRecording ? 'bg-red-500/20 animate-ping' : ''}`}></div>
                      <div className={`relative rounded-full p-6 ${isRecording ? 'bg-red-500' : 'bg-gray-200'} transition-colors duration-300`}>
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
                          className={`${isRecording ? 'text-white' : 'text-gray-600'}`}
                        >
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                          <line x1="12" x2="12" y1="19" y2="22"></line>
                        </svg>
                      </div>
                    </div>

                    {/* Timer */}
                    {(isRecording || audioBlob) && (
                      <div className="text-3xl font-mono font-bold text-black">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </div>
                    )}

                    {/* Status Text */}
                    <p className="text-sm text-gray-600">
                      {isRecording
                        ? "Recording in progress..."
                        : audioBlob
                          ? "Recording complete! Generate notes to continue."
                          : "Click the button below to start recording"}
                    </p>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Processing audio...</span>
                        <span className="text-sm text-gray-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-black h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="w-full flex flex-col gap-2">
                    {!isRecording && !audioBlob && (
                      <button
                        onClick={startRecording}
                        disabled={isUploading}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium h-10 px-4 py-2 gap-2 w-full bg-black text-white hover:bg-gray-900 cursor-pointer transition-colors"
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
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
                        </svg>
                        Start Recording
                      </button>
                    )}

                    {isRecording && (
                      <button
                        onClick={stopRecording}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium h-10 px-4 py-2 gap-2 w-full bg-red-500 text-white hover:bg-red-600 cursor-pointer transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                        </svg>
                        Stop Recording
                      </button>
                    )}

                    {audioBlob && !isRecording && (
                      <>
                        <button
                          onClick={handleGenerateFromRecording}
                          disabled={isUploading}
                          className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium h-10 px-4 py-2 gap-2 w-full ${isUploading
                            ? 'bg-gray-200 text-black cursor-not-allowed opacity-50'
                            : 'bg-black text-white hover:bg-gray-900 cursor-pointer'
                            } transition-colors`}
                        >
                          {isUploading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                          ) : (
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
                              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                              <path d="M20 3v4"></path>
                              <path d="M22 5h-4"></path>
                              <path d="M4 17v2"></path>
                              <path d="M5 18H3"></path>
                            </svg>
                          )}
                          {isUploading ? "Processing..." : "Generate Notes"}
                        </button>
                        <button
                          onClick={() => {
                            setAudioBlob(null);
                            setRecordingTime(0);
                          }}
                          disabled={isUploading}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium h-10 px-4 py-2 gap-2 w-full bg-gray-200 text-black hover:bg-gray-300 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          Record Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Rename Note Modal */}
      <Modal
        isOpen={renameModalOpen}
        onOpenChange={setRenameModalOpen}
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
          base: "bg-white border border-gray-300 rounded-2xl w-[calc(100vw-2rem)] sm:w-full sm:max-w-[480px] my-0",
          header: "p-0",
          body: "p-0",
          footer: "p-0"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="flex flex-col gap-4 p-5">
              <h3 className="text-lg font-semibold text-black">Rename Note</h3>
              <div className="flex flex-col w-full items-start gap-2">
                <label
                  htmlFor="noteName"
                  className="text-sm font-medium leading-none text-black"
                >
                  Note name
                </label>
                <input
                  id="noteName"
                  name="noteName"
                  type="text"
                  value={newNoteName}
                  onChange={(e) => setNewNoteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newNoteName.trim()) {
                      handleRenameNote();
                    }
                  }}
                  className="flex w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50 text-black"
                  placeholder="Enter new note name"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors h-10 px-4 bg-gray-200 text-black hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameNote}
                  disabled={!newNoteName.trim()}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors h-10 px-4 ${newNoteName.trim()
                    ? 'bg-black text-white hover:bg-gray-900 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                >
                  Rename
                </button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
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
          base: "bg-white border border-gray-300 rounded-2xl w-[calc(100vw-2rem)] sm:w-full sm:max-w-[480px] my-0",
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

      <FolderAssignmentModal
        isOpen={!!folderModalNote}
        onOpenChange={(open) => {
          if (!open) {
            setFolderModalNote(null);
          }
        }}
        noteId={folderModalNote?.noteId ?? null}
        currentFolderId={folderModalNote?.folderId ?? null}
      />

      {/* Upgrade Modal */}
      <Modal
        isOpen={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
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
          base: "bg-white border border-gray-300 rounded-2xl w-[calc(100vw-2rem)] sm:w-full sm:max-w-[480px] my-0",
          header: "p-0",
          body: "p-0",
          footer: "p-0"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <div className="flex flex-col gap-4 p-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                    <path d="M20 3v4"></path>
                    <path d="M22 5h-4"></path>
                    <path d="M4 17v2"></path>
                    <path d="M5 18H3"></path>
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2 text-center">
                <h3 className="text-xl font-semibold text-gray-900">Upgrade to Continue</h3>
                <p className="text-sm text-gray-600">
                  {upgradeMessage}
                </p>
              </div>

              {/* Features List */}
              <div className="flex flex-col gap-2 bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-900 mb-1">Upgrade to unlock:</p>
                {[
                  "Unlimited notes from any source",
                  "Unlimited AI-generated quizzes",
                  "Unlimited flashcards",
                  "Priority support",
                  "All future features"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
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
                      className="text-green-500 flex-shrink-0"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                    <span className="text-xs text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onClose();
                    // Open pricing modal - we'll need to trigger this from parent
                    window.dispatchEvent(new CustomEvent("openPricingModal"));
                  }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-base font-semibold transition-colors h-11 px-6 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                >
                  View Plans & Upgrade
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors h-10 px-4 text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </main>
  );
}
