"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence } from "framer-motion";
import { useNoteContext } from "@/contexts/NoteContext";

interface SidebarProps {
  notes: any[];
  notesCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ notes, notesCount, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { folders, fetchFolders, createFolder, updateFolderInCache, deleteFolderFromCache } = useNoteContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(true);

  // Check if we're on a note page
  const isNotePage = pathname?.startsWith('/home/note/');

  // Folder management modals
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#d1d5db");

  const activeFolderId = searchParams.get("folder");

  // Fetch folders on mount
  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user, fetchFolders]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get count of notes in a folder
  const getFolderNoteCount = (folderId: string | null) => {
    return notes.filter((note) => note.folder_id === folderId).length;
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    const newFolder = await createFolder(folderName.trim(), folderColor);
    if (newFolder) {
      setCreateFolderOpen(false);
      setFolderName("");
      setFolderColor("#d1d5db");
    }
  };

  // Handle rename folder
  const handleRenameFolder = async () => {
    if (!selectedFolderId || !folderName.trim()) return;

    const oldFolder = folders.find(f => f.id === selectedFolderId);
    if (!oldFolder) return;

    // Optimistic update
    updateFolderInCache(selectedFolderId, { name: folderName.trim() });
    setRenameFolderOpen(false);
    setSelectedFolderId(null);
    setFolderName("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("folders")
        .update({ name: folderName.trim() })
        .eq("id", selectedFolderId);

      if (error) throw error;
    } catch (error) {
      console.error("Error renaming folder:", error);
      // Rollback
      updateFolderInCache(selectedFolderId, { name: oldFolder.name });
    }
  };

  // Handle delete folder
  const handleDeleteFolder = async () => {
    if (!selectedFolderId) return;

    // Optimistic delete
    deleteFolderFromCache(selectedFolderId);
    setDeleteFolderOpen(false);
    setSelectedFolderId(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", selectedFolderId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting folder:", error);
      alert("Failed to delete folder");
    }
  };

  return (
    <>
      {/* Mobile Menu Button - Hidden on note pages where inline button is used */}
      {!isNotePage && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 hidden max-[872px]:flex items-center justify-center w-9 h-9 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
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
          className="text-gray-900"
        >
          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          <path d="M9 3v18"></path>
          <path d="m16 15-3-3 3-3"></path>
        </svg>
      </button>
      )}

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 max-[872px]:block hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 h-full w-[272px] border-r border-zinc-200 bg-white py-4 flex flex-col overflow-hidden transition-transform duration-300 ${sidebarOpen ? 'max-[872px]:translate-x-0' : 'max-[872px]:-translate-x-full'}`}>
        <div className="flex h-full flex-col overflow-y-hidden">
          {/* Logo */}
          <div className="flex justify-center mb-7 max-[872px]:justify-between max-[872px]:px-4">
            <Link href="/home" className="flex items-center gap-2 cursor-pointer">
              <Image
                src="/icon.svg"
                alt="Newton AI"
                width={36}
                height={36}
                className="object-contain w-9 h-9"
                priority
              />
              <h4 className="scroll-m-20 tracking-tight text-2xl font-bold text-gray-900">
                Newton AI
              </h4>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="hidden max-[872px]:flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
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
                className="text-gray-900"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 3v18"></path>
                <path d="m16 15-3-3 3-3"></path>
              </svg>
            </button>
          </div>

          {/* Folders Section */}
          <small className="text-sm leading-none mb-2 font-bold flex items-center mx-4 text-gray-900">
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
              className="mr-2"
            >
              <path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />
              <path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />
              <path d="M3 5a2 2 0 0 0 2 2h3" />
              <path d="M3 3v13a2 2 0 0 0 2 2h3" />
            </svg>
            Folders
          </small>

          {/* Scrollable Navigation */}
          <div className="flex-1 overflow-y-auto mx-4 pb-12">
            <div className="flex flex-col gap-1">
              {/* All Notes */}
              <Link
                href="/home"
                className={`inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 w-full justify-between cursor-pointer ${
                  !activeFolderId
                    ? "bg-gray-100 hover:bg-gray-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center text-xs text-gray-900">
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
                    className="mr-2"
                  >
                    <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
                  </svg>
                  All notes
                </div>
                <small className="font-medium text-gray-500 text-xs">({notesCount})</small>
              </Link>

              {/* Folders List */}
              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/home?folder=${folder.id}`}
                  className={`inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 rounded-md px-3 w-full justify-between cursor-pointer group ${
                    activeFolderId === folder.id
                      ? "bg-gray-100 hover:bg-gray-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center text-xs text-gray-900 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  <small className="font-medium text-gray-500 text-xs ml-2">
                    ({getFolderNoteCount(folder.id)})
                  </small>
                </Link>
              ))}

              {/* New Folder Button */}
              <button
                onClick={() => setCreateFolderOpen(true)}
                className="inline-flex items-center whitespace-nowrap text-sm font-medium h-9 rounded-md px-3 w-full justify-start cursor-pointer hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
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
                  className="mr-2"
                >
                  <path d="M5 12h14"></path>
                  <path d="M12 5v14"></path>
                </svg>
                <span className="text-xs">New folder</span>
              </button>
            </div>
          </div>

          {/* Support Button */}
          <div className="w-full justify-center items-center flex gap-5">
            <Link href="mailto:support@newtonai.app" target="_blank">
              <button className="active:scale-105 transition-all duration-100 cursor-pointer">
                <div className="flex flex-col items-center">
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
                    className="text-gray-600"
                  >
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                  <small className="font-medium text-[10px] text-gray-600">Support</small>
                </div>
              </button>
            </Link>
          </div>

          {/* Separator */}
          <div className="shrink-0 bg-gray-200 height-[1px] w-full mb-4 mt-2" />

          {/* Upgrade Plan Card */}
          <div className="mx-4 mb-3">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="p-6 py-4 flex justify-center items-center flex-col px-3">
                <Button onClick={() => setPricingOpen(true)} className=" group relative w-full rounded-[11px] gap-2 overflow-hidden text-lg font-semibold text-white hover:opacity-90 cursor-pointer active:scale-[0.98]" style={{ backgroundColor: '#171717' }}>
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
                    className="h-4 w-4"
                  >
                    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
                    <path d="M5 21h14" />
                  </svg>
                  <p>Upgrade plan</p>
                </Button>
                <small className="text-sm font-medium leading-none mt-4 text-center text-gray-500">
                  Get more features and unlimited access
                </small>
                <div className="w-full mt-4">
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-1">
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
                        className="text-gray-600"
                      >
                        <path d="M2 6h4" />
                        <path d="M2 10h4" />
                        <path d="M2 14h4" />
                        <path d="M2 18h4" />
                        <rect width="16" height="20" x="4" y="2" rx="2" />
                        <path d="M16 2v20" />
                      </svg>
                      <span className="text-xs text-gray-900">
                        <span className="font-extrabold">{notesCount}</span> / 3 Notes free
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full overflow-hidden rounded-full bg-gray-200 h-1">
                    <div className="h-full bg-gray-900 transition-all" style={{ width: `${(notesCount / 3) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Card */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm mb-4 mx-4">
            <div className="flex items-center justify-between w-full p-3">
              <div className="flex flex-1 items-center gap-2">
                {user?.user_metadata?.avatar_url ? (
                  <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="User avatar"
                      width={32}
                      height={32}
                      className="aspect-square h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </span>
                ) : (
                  <span className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                    <div className="flex h-full w-full aspect-square items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                      {user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  </span>
                )}
                <div className="flex w-[140px] flex-col">
                  <small className="truncate text-sm font-medium leading-none text-gray-900">
                    <b>{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}</b>
                  </small>
                  <small className="truncate text-xs font-medium text-gray-500">
                    {user?.email}
                  </small>
                </div>
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className="transition-all duration-100 active:scale-105 cursor-pointer"
                title="Settings"
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
                  className="text-gray-900"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Dialog */}
      <AnimatePresence>
        {settingsOpen && (
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogContent className="w-[95vw] max-w-2xl sm:max-w-3xl px-5 py-6 sm:px-10 sm:py-10 bg-white border border-gray-200 shadow-lg rounded-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-sm font-bold text-gray-900">
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
                className="size-5 mr-1 text-gray-900"
              >
                <path d="M18 20a6 6 0 0 0-12 0"></path>
                <circle cx="12" cy="10" r="4"></circle>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              My profile
            </DialogTitle>
          </DialogHeader>

          <Separator className="my-2" />

          {/* Profile Info */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <small className="font-medium text-sm text-gray-900">Display name</small>
              <small className="font-medium text-sm text-gray-900">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </small>
            </div>
            <div className="flex justify-between items-center">
              <small className="font-medium text-sm text-gray-900">Email</small>
              <small className="font-medium text-sm text-gray-900">{user?.email}</small>
            </div>
            <div className="flex justify-between items-center">
              <small className="font-medium text-sm text-gray-900">Active plan</small>
              <div className="flex items-center gap-2">
                <Badge className="px-2 py-1 rounded-full text-gray-900 border border-gray-200 shadow-none">free</Badge>
                <Button
                  onClick={() => setPricingOpen(true)}
                  className="h-[32px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white active:scale-[0.98] transition-all duration-100 cursor-pointer"
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
                    className="w-4 h-4 mr-1"
                  >
                    <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
                    <path d="M5 21h14"></path>
                  </svg>
                  <span className="text-sm font-bold">Upgrade plan</span>
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end">
            <button
              onClick={handleSignOut}
              className="active:scale-105 transition-all duration-100 flex items-center gap-1 text-red-500 hover:text-red-700 transition-all duration-150 cursor-pointer"
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
                className="w-4 h-4 mr-1"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" x2="9" y1="12" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Pricing Dialog - Content remains the same as in your original code */}
      <AnimatePresence>
        {pricingOpen && (
          <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className="w-[95vw] max-w-3xl sm:max-w-4xl px-5 py-5 sm:px-6 sm:py-6 bg-white border border-gray-200 shadow-lg rounded-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Choose Your Plan</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {/* Yearly/Monthly Toggle */}
            <div className="flex items-center justify-center mx-auto mb-5 w-full">
              <div className="relative flex w-fit items-center rounded-full border border-gray-200 p-2 bg-gray-50">
                {/* Sliding background */}
                <div
                  className="absolute inset-y-2 rounded-full bg-gray-900 transition-all duration-300 ease-in-out"
                  style={{
                    left: isYearly ? '0.5rem' : '60%',
                    width: isYearly ? '60%' : 'calc(40% - 0.5rem)',
                  }}
                ></div>

                <button
                  onClick={() => setIsYearly(true)}
                  className="relative px-7 py-2.5 rounded-full transition-all duration-300 cursor-pointer z-10"
                >
                  <span className={`relative block text-base font-medium transition-all duration-300 ${isYearly ? 'text-white' : 'text-gray-700'}`}>
                    Yearly
                    <span className="ml-2 text-sm font-bold text-green-400 transition-all duration-300">
                      Save 60%
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => setIsYearly(false)}
                  className="relative px-7 py-2.5 rounded-full transition-all duration-300 cursor-pointer z-10"
                >
                  <span className={`relative block text-base font-medium transition-all duration-300 ${!isYearly ? 'text-white' : 'text-gray-700'}`}>
                    Monthly
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="mx-auto mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Monthly/Yearly Plan */}
              <div className="flex flex-col shadow-none border border-gray-200 rounded-lg">
                <div className="flex flex-grow flex-col p-5">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-1.5">
                      {isYearly ? "Yearly Plan" : "Monthly Plan"}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2.5">
                      All features included
                    </p>
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="mb-2.5">
                        <span className="text-3xl font-bold text-gray-900">
                          ${isYearly ? "31.99" : "7.99"}
                        </span>
                        <span className="text-sm font-medium text-gray-600 ml-1.5">
                          / {isYearly ? "year" : "month"}
                        </span>
                      </div>
                      <Button className="w-full mt-2.5 gap-2 text-base font-semibold cursor-pointer bg-gray-900 hover:bg-gray-800 text-white py-2.5">
                        Upgrade plan
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
                          className="ml-2 h-4 w-4"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2.5 text-sm text-gray-600 font-medium">Everything in free plan plus:</p>
                    {[
                      "Unlimited note generations",
                      "Unlimited audio calls",
                      "Unlimited videos & podcasts",
                      "Unlimited quiz & flashcards",
                      "100+ languages support",
                      "24/7 Customer support"
                    ].map((feature, index) => (
                      <div key={index} className="mb-1.5 flex items-center">
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
                          className="mr-2 h-[18px] w-[18px] text-green-500 flex-shrink-0"
                        >
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                        <span className="text-sm text-left text-gray-900">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lifetime Plan */}
              <div className="flex flex-col shadow-none border border-blue-300 relative rounded-lg">
                <div className="absolute -top-2 right-4 bg-blue-500 text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
                  BEST VALUE
                </div>
                <div className="flex flex-grow flex-col p-5">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-1.5">Lifetime Access</h3>
                    <p className="text-gray-600 text-sm mb-2.5">
                      Pay once, own forever
                    </p>
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="mb-2.5">
                        <span className="text-3xl font-bold text-gray-900">$99.99</span>
                        <span className="text-sm font-medium text-gray-600 ml-1.5">one-time</span>
                      </div>
                      <Button className="w-full mt-2.5 gap-2 text-base font-semibold cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2.5">
                        Get Lifetime Access
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
                          className="ml-2 h-4 w-4"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2.5 text-sm text-gray-600 font-medium">All premium features plus:</p>
                    {[
                      "✨ Lifetime updates",
                      "✨ No expiration",
                      "✨ One-time payment",
                      "Unlimited note generations",
                      "Unlimited audio calls",
                      "Unlimited videos & podcasts",
                      "Unlimited quiz & flashcards",
                      "100+ languages support",
                      "24/7 Customer support"
                    ].map((feature, index) => (
                      <div key={index} className="mb-1.5 flex items-center">
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
                          className="mr-2 h-[18px] w-[18px] text-green-500 flex-shrink-0"
                        >
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                        <span className="text-sm text-left text-gray-900">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {createFolderOpen && (
          <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
            <DialogContent className="max-w-md w-full p-6 bg-white border border-gray-300 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl tracking-tight font-bold text-black text-center">
                  Create Folder
                </DialogTitle>
              </DialogHeader>
              <div className="w-full flex flex-col items-center pt-3">
                <div className="flex flex-col w-full items-start gap-3">
                  <div className="w-full">
                    <label htmlFor="folderName" className="text-sm font-medium leading-none text-black mb-2 block">
                      Folder name
                    </label>
                    <input
                      id="folderName"
                      type="text"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && folderName.trim()) {
                          handleCreateFolder();
                        }
                      }}
                      className="flex w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50 text-black"
                      placeholder="e.g. Work, Study, Personal"
                      autoFocus
                    />
                  </div>
                  <div className="w-full">
                    <label className="text-sm font-medium leading-none text-black mb-2 block">
                      Color
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {["#d1d5db", "#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"].map((color) => (
                        <button
                          key={color}
                          onClick={() => setFolderColor(color)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            folderColor === color ? "ring-2 ring-offset-2 ring-gray-900" : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setCreateFolderOpen(false);
                    setFolderName("");
                    setFolderColor("#d1d5db");
                  }}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 bg-gray-200 text-black hover:bg-gray-300 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={!folderName.trim()}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 transition-colors ${
                    folderName.trim()
                      ? "bg-black text-white hover:bg-gray-900 cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  Create
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
