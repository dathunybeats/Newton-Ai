"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
} from "@heroui/modal";
import { useNoteContext } from "@/contexts/NoteContext";

interface FolderAssignmentModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  noteId: string | null;
  currentFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
}

const Spinner = () => (
  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
);

const FolderAssignmentModal = ({
  isOpen,
  onOpenChange,
  noteId,
  currentFolderId = null,
  onFolderChange,
}: FolderAssignmentModalProps) => {
  const {
    folders,
    fetchFolders,
    createFolder,
    moveNoteToFolder,
    isFoldersLoading,
  } = useNoteContext();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    currentFolderId ?? null
  );
  const [newFolderName, setNewFolderName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      setSelectedFolderId(currentFolderId ?? null);
      setError(null);
    } else {
      setNewFolderName("");
      setIsSaving(false);
      setIsCreating(false);
    }
  }, [isOpen, currentFolderId, fetchFolders]);

  const canSave = useMemo(() => {
    if (!noteId) return false;
    if (isSaving) return false;
    return selectedFolderId !== currentFolderId;
  }, [currentFolderId, isSaving, noteId, selectedFolderId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const folder = await createFolder(newFolderName.trim());
      if (folder) {
        setSelectedFolderId(folder.id);
        setNewFolderName("");
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
      setError("Failed to create folder. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!noteId || !canSave) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await moveNoteToFolder(noteId, selectedFolderId);
      onFolderChange?.(selectedFolderId);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to move note to folder:", err);
      setError("Failed to update folder. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderFolderOption = (
    folderId: string | null,
    label: string,
    color: string
  ) => {
    const isActive = selectedFolderId === folderId;
    return (
      <button
        key={folderId ?? "none"}
        type="button"
        onClick={() => setSelectedFolderId(folderId)}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
          isActive
            ? "border-gray-900 bg-gray-900/5 text-gray-900"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="truncate text-sm font-medium">{label}</span>
        </span>
        {isActive && (
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
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton
      backdrop="blur"
      classNames={{
        wrapper: "z-50 items-center",
        backdrop: "bg-black/30 backdrop-blur-sm backdrop-saturate-150",
        base: "bg-white border border-gray-300 rounded-2xl w-[calc(100vw-2rem)] sm:w-auto max-w-md my-0",
        header: "p-0",
        body: "p-0",
        footer: "p-0",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1.5 text-black">
              <h3 className="text-lg font-semibold">Organize note</h3>
              <p className="text-sm font-normal text-gray-500">
                Add this note to a folder or remove it from one.
              </p>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Select folder
                  </p>
                  <div className="space-y-2">
                    {isFoldersLoading ? (
                      <div className="flex justify-center py-6">
                        <Spinner />
                      </div>
                    ) : (
                      <>
                        {renderFolderOption(null, "No folder", "#d1d5db")}
                        {folders.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No folders yet. Create one below.
                          </p>
                        ) : (
                          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                            {folders.map((folder) =>
                              renderFolderOption(
                                folder.id,
                                folder.name,
                                folder.color || "#d1d5db"
                              )
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Create new folder
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateFolder}
                      disabled={!newFolderName.trim() || isCreating}
                      className={`rounded-xl px-4 py-2 text-sm font-medium ${
                        newFolderName.trim() && !isCreating
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {isCreating ? <Spinner /> : "Add"}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500" role="alert">
                    {error}
                  </p>
                )}
              </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium ${
                  canSave
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? <Spinner /> : selectedFolderId ? "Save" : "Remove"}
              </button>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};

export default FolderAssignmentModal;
