"use client";

import { useState, useEffect } from "react";
import { FlashcardCard } from "./FlashcardCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCcw, Shuffle, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <Layers className="w-12 h-12 mb-4 opacity-20" />
        <p>No flashcards available.</p>
      </div>
    );
  }

  const currentCard = displayedCards[currentIndex];
  const progress = ((currentIndex + 1) / displayedCards.length) * 100;

  return (
    <div className="flex flex-col w-full h-auto sm:h-full max-w-4xl mx-auto justify-center py-4 sm:py-2">
      {/* Header & Controls */}
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-2 sm:mb-8 shrink-0">
        {/* Title */}
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight text-center line-clamp-2 px-2">
          {title.replace(/ Flashcards$/i, "")}
        </h2>

        {/* Progress Section */}
        <div className="space-y-1.5 sm:space-y-3">
          <div className="flex justify-between items-end px-1">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Card</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {currentIndex + 1} <span className="text-muted-foreground">/</span> {displayedCards.length}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Completed</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
            <motion.div
              className="h-full bg-zinc-900 dark:bg-zinc-50 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-full border border-border/50">
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-all"
              disabled={!isShuffled}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
            <div className="w-px h-4 bg-border/50" />
            <Button
              onClick={handleShuffle}
              variant="ghost"
              size="sm"
              className={`h-8 px-3 text-xs font-medium rounded-full transition-all ${isShuffled
                ? "text-primary bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
            >
              <Shuffle className="w-3.5 h-3.5 mr-1.5" />
              Shuffle
            </Button>
          </div>
        </div>
      </div>

      {/* Main Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <FlashcardCard
              question={currentCard.question}
              answer={currentCard.answer}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="mt-4 sm:mt-8 flex items-center justify-center gap-6 shrink-0">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-border hover:bg-secondary hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        <div className="text-sm font-medium text-muted-foreground tabular-nums">
          {currentIndex + 1} / {displayedCards.length}
        </div>

        <Button
          onClick={handleNext}
          disabled={currentIndex === displayedCards.length - 1}
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all shadow-lg disabled:opacity-30 disabled:hover:scale-100"
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
