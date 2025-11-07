"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { createClient } from "@/lib/supabase/client";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setNotesLoading(false);
    }
  };

  if (loading || notesLoading) {
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
