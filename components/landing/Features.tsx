"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

export function Features() {
  const images = [
    { src: "/summarize.png", alt: "Summary Feature" },
    { src: "/quiz.png", alt: "Quiz Feature" },
    { src: "/flashcards.png", alt: "Flashcards Feature" },
    { src: "/transcript.png", alt: "Transcript Feature" }
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Title Content */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
            Save hours, learn smarter.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            From key takeaways to specific questions, we've got you covered.
          </p>
        </div>

        {/* Large Feature Showcase */}
        <div className="mb-16">
          <div className="rounded-[32px] border border-gray-200 bg-gray-50 p-8">
            <div className="rounded-2xl border-[4px] border-black bg-white overflow-hidden mb-8">
              <div className="aspect-[3410/2062] relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 1.5 } }}
                    exit={{ opacity: 0, transition: { duration: 0.6 } }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[currentImageIndex].src}
                      alt={images[currentImageIndex].alt}
                      fill
                      className="object-contain object-left-top"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-col items-start max-w-2xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Summary, quizzes, podcast, and more
              </h3>
              <p className="text-gray-500">
                Understand the key points, test your knowledge, get answers with references, and listen to an AI tutor.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Upload any content */}
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
            <svg className="h-8 w-8 mb-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 20h14v-2H5v2zm0-10h4v6h6v-6h4l-7-7-7 7z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Upload any content
            </h3>
            <p className="text-gray-500 text-sm">
              From PDFs and YouTube videos to slides and even recorded lectures, learn everything your way.
            </p>
          </div>

          {/* Test your knowledge */}
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
            <svg className="h-8 w-8 mb-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.02 10v9H5V5h9V3H5.02c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-9h-2zM17 10l.94-2.06L20 7l-2.06-.94L17 4l-.94 2.06L14 7l2.06.94zm-3.75.75L12 8l-1.25 2.75L8 12l2.75 1.25L12 16l1.25-2.75L16 12z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Test your knowledge
            </h3>
            <p className="text-gray-500 text-sm">
              Create personalized exams, get answer breakdowns, and track your progress.
            </p>
          </div>

          {/* Talk with an AI Tutor */}
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-8">
            <svg className="h-8 w-8 mb-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 15 6.7 12H5c0 3.42 2.72 6.23 6 6.72V22h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Talk with an AI Tutor
            </h3>
            <p className="text-gray-500 text-sm">
              Talk to an AI tutor to simplify ideas and receive guidance on the content.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
