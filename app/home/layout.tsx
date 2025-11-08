"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useNoteContext } from "@/contexts/NoteContext";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { notes, isLoading: notesLoading, fetchNotes } = useNoteContext();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch notes when user is available
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, fetchNotes]);

  if (loading || (notesLoading && notes.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar notes={notes} notesCount={notes.length} />
      {/* Main Content Area with left margin for sidebar */}
      <div className="ml-[272px] max-[872px]:ml-0 flex-1">
        {children}
      </div>
    </div>
  );
}
