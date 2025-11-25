"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNoteContext } from "@/contexts/NoteContext";
import { useTheme } from "@/contexts/ThemeContext";
import { FocusSoundProvider } from "@/contexts/FocusSoundContext";

const SidebarContext = createContext<{
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}>({
  sidebarOpen: false,
  setSidebarOpen: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { notes, isLoading: notesLoading, fetchNotes } = useNoteContext();
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch notes when user is available (only once)
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, not fetchNotes

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center transition-colors ${theme === "dark" ? "dark bg-[var(--background)] text-white" : "bg-white text-black"}`}>
        <div className={`h-8 w-8 animate-spin rounded-full border-4 ${theme === "dark" ? "border-gray-700 border-t-white" : "border-gray-300 border-t-gray-900"}`}></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <FocusSoundProvider>
      <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
        <div className={`flex min-h-screen w-full max-w-full overflow-x-hidden transition-colors ${theme === "dark" ? "dark bg-[var(--background)] text-white" : "bg-white text-black"}`}>
          <Sidebar
            notes={notes}
            notesCount={notes.length}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          {/* Main Content Area with left margin for sidebar */}
          <div className="ml-[272px] max-[872px]:ml-0 flex-1 w-full max-w-full min-w-0">
            {children}
          </div>
        </div>
      </SidebarContext.Provider>
    </FocusSoundProvider>
  );
}