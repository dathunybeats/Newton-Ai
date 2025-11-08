"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface NoteData {
  id: string;
  title: string;
  content: string;
  upload_id?: string;
  created_at: string;
  youtube_url?: string;
  transcript?: string;
  folder_id?: string | null;
  uploads?: {
    filename: string;
    file_type: string;
    storage_path: string;
  };
}

interface CachedNote extends NoteData {
  pdfUrl?: string;
}

interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface NotesCache {
  notes: CachedNote[];
  lastFetched: number | null;
  isLoading: boolean;
}

interface FoldersCache {
  folders: Folder[];
  lastFetched: number | null;
  isLoading: boolean;
}

interface NoteContextType {
  // Legacy prefetch support
  prefetchedNote: CachedNote | null;
  setPrefetchedNote: (note: CachedNote | null) => void;

  // Notes caching API
  notes: CachedNote[];
  isLoading: boolean;
  fetchNotes: (force?: boolean) => Promise<void>;
  getNote: (id: string) => CachedNote | null;
  updateNoteInCache: (id: string, updates: Partial<CachedNote>) => void;
  deleteNoteFromCache: (id: string) => void;
  addNoteToCache: (note: CachedNote) => void;
  invalidateCache: () => void;

  // Folders caching API
  folders: Folder[];
  isFoldersLoading: boolean;
  fetchFolders: (force?: boolean) => Promise<void>;
  getFolder: (id: string) => Folder | null;
  createFolder: (name: string, color?: string, icon?: string) => Promise<Folder | null>;
  updateFolderInCache: (id: string, updates: Partial<Folder>) => void;
  deleteFolderFromCache: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => Promise<void>;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function NoteProvider({ children }: { children: ReactNode }) {
  const [prefetchedNote, setPrefetchedNote] = useState<CachedNote | null>(null);
  const [cache, setCache] = useState<NotesCache>({
    notes: [],
    lastFetched: null,
    isLoading: false,
  });
  const [foldersCache, setFoldersCache] = useState<FoldersCache>({
    folders: [],
    lastFetched: null,
    isLoading: false,
  });

  // Check if cache is stale
  const isCacheStale = useCallback(() => {
    if (!cache.lastFetched) return true;
    return Date.now() - cache.lastFetched > CACHE_DURATION;
  }, [cache.lastFetched]);

  // Fetch notes with caching logic
  const fetchNotes = useCallback(async (force = false) => {
    // If cache is fresh and not forcing, return early
    if (!force && !isCacheStale() && cache.notes.length > 0) {
      return;
    }

    setCache((prev) => ({ ...prev, isLoading: true }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCache({ notes: [], lastFetched: null, isLoading: false });
        return;
      }

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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch PDF URLs for PDF notes
      const notesWithUrls: CachedNote[] = [];
      for (const note of data || []) {
        let pdfUrl: string | undefined;
        if (note.uploads?.file_type === "pdf") {
          const { data: urlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(note.uploads.storage_path);
          pdfUrl = urlData?.publicUrl;
        }
        notesWithUrls.push({ ...note, pdfUrl });
      }

      setCache({
        notes: notesWithUrls,
        lastFetched: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching notes:", error);
      setCache((prev) => ({ ...prev, isLoading: false }));
    }
  }, [isCacheStale, cache.notes.length]);

  // Get a specific note from cache
  const getNote = useCallback((id: string): CachedNote | null => {
    return cache.notes.find((note) => note.id === id) || null;
  }, [cache.notes]);

  // Optimistic update for note in cache
  const updateNoteInCache = useCallback((id: string, updates: Partial<CachedNote>) => {
    setCache((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
    }));
  }, []);

  // Optimistic delete from cache
  const deleteNoteFromCache = useCallback((id: string) => {
    setCache((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== id),
    }));
  }, []);

  // Add new note to cache
  const addNoteToCache = useCallback((note: CachedNote) => {
    setCache((prev) => ({
      ...prev,
      notes: [note, ...prev.notes],
    }));
  }, []);

  // Invalidate cache (force refetch next time)
  const invalidateCache = useCallback(() => {
    setCache((prev) => ({ ...prev, lastFetched: null }));
  }, []);

  // ========== FOLDER METHODS ==========

  // Check if folders cache is stale
  const isFoldersCacheStale = useCallback(() => {
    if (!foldersCache.lastFetched) return true;
    return Date.now() - foldersCache.lastFetched > CACHE_DURATION;
  }, [foldersCache.lastFetched]);

  // Fetch folders with caching logic
  const fetchFolders = useCallback(async (force = false) => {
    if (!force && !isFoldersCacheStale() && foldersCache.folders.length > 0) {
      return;
    }

    setFoldersCache((prev) => ({ ...prev, isLoading: true }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setFoldersCache({ folders: [], lastFetched: null, isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setFoldersCache({
        folders: data || [],
        lastFetched: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFoldersCache((prev) => ({ ...prev, isLoading: false }));
    }
  }, [isFoldersCacheStale, foldersCache.folders.length]);

  // Get a specific folder from cache
  const getFolder = useCallback((id: string): Folder | null => {
    return foldersCache.folders.find((folder) => folder.id === id) || null;
  }, [foldersCache.folders]);

  // Create a new folder
  const createFolder = useCallback(async (
    name: string,
    color: string = "#d1d5db",
    icon: string = "folder"
  ): Promise<Folder | null> => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name,
          color,
          icon,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to cache immediately
      setFoldersCache((prev) => ({
        ...prev,
        folders: [...prev.folders, data],
      }));

      return data;
    } catch (error) {
      console.error("Error creating folder:", error);
      return null;
    }
  }, []);

  // Update folder in cache
  const updateFolderInCache = useCallback((id: string, updates: Partial<Folder>) => {
    setFoldersCache((prev) => ({
      ...prev,
      folders: prev.folders.map((folder) =>
        folder.id === id ? { ...folder, ...updates } : folder
      ),
    }));
  }, []);

  // Delete folder from cache
  const deleteFolderFromCache = useCallback((id: string) => {
    setFoldersCache((prev) => ({
      ...prev,
      folders: prev.folders.filter((folder) => folder.id !== id),
    }));
  }, []);

  // Move note to folder
  const moveNoteToFolder = useCallback(async (noteId: string, folderId: string | null) => {
    // Optimistically update note in cache
    updateNoteInCache(noteId, { folder_id: folderId });

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notes")
        .update({ folder_id: folderId })
        .eq("id", noteId);

      if (error) throw error;
    } catch (error) {
      console.error("Error moving note to folder:", error);
      // Could rollback here by fetching the note again
      throw error;
    }
  }, [updateNoteInCache]);

  // Refetch when tab becomes visible if cache is stale
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (isCacheStale()) {
          fetchNotes();
        }
        if (isFoldersCacheStale()) {
          fetchFolders();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchNotes, isCacheStale, fetchFolders, isFoldersCacheStale]);

  return (
    <NoteContext.Provider
      value={{
        prefetchedNote,
        setPrefetchedNote,
        notes: cache.notes,
        isLoading: cache.isLoading,
        fetchNotes,
        getNote,
        updateNoteInCache,
        deleteNoteFromCache,
        addNoteToCache,
        invalidateCache,
        folders: foldersCache.folders,
        isFoldersLoading: foldersCache.isLoading,
        fetchFolders,
        getFolder,
        createFolder,
        updateFolderInCache,
        deleteFolderFromCache,
        moveNoteToFolder,
      }}
    >
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

// Export types for use in other components
export type { Folder, CachedNote };
