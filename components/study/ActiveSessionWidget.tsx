"use client";

import { useStudySession } from "@/hooks/useStudySession";
import { useFocusSound } from "@/contexts/FocusSoundContext";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Square, X, Volume2, CloudRain, Music, Coffee, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function ActiveSessionWidget() {
    const router = useRouter();
    const { isStudying, seconds, toggleStudying, stopSession, formatTime } = useStudySession();
    const { activeSound, stopSound } = useFocusSound();

    // Only show if studying or sound is playing
    const isVisible = isStudying || activeSound;

    const handleCardClick = () => {
        router.push("/home/study-room");
    };

    const getSoundIcon = () => {
        switch (activeSound) {
            case 'rain': return <CloudRain className="w-3 h-3" />;
            case 'lofi': return <Music className="w-3 h-3" />;
            case 'cafe': return <Coffee className="w-3 h-3" />;
            default: return <Volume2 className="w-3 h-3" />;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="mb-4"
                >
                    <div
                        onClick={handleCardClick}
                        className="group relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                    >
                        {/* Animated Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50 opacity-50 group-hover:opacity-100 transition-opacity" />



                        <div className="relative p-4 flex items-center justify-between gap-3">
                            {/* Left: Status & Timer */}
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    {isStudying ? (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                    ) : (
                                        <Sparkles className="w-3 h-3 text-gray-400" />
                                    )}
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 truncate">
                                        {isStudying ? "Focusing" : seconds > 0 ? "Paused" : "Chilling"}
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-bold text-black font-mono leading-none tracking-tight">
                                        {formatTime(seconds)}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Controls */}
                            <div className="flex items-center gap-1">
                                {/* Sound Indicator/Control */}
                                {activeSound && (
                                    <div
                                        className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            stopSound();
                                        }}
                                        title="Stop Sound"
                                    >
                                        <div className="group-hover/sound:hidden">
                                            {getSoundIcon()}
                                        </div>
                                    </div>
                                )}

                                {/* Timer Controls */}
                                {isStudying ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStudying();
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-sm"
                                    >
                                        <Pause className="w-3.5 h-3.5 fill-current" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStudying();
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 hover:scale-105 transition-all shadow-sm"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
