"use client";

import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useNoteContext } from "@/contexts/NoteContext";
import Image from "next/image";

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || null;
};

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setPrefetchedNote } = useNoteContext();
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [newNoteName, setNewNoteName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          uploads (
            filename,
            file_type,
            storage_path
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);

      // Fetch PDF URLs for all PDF notes
      const urls: Record<string, string> = {};
      for (const note of data || []) {
        if (note.uploads?.file_type === "pdf") {
          const { data: urlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(note.uploads.storage_path);
          if (urlData?.publicUrl) {
            urls[note.id] = urlData.publicUrl;
          }
        }
      }
      setPdfUrls(urls);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleSubmit = () => {
    if (textInput.trim()) {
      console.log("Submitted text:", textInput);
      setTextInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
        const errorMsg = data.details
          ? `${data.error}\n\nDetails: ${data.details}`
          : data.error || "Failed to generate notes";
        throw new Error(errorMsg);
      }

      setProcessingMessage("Generating notes with AI...");

      // Set prefetched note for faster loading on the note page
      setPrefetchedNote(data.note);

      // Refresh notes list
      await fetchNotes();

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
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      setPrefetchedNote({
        ...data.note,
        pdfUrl: data.pdfUrl,
      });

      await fetchNotes();
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

  const openDeleteModal = (noteId: string) => {
    setSelectedNoteId(noteId);
    setDeleteModalOpen(true);
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", selectedNoteId);

      if (error) throw error;

      // Refresh notes list
      await fetchNotes();
      setDeleteModalOpen(false);
      setSelectedNoteId(null);
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const handleRenameNote = async () => {
    if (!selectedNoteId || !newNoteName.trim()) {
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("notes")
        .update({ title: newNoteName.trim() })
        .eq("id", selectedNoteId);

      if (error) throw error;

      // Refresh notes list
      await fetchNotes();
      setRenameModalOpen(false);
      setSelectedNoteId(null);
      setNewNoteName("");
    } catch (error) {
      console.error("Error renaming note:", error);
      alert("Failed to rename note");
    }
  };

  const openRenameModal = (noteId: string, currentTitle: string) => {
    setSelectedNoteId(noteId);
    setNewNoteName(currentTitle);
    setRenameModalOpen(true);
  };

  return (
    <main className="flex-1 flex justify-center overflow-y-auto px-4 sm:px-10 lg:px-24 py-12 sm:py-20 bg-white">
      <div className="w-full flex flex-col items-center sm:gap-3 text-black">
        <h2 className="text-center font-normal sm:text-3xl 2xl:text-4xl text-xl mb-3 text-black">
          What do you want to learn?
        </h2>
        <div className="flex flex-col text-center 2xl:max-w-[672px] xl:max-w-[576px] md:max-w-[512px] w-full z-30">
          <div className="sm:justify-center sm:items-center gap-3 sm:flex grid grid-cols-1 w-full">
            <div className="w-full flex-1 sm:w-1/3">
              <div
                onClick={() => setUploadModalOpen(true)}
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
                onClick={() => setYoutubeModalOpen(true)}
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
                      <p className="text-xs sm:text-sm text-left text-black transition-colors">
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
            <div
              className="bg-white cursor-text overflow-clip p-2 grid grid-cols-[auto_1fr_auto] gap-2 items-center shadow-[0_0_0_1px_rgba(0,0,0,0.1)] hover:shadow-[0_0_0_2px_rgba(0,0,0,0.15)] transition-shadow duration-200"
              style={{ borderRadius: '28px' }}
            >
              {/* Leading - Plus Button */}
              <div className="flex items-center">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Add files and more"
                  title="Add files and more"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="text-gray-700"
                  >
                    <path d="M9.33496 16.5V10.665H3.5C3.13273 10.665 2.83496 10.3673 2.83496 10C2.83496 9.63273 3.13273 9.33496 3.5 9.33496H9.33496V3.5C9.33496 3.13273 9.63273 2.83496 10 2.83496C10.3673 2.83496 10.665 3.13273 10.665 3.5V9.33496H16.5L16.6338 9.34863C16.9369 9.41057 17.165 9.67857 17.165 10C17.165 10.3214 16.9369 10.5894 16.6338 10.6514L16.5 10.665H10.665V16.5C10.665 16.8673 10.3673 17.165 10 17.165C9.63273 17.165 9.33496 16.8673 9.33496 16.5Z" />
                  </svg>
                </button>
              </div>

              {/* Primary - Text Input */}
              <div className="flex-1 -my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5">
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && textInput.trim()) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Learn anything"
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
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Voice input"
                  title="Voice input"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="text-gray-700"
                  >
                    <path d="M15.7806 10.1963C16.1326 10.3011 16.3336 10.6714 16.2288 11.0234L16.1487 11.2725C15.3429 13.6262 13.2236 15.3697 10.6644 15.6299L10.6653 16.835H12.0833L12.2171 16.8486C12.5202 16.9106 12.7484 17.1786 12.7484 17.5C12.7484 17.8214 12.5202 18.0894 12.2171 18.1514L12.0833 18.165H7.91632C7.5492 18.1649 7.25128 17.8672 7.25128 17.5C7.25128 17.1328 7.5492 16.8351 7.91632 16.835H9.33527L9.33429 15.6299C6.775 15.3697 4.6558 13.6262 3.84992 11.2725L3.76984 11.0234L3.74445 10.8906C3.71751 10.5825 3.91011 10.2879 4.21808 10.1963C4.52615 10.1047 4.84769 10.2466 4.99347 10.5195L5.04523 10.6436L5.10871 10.8418C5.8047 12.8745 7.73211 14.335 9.99933 14.335C12.3396 14.3349 14.3179 12.7789 14.9534 10.6436L15.0052 10.5195C15.151 10.2466 15.4725 10.1046 15.7806 10.1963ZM12.2513 5.41699C12.2513 4.17354 11.2437 3.16521 10.0003 3.16504C8.75675 3.16504 7.74835 4.17343 7.74835 5.41699V9.16699C7.74853 10.4104 8.75685 11.418 10.0003 11.418C11.2436 11.4178 12.2511 10.4103 12.2513 9.16699V5.41699ZM13.5814 9.16699C13.5812 11.1448 11.9781 12.7479 10.0003 12.748C8.02232 12.748 6.41845 11.1449 6.41828 9.16699V5.41699C6.41828 3.43889 8.02221 1.83496 10.0003 1.83496C11.9783 1.83514 13.5814 3.439 13.5814 5.41699V9.16699Z" />
                  </svg>
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!textInput.trim()}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                    textInput.trim()
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
        {notes.length > 0 && (
          <div className="w-full mt-12">
            <div className="mb-11">
              <div className="text-left w-full flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="text-base lg:text-lg font-medium text-gray-900">Recents</span>
                </div>
                <Link href="/home" className="self-center">
                  <button className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 rounded-lg px-3 text-xs sm:text-sm font-medium text-gray-900 hover:text-gray-600">
                    <span>View all</span>
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {notes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/home/note/${note.id}`}
                    className="flex flex-col justify-between shadow-[0_4px_10px_rgba(0,0,0,0.02)] border-gray-300 hover:border-gray-400 bg-white cursor-pointer transition-all duration-200 rounded-2xl border group"
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
                              if (key === "rename") {
                                openRenameModal(note.id, note.title);
                              } else if (key === "delete") {
                                openDeleteModal(note.id);
                              }
                            }}
                          >
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
                            className="w-4 h-4 text-gray-500 flex-shrink-0 mr-1"
                          >
                            <polygon points="6 3 20 12 6 21 6 3"></polygon>
                          </svg>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 w-full">
                              <h5 className="text-sm font-medium truncate tracking-wide flex-1 text-gray-700 group-hover:text-gray-900">
                                {note.title}
                              </h5>
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
                                className="w-4 h-4 text-gray-400 opacity-100 xl:opacity-0 group-hover:opacity-100 cursor-pointer flex-shrink-0 transition-opacity duration-200 hover:text-gray-900"
                              >
                                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                                <path d="m15 5 4 4"></path>
                              </svg>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload PDF Dialog */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-lg w-full p-6 bg-white border border-gray-300 rounded-2xl">
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
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 gap-2 mt-3 w-full ${
                uploadedFile && !isUploading
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

      {/* YouTube Video Note Dialog */}
      <Dialog open={youtubeModalOpen} onOpenChange={setYoutubeModalOpen}>
        <DialogContent className="max-w-lg w-full p-6 bg-white border border-gray-300 rounded-2xl">
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
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 gap-2 mt-3 w-full ${
                youtubeLink.trim() && !isProcessing
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
          wrapper: "z-50",
          backdrop: "bg-black/30 backdrop-blur-sm backdrop-saturate-150",
          base: "bg-white border border-gray-300 rounded-2xl",
          header: "",
          body: "py-6",
          footer: ""
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black">
                Rename Note
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col w-full items-start gap-2">
                  <label
                    htmlFor="noteName"
                    className="text-[16px] font-medium leading-none text-black"
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
                    className="flex w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-[15px] transition-colors placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50 text-black"
                    placeholder="Enter new note name"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium transition-colors h-10 px-4 py-2 bg-gray-200 text-black hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameNote}
                  disabled={!newNoteName.trim()}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[15px] font-medium transition-colors h-10 px-4 py-2 ${
                    newNoteName.trim()
                      ? 'bg-black text-white hover:bg-gray-900 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  Rename
                </button>
              </ModalFooter>
            </>
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
          wrapper: "z-50",
          backdrop: "bg-black/30 backdrop-blur-sm backdrop-saturate-150",
          base: "bg-white border border-gray-300 rounded-2xl",
          header: "",
          body: "py-6",
          footer: ""
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black">
                Delete Note
              </ModalHeader>
              <ModalBody>
                <p className="text-black">
                  Are you sure you want to delete this note? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
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
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  );
}
