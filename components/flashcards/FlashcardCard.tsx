"use client";

import { useState } from "react";
import Image from "next/image";

interface FlashcardCardProps {
  question: string;
  answer: string;
}

export function FlashcardCard({ question, answer }: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full h-64" style={{ perspective: "1000px" }}>
      <div className="w-full h-full animate-fade-in duration-200 visible">
        <div
          className={`w-full h-full transition-transform duration-500 cursor-pointer ${
            isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
          }`}
          style={{ transformStyle: "preserve-3d" }}
          onClick={handleFlip}
        >
          {/* Front Side - Question */}
          <div
            className="absolute w-full h-full bg-card rounded-lg shadow-lg flex items-center justify-center p-6 border border-border"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex flex-col items-center">
              <p className="text-lg font-semibold text-center text-foreground">
                {question}
              </p>
              <div className="flex justify-center items-center gap-1 mt-2">
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
                  className="text-muted-foreground"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <small className="text-sm font-semibold text-muted-foreground">
                  Press to flip
                </small>
              </div>
            </div>
          </div>

          {/* Back Side - Answer */}
          <div
            className="absolute w-full h-full bg-card rounded-lg shadow-lg flex items-center justify-center p-6 border border-border"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex flex-col items-center">
              <p className="text-lg font-semibold text-center text-foreground">
                {answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
