"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleSubmit = () => {
    if (textInput.trim()) {
      console.log("Submitted text:", textInput);
      setTextInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      {/* Mobile Menu Button */}
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
                width={25}
                height={50}
                className="object-contain"
              />
              <h4 className="scroll-m-20 tracking-tight text-2xl font-black text-gray-900">
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
              <Link
                href="/home"
                className="inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-gray-100 hover:bg-gray-200 h-9 rounded-md px-3 w-full justify-between cursor-pointer"
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
                <small className="font-medium text-gray-500 text-xs">(0)</small>
              </Link>
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
          <div className="shrink-0 bg-gray-200 h-[1px] w-full mb-4 mt-2" />

          {/* Upgrade Plan Card */}
          <div className="mx-4 mb-3">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="p-6 py-4 flex justify-center items-center flex-col px-3">
                <Button onClick={() => setPricingOpen(true)} className=" group relative w-full gap-2 overflow-hidden text-lg font-semibold text-white hover:opacity-90 cursor-pointer active:scale-[0.98]" style={{ backgroundColor: '#171717' }}>
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
                        <span className="font-extrabold">0</span> / 3 Notes free
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full overflow-hidden rounded-full bg-gray-200 h-1">
                    <div className="h-full bg-gray-900 transition-all" style={{ width: "0%" }} />
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
                        // Fallback to initial if image fails to load
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

      {/* Main Content */}
      <main className="ml-[272px] max-[872px]:ml-0 flex-1 flex justify-center overflow-y-auto px-4 sm:px-10 lg:px-24 py-12 sm:py-20 bg-white">
        <div className="w-full flex flex-col items-center sm:gap-3 text-black">
          <h2 className="text-center font-normal sm:text-3xl 2xl:text-4xl text-xl mb-3 text-black">
            What do you want to learn?
          </h2>
          <div className="flex flex-col text-center 2xl:max-w-[672px] xl:max-w-[576px] md:max-w-[512px] w-full z-30">
            <div className="sm:justify-center sm:items-center gap-3 sm:flex grid grid-cols-1 w-full">
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
                            Paste
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-left text-black transition-colors">
                          YouTube, website, text
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
        </div>
      </main>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl w-full px-10 py-10 bg-white">
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

      {/* Pricing Dialog */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className="w-full max-w-5xl px-6 py-5 bg-white">
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
              <Card className="flex flex-col shadow-none">
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
              </Card>

              {/* Lifetime Plan */}
              <Card className="flex flex-col shadow-none border-2 border-blue-500 relative">
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
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
