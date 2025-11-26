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
import { PanelLeftClose, Folder, FileText, GraduationCap, Plus, Sparkles, MoreHorizontal, ChevronRight, User, LogOut, Settings } from "lucide-react";
import { useNoteContext } from "@/contexts/NoteContext";
import { PLAN_IDS } from "@/lib/payments/whop";
import { formatPlanName, type PlanTier } from "@/lib/subscriptions/types";
import { ActiveSessionWidget } from "@/components/study/ActiveSessionWidget";

interface SidebarProps {
  notes: any[];
  notesCount: number;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ notes, notesCount, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { folders, fetchFolders, createFolder, updateFolderInCache, deleteFolderFromCache } = useNoteContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Check if we're on a note page
  const isNotePage = pathname?.startsWith('/home/note/');
  const isStudyRoomPage = pathname === '/home/study-room';

  // Folder management modals
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#d1d5db");
  const [userTier, setUserTier] = useState<PlanTier>("free");
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  const activeFolderId = searchParams.get("folder");

  // Fetch folders on mount
  useEffect(() => {
    if (user) {
      fetchFolders();
    }
  }, [user, fetchFolders]);

  // Fetch subscription status
  useEffect(() => {
    async function fetchSubscriptionStatus() {
      if (!user?.id) return;

      try {
        setIsLoadingSubscription(true);
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setUserTier(data.tier);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    }

    fetchSubscriptionStatus();
  }, [user?.id]);

  // Listen for pricing modal open event from upgrade modal
  useEffect(() => {
    const handleOpenPricing = () => {
      setPricingOpen(true);
    };

    window.addEventListener("openPricingModal", handleOpenPricing);
    return () => window.removeEventListener("openPricingModal", handleOpenPricing);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleCheckout = async (interval: "monthly" | "yearly" | "lifetime") => {
    if (!user?.id || !user?.email) {
      router.push("/login");
      return;
    }

    try {
      setIsCreatingCheckout(true);

      // Get the plan ID for the selected interval
      const planId = PLAN_IDS[interval];

      // Call our API to create a checkout session with metadata
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to create checkout");
      }

      const { purchaseUrl } = await response.json();

      // Close modal and open checkout in new tab
      setPricingOpen(false);
      window.open(purchaseUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to start checkout:", error);
      alert("Unable to start checkout. Please try again.");
    } finally {
      setIsCreatingCheckout(false);
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
      {/* Mobile Menu Button - Hidden on note pages and study-room page where inline button is used */}
      {!isNotePage && !isStudyRoomPage && (
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
      <aside className={`fixed left-0 top-0 z-50 h-full w-[280px] border-r border-gray-200 bg-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'max-[872px]:translate-x-0' : 'max-[872px]:-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6">
            <Link href="/home" className="flex items-center gap-3 group">
              <Image
                src="/icon.svg"
                alt="Newton AI"
                width={32}
                height={32}
                className="object-contain w-8 h-8 group-hover:scale-105 transition-transform duration-200"
                priority
              />
              <h4 className="text-lg font-bold text-black tracking-tight">
                Newton AI
              </h4>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="hidden max-[872px]:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">

            {/* Main Navigation */}
            <div className="space-y-1">
              <div className="px-2 mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Workspace</span>
              </div>

              <Link
                href="/home"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${pathname === '/home' && !activeFolderId
                  ? "bg-gray-100 text-black shadow-sm"
                  : "text-gray-600 hover:text-black hover:bg-gray-100"
                  }`}
              >
                <FileText className={`w-4 h-4 transition-colors ${pathname === '/home' && !activeFolderId ? "text-black" : "text-gray-500 group-hover:text-black"}`} />
                <span className="flex-1">All notes</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${pathname === '/home' && !activeFolderId
                  ? "bg-white text-black shadow-sm"
                  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200/50"
                  }`}>
                  {notesCount}
                </span>
              </Link>

              <Link
                href="/home/study-room"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${pathname === '/home/study-room'
                  ? "bg-gray-100 text-black shadow-sm"
                  : "text-gray-600 hover:text-black hover:bg-gray-100"
                  }`}
              >
                <GraduationCap className={`w-4 h-4 transition-colors ${pathname === '/home/study-room' ? "text-black" : "text-gray-500 group-hover:text-black"}`} />
                <span>Study Room</span>
              </Link>
            </div>

            {/* Folders Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 mb-2 group/header">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Folders</span>
                <button
                  onClick={() => setCreateFolderOpen(true)}
                  className="p-1 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 opacity-0 group-hover/header:opacity-100 transition-all duration-200"
                  title="New Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  href={`/home?folder=${folder.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${activeFolderId === folder.id
                    ? "bg-gray-100 text-black shadow-sm"
                    : "text-gray-600 hover:text-black hover:bg-gray-100"
                    }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full shadow-sm ring-2 ring-offset-1 ring-offset-white transition-all ${activeFolderId === folder.id ? "ring-gray-200 scale-110" : "ring-transparent group-hover:ring-gray-100"
                      }`}
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="flex-1 truncate">{folder.name}</span>
                  {getFolderNoteCount(folder.id) > 0 && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${activeFolderId === folder.id
                      ? "bg-white text-black"
                      : "bg-gray-100 text-gray-400 group-hover:bg-gray-200/50"
                      }`}>
                      {getFolderNoteCount(folder.id)}
                    </span>
                  )}
                </Link>
              ))}

              <button
                onClick={() => setCreateFolderOpen(true)}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 transition-all duration-200 group dashed-border"
              >
                <div className="flex items-center justify-center w-4 h-4 rounded border border-gray-400 border-dashed group-hover:border-gray-500">
                  <Plus className="w-3 h-3" />
                </div>
                <span>New folder</span>
              </button>
            </div>


          </div>

          {/* Footer Section */}
          <div className="px-4 pb-4 pt-2 bg-white">
            {/* Active Session Widget */}
            <ActiveSessionWidget />
            {/* Upgrade Plan Card */}
            {!isLoadingSubscription && userTier === "free" && (
              <div className="mb-4">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="p-6 py-4 flex justify-center items-center flex-col px-3">
                    <button
                      onClick={() => setPricingOpen(true)}
                      className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary shadow hover:bg-primary/90 h-9 px-4 py-2 group relative w-full rounded-[11px] gap-2 overflow-hidden text-lg font-semibold text-white cursor-pointer active:scale-[0.98] hover:opacity-90"
                      style={{ backgroundColor: 'rgb(23, 23, 23)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path>
                        <path d="M5 21h14"></path>
                      </svg>
                      <p className="text-sm">Upgrade plan</p>
                    </button>
                    <small className="text-sm font-medium leading-none mt-4 text-center text-gray-500">Get more features and unlimited access</small>
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
                            className={notesCount >= 3 ? "text-orange-600" : "text-gray-600"}
                          >
                            <path d="M2 6h4"></path>
                            <path d="M2 10h4"></path>
                            <path d="M2 14h4"></path>
                            <path d="M2 18h4"></path>
                            <rect width="16" height="20" x="4" y="2" rx="2"></rect>
                            <path d="M16 2v20"></path>
                          </svg>
                          <span className={`text-xs ${notesCount >= 3 ? "text-orange-600 font-bold" : "text-gray-900"}`}>
                            <span className="font-extrabold">{notesCount}</span> / 3 Notes free
                          </span>
                        </div>
                      </div>
                      <div className={`relative w-full overflow-hidden rounded-full h-1 ${notesCount >= 3 ? "bg-orange-200" : "bg-gray-200"}`}>
                        <div
                          className={`h-full transition-all ${notesCount >= 3 ? "bg-orange-600" : "bg-gray-900"}`}
                          style={{ width: `${Math.min((notesCount / 3) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer group" onClick={() => setSettingsOpen(true)}>
              {authLoading ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-2 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    {user?.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt="User"
                        width={36}
                        height={36}
                        className="rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 ring-2 ring-white shadow-sm">
                        {user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">
                      {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userTier === 'free' ? 'Free Plan' : 'Pro Member'}
                    </p>
                  </div>

                  <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                </>
              )}
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
                  <User className="w-5 h-5 mr-2 text-black" />
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
                    <Badge className={`px-2 py-1 rounded-full border shadow-none ${userTier === "free"
                      ? "text-gray-900 border-gray-200"
                      : userTier === "lifetime"
                        ? "text-purple-900 border-purple-300 bg-purple-50"
                        : "text-blue-900 border-blue-300 bg-blue-50"
                      }`}>
                      {isLoadingSubscription ? "..." : userTier}
                    </Badge>
                    {!isLoadingSubscription && userTier === "free" && (
                      <Button
                        onClick={() => setPricingOpen(true)}
                        className="h-[32px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white active:scale-[0.98] transition-all duration-100 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span className="text-sm font-bold">Upgrade plan</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <button
                  onClick={handleSignOut}
                  className="active:scale-105 transition-all duration-100 flex items-center gap-1 text-red-500 hover:text-red-700 transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
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
                          <Button
                            className="w-full mt-2.5 gap-2 text-base font-semibold cursor-pointer bg-gray-900 hover:bg-gray-800 text-white py-2.5"
                            onClick={() => handleCheckout(isYearly ? "yearly" : "monthly")}
                            disabled={isCreatingCheckout}
                          >
                            {isCreatingCheckout ? "Creating checkout..." : "Upgrade plan"}
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
                          <Button
                            className="w-full mt-2.5 gap-2 text-base font-semibold cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2.5"
                            onClick={() => handleCheckout("lifetime")}
                            disabled={isCreatingCheckout}
                          >
                            {isCreatingCheckout ? "Creating checkout..." : "Get Lifetime Access"}
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
            <DialogContent className="max-w-md w-[90vw] sm:w-full p-6 bg-white border border-gray-300 rounded-2xl">
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
                      autoComplete="off"
                      className="flex w-full rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-base transition-colors placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50 text-black"
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
                          className={`w-8 h-8 rounded-full transition-all ${folderColor === color ? "ring-2 ring-offset-2 ring-gray-900" : "hover:scale-110"
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
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium h-10 px-4 py-2 transition-colors ${folderName.trim()
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
