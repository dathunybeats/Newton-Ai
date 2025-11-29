"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { motion } from "framer-motion";

interface FlashcardCardProps {
  question: string;
  answer: string;
}

export function FlashcardCard({ question, answer }: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
      setIsAnimating(true);
    }
  };

  return (
    <div className="relative w-full h-72 sm:h-[22rem] max-w-2xl mx-auto [perspective:1000px]">
      <motion.div
        className="relative w-full h-full cursor-pointer"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        onAnimationComplete={() => setIsAnimating(false)}
        style={{ transformStyle: "preserve-3d" }}
        onClick={handleFlip}
      >
        {/* Front Side - Question */}
        <div
          className="absolute inset-0 w-full h-full bg-card hover:bg-accent/50 transition-colors rounded-3xl shadow-sm border border-border flex flex-col items-center justify-center px-6 py-8 sm:p-12"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex-1 flex items-center justify-center w-full">
            <p className="text-2xl sm:text-3xl font-medium text-center text-foreground leading-relaxed select-none">
              {question}
            </p>
          </div>

          <div className="mt-auto pt-8 flex items-center gap-2 text-muted-foreground/50">
            <RotateCw className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Click to flip</span>
          </div>
        </div>

        {/* Back Side - Answer */}
        <div
          className="absolute inset-0 w-full h-full bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 rounded-3xl shadow-sm border border-border flex flex-col items-center justify-center px-6 py-8 sm:p-12"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="flex-1 flex items-center justify-center w-full overflow-y-auto custom-scrollbar">
            <p className="text-xl sm:text-2xl font-medium text-center leading-relaxed select-none">
              {answer}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
