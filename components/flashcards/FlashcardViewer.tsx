"use client";

import { useState, useEffect } from "react";
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
  const [displayedCards, setDisplayedCards] = useState<Flashcard[]>(flashcards);
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    setDisplayedCards(flashcards);
    setCurrentIndex(0);
    setIsShuffled(false);
  }, [flashcards]);

  const handleNext = () => {
    if (currentIndex < displayedCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...displayedCards].sort(() => Math.random() - 0.5);
    setDisplayedCards(shuffled);
    setCurrentIndex(0);
    setIsShuffled(true);
  };

  const handleReset = () => {
    setDisplayedCards(flashcards);
    setCurrentIndex(0);
    setIsShuffled(false);
  };

  if (displayedCards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No flashcards available.
      </div>
    );
  }

  const currentCard = displayedCards[currentIndex];

  return (
    <div className="flex flex-col mx-auto w-full max-w-2xl space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>

        {/* Reset and Shuffle Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-9 px-3 text-sm"
            disabled={!isShuffled}
          >
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
              className="mr-1.5"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Reset
          </Button>
          <Button
            onClick={handleShuffle}
            variant="outline"
            className="h-9 px-3 text-sm"
          >
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
              className="mr-1.5"
            >
              <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"></path>
              <path d="m18 2 4 4-4 4"></path>
              <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"></path>
              <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"></path>
              <path d="m18 14 4 4-4 4"></path>
            </svg>
            Shuffle
          </Button>
        </div>
      </div>

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
          Card {currentIndex + 1} of {displayedCards.length}
        </small>

        {/* Next Button */}
        {currentIndex < displayedCards.length - 1 && (
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
