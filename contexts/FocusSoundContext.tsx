"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

// Get Supabase URL from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const bucketName = "focus-sounds";

const soundFiles = {
  rain: `${supabaseUrl}/storage/v1/object/public/${bucketName}/rain.mp3`,
  lofi: `${supabaseUrl}/storage/v1/object/public/${bucketName}/lofi.mp3`,
  cafe: `${supabaseUrl}/storage/v1/object/public/${bucketName}/cafe.mp3`,
};

interface FocusSoundContextType {
  activeSound: string | null;
  volume: number;
  isPlaying: boolean;
  playSound: (soundId: string) => void;
  stopSound: () => void;
  setVolume: (volume: number) => void;
}

const FocusSoundContext = createContext<FocusSoundContextType | undefined>(undefined);

export function FocusSoundProvider({ children }: { children: ReactNode }) {
  // State management
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeAnimationRef = useRef<number | null>(null);

  // Update volume when it changes (but not during fade)
  useEffect(() => {
    if (audioRef.current && !isFading) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume, isFading]);

  // Handle sound selection
  const playSound = (soundId: string) => {
    // If clicking the same sound, do nothing
    if (activeSound === soundId) {
      return;
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Set new sound
    setActiveSound(soundId);

    // Create and play new audio
    const audio = new Audio(soundFiles[soundId as keyof typeof soundFiles]);
    audio.loop = true;
    audio.volume = volume / 100;

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((error) => {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    });

    audioRef.current = audio;
  };

  // Fade out and stop the current sound (using requestAnimationFrame for smoothness)
  const stopSound = () => {
    if (!audioRef.current) return;

    // Clear any existing fade animation
    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
    }

    setIsFading(true);
    const audio = audioRef.current;
    const startVolume = audio.volume;
    const fadeOutDuration = 800; // 800ms fade out (longer for smoother)
    const startTime = performance.now();

    const fade = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / fadeOutDuration, 1);

      // Use ease-out curve for natural fade
      const easeOut = 1 - Math.pow(1 - progress, 3);
      audio.volume = startVolume * (1 - easeOut);

      if (progress < 1) {
        // Continue fading
        fadeAnimationRef.current = requestAnimationFrame(fade);
      } else {
        // Fade complete
        audio.pause();
        audio.currentTime = 0;
        audio.volume = volume / 100; // Reset to original volume for next play
        fadeAnimationRef.current = null;
        setIsFading(false);
        setActiveSound(null);
        setIsPlaying(false);
      }
    };

    fadeAnimationRef.current = requestAnimationFrame(fade);
  };

  // Cleanup on unmount (only when app closes)
  useEffect(() => {
    return () => {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  return (
    <FocusSoundContext.Provider
      value={{
        activeSound,
        volume,
        isPlaying,
        playSound,
        stopSound,
        setVolume,
      }}
    >
      {children}
    </FocusSoundContext.Provider>
  );
}

export function useFocusSound() {
  const context = useContext(FocusSoundContext);
  if (context === undefined) {
    throw new Error("useFocusSound must be used within a FocusSoundProvider");
  }
  return context;
}
