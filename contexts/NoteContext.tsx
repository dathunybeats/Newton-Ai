"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface NoteData {
  id: string;
  title: string;
  content: string;
  upload_id: string;
  created_at: string;
  uploads: {
    filename: string;
    file_type: string;
    storage_path: string;
  };
}

interface NoteContextType {
  prefetchedNote: (NoteData & { pdfUrl?: string }) | null;
  setPrefetchedNote: (note: (NoteData & { pdfUrl?: string }) | null) => void;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [prefetchedNote, setPrefetchedNote] = useState<(NoteData & { pdfUrl?: string }) | null>(null);

  return (
    <NoteContext.Provider value={{ prefetchedNote, setPrefetchedNote }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNoteContext() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error("useNoteContext must be used within a NoteProvider");
  }
  return context;
}
