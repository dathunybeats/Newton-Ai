"use client";

import { useState } from "react";
import { FlashcardCard } from "./FlashcardCard";
import { Button } from "@/components/ui/button";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  title: string;
}

export function FlashcardViewer({ flashcards, title }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No flashcards available.
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flex flex-col mx-auto w-full max-w-2xl space-y-3">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">{title}</h2>

      {/* Flashcard Display */}
      <FlashcardCard
        key={currentCard.id}
        question={currentCard.question}
        answer={currentCard.answer}
      />

      <div className="h-4"></div>

      {/* Navigation Controls */}
      <div className="flex justify-center relative items-center">
        {/* Previous Button */}
        {currentIndex > 0 && (
          <Button
            onClick={handlePrevious}
            className="absolute left-0 bg-gray-900 text-white hover:bg-gray-800 h-10 px-4 py-2 animate-fade-up duration-200"
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
              className="w-4 h-4 mr-2"
            >
              <path d="M19 12H5"></path>
              <path d="m12 19-7-7 7-7"></path>
            </svg>
            Previous
          </Button>
        )}

        {/* Card Counter */}
        <small className="text-sm font-semibold text-gray-600">
          Card {currentIndex + 1} of {flashcards.length}
        </small>

        {/* Next Button */}
        {currentIndex < flashcards.length - 1 && (
          <Button
            onClick={handleNext}
            className="absolute right-0 bg-gray-900 text-white hover:bg-gray-800 h-10 px-4 py-2 animate-fade-up duration-200"
          >
            Next
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
              className="w-4 h-4 ml-2"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}
