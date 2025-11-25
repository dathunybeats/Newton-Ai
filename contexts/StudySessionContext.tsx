"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface StudySession {
    id: string;
    subject: string | null;
    startTime: number;
    totalDuration: number;
    isActive: boolean;
    lastUpdated: number;
}

interface StudyStats {
    total_time: number;
    total_sessions: number;
    current_streak: number;
    longest_streak: number;
    last_study_date: string | null;
    weekly_goal: number;
    weekly_time: number;
}

// localStorage keys
const SESSION_KEY = "newton_study_session";

// Helper functions for localStorage (Active Session Only)
const loadSession = (): StudySession | null => {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error("Failed to load session:", e);
        return null;
    }
};

const saveSession = (session: StudySession | null) => {
    try {
        if (session) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
    } catch (e) {
        console.error("Failed to save session:", e);
    }
};

// Helper to process history and calculate stats
const processStats = (sessions: any[]): StudyStats => {
    const history: { [date: string]: number } = {};
    let total_time = 0;

    sessions.forEach(session => {
        const date = new Date(session.created_at).toISOString().split('T')[0];
        history[date] = (history[date] || 0) + session.duration;
        total_time += session.duration;
    });

    // Calculate Streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);
    let longest_streak = 0;
    let current_sequence = 0;

    // Simple streak calculation (backwards from today)
    for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (history[dateStr] > 0) {
            streak++;
        } else if (i > 0) { // Allow missing today if we haven't studied yet
            // If yesterday was missing, break
            // Actually, standard streak logic:
            // If today has study, streak includes today.
            // If today has no study, check yesterday. If yesterday has study, streak continues.
            // If neither, streak is 0.
            // My loop checks strictly consecutive days.
            // Let's refine:
            if (i === 0 && !history[dateStr]) {
                // Today not studied yet, don't break, just don't increment
            } else {
                break;
            }
        }
        currentDate.setDate(currentDate.getDate() - 1);
    }

    // Recalculate streak properly for "Current Streak"
    // 1. Check today. If yes, start=0. If no, check yesterday. If yes, start=1. If no, streak=0.
    streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (history[todayStr]) {
        streak = 1;
        let d = new Date();
        d.setDate(d.getDate() - 1);
        while (history[d.toISOString().split('T')[0]]) {
            streak++;
            d.setDate(d.getDate() - 1);
        }
    } else if (history[yesterdayStr]) {
        streak = 1;
        let d = new Date();
        d.setDate(d.getDate() - 2);
        while (history[d.toISOString().split('T')[0]]) {
            streak++;
            d.setDate(d.getDate() - 1);
        }
    }

    // Weekly Time
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let weekly_time = 0;
    Object.entries(history).forEach(([date, duration]) => {
        if (new Date(date) >= weekAgo) {
            weekly_time += duration;
        }
    });

    return {
        total_time,
        total_sessions: sessions.length,
        current_streak: streak,
        longest_streak: streak, // TODO: Calculate properly if needed, for now simplified
        last_study_date: sessions.length > 0 ? new Date(sessions[0].created_at).toISOString().split('T')[0] : null,
        weekly_goal: 72000, // 20 hours
        weekly_time
    };
};

interface StudySessionContextType {
    session: StudySession | null;
    stats: StudyStats | null;
    isStudying: boolean;
    seconds: number;
    isLoading: boolean;
    error: string | null;
    startSession: (subject?: string) => boolean;
    pauseSession: () => void;
    resumeSession: () => void;
    stopSession: () => Promise<boolean>;
    toggleStudying: () => void;
    formatTime: (totalSeconds: number) => string;
    refreshStats: () => void;
}

const StudySessionContext = createContext<StudySessionContextType | undefined>(undefined);

export function StudySessionProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const [session, setSession] = useState<StudySession | null>(null);
    const [stats, setStats] = useState<StudyStats | null>(null);
    const [isStudying, setIsStudying] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load active session from local storage
    useEffect(() => {
        const storedSession = loadSession();
        if (storedSession && storedSession.isActive) {
            const now = Date.now();
            const timeSinceLastUpdate = now - (storedSession.lastUpdated || storedSession.startTime);

            if (timeSinceLastUpdate < 5000) {
                setSession(storedSession);
                setIsStudying(true);
                const elapsed = Math.floor((now - storedSession.startTime) / 1000);
                setSeconds(storedSession.totalDuration + elapsed);
            } else {
                const segmentDuration = Math.floor(((storedSession.lastUpdated || now) - storedSession.startTime) / 1000);
                const newTotalDuration = storedSession.totalDuration + Math.max(0, segmentDuration);

                const pausedSession: StudySession = {
                    ...storedSession,
                    isActive: false,
                    totalDuration: newTotalDuration,
                    startTime: 0,
                    lastUpdated: now
                };

                setSession(pausedSession);
                setIsStudying(false);
                setSeconds(newTotalDuration);
                saveSession(pausedSession);
            }
        } else if (storedSession) {
            setSession(storedSession);
            setIsStudying(false);
            setSeconds(storedSession.totalDuration);
        }
    }, []);

    // Load stats from Supabase
    const loadStatsFromDb = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data: sessions, error } = await supabase
                .from('study_sessions')
                .select('created_at, duration')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (sessions) {
                const processedStats = processStats(sessions);
                setStats(processedStats);
                // Cache stats
                localStorage.setItem('newton_study_stats_cache', JSON.stringify(processedStats));
            }
        } catch (e) {
            console.error("Error loading stats:", e);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    // Load cached stats on mount
    useEffect(() => {
        const cachedStats = localStorage.getItem('newton_study_stats_cache');
        if (cachedStats) {
            try {
                setStats(JSON.parse(cachedStats));
            } catch (e) {
                console.error("Error parsing cached stats:", e);
            }
        }
        loadStatsFromDb();
    }, [loadStatsFromDb]);

    // Timer interval
    useEffect(() => {
        if (isStudying && session) {
            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const elapsed = Math.floor((now - session.startTime) / 1000);
                setSeconds(session.totalDuration + elapsed);

                const sessionWithHeartbeat = { ...session, lastUpdated: now };
                saveSession(sessionWithHeartbeat);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isStudying, session]);

    // Dev helper to add time
    useEffect(() => {
        (window as any).addStudyTime = (secondsToAdd: number) => {
            if (session) {
                const newTotalDuration = session.totalDuration + secondsToAdd;
                const updatedSession = { ...session, totalDuration: newTotalDuration };
                setSession(updatedSession);
                setSeconds(prev => prev + secondsToAdd);
                saveSession(updatedSession);
                console.log(`Added ${secondsToAdd} seconds to session.`);
            } else {
                console.warn("No active session to add time to.");
            }
        };
    }, [session]);

    const startSession = useCallback((subject?: string) => {
        setError(null);
        const now = Date.now();

        const newSession: StudySession = {
            id: `session-${now}`,
            subject: subject || null,
            startTime: now,
            totalDuration: 0,
            isActive: true,
            lastUpdated: now
        };

        setSession(newSession);
        setIsStudying(true);
        setSeconds(0);
        saveSession(newSession);

        return true;
    }, []);

    const pauseSession = useCallback(() => {
        if (!session) return;

        const now = Date.now();
        const elapsed = Math.floor((now - session.startTime) / 1000);
        const updatedSession: StudySession = {
            ...session,
            totalDuration: session.totalDuration + elapsed,
            startTime: 0,
            isActive: false,
            lastUpdated: now
        };

        setSession(updatedSession);
        setIsStudying(false);
        saveSession(updatedSession);
    }, [session]);

    const resumeSession = useCallback(() => {
        if (!session) return;

        const now = Date.now();
        const updatedSession: StudySession = {
            ...session,
            startTime: now,
            isActive: true,
            lastUpdated: now
        };

        setSession(updatedSession);
        setIsStudying(true);
        saveSession(updatedSession);
    }, [session]);

    const stopSession = useCallback(async () => {
        if (!session) return false;

        setError(null);

        // Calculate final duration
        let finalDuration = session.totalDuration;
        if (session.isActive) {
            const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
            finalDuration += elapsed;
        }

        // Capture session data for saving
        const sessionToSave = {
            duration: finalDuration,
            subject: session.subject,
        };

        // Optimistically clear local session immediately
        setSession(null);
        setIsStudying(false);
        setSeconds(0);
        saveSession(null);

        // Optimistically update stats
        if (stats) {
            const today = new Date().toISOString().split('T')[0];
            const newTotalSessions = stats.total_sessions + 1;
            const newTotalTime = stats.total_time + finalDuration;

            // Simple optimistic streak update (if not already studied today)
            let newStreak = stats.current_streak;
            if (stats.last_study_date !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (stats.last_study_date === yesterdayStr) {
                    newStreak += 1;
                } else {
                    newStreak = 1;
                }
            }

            const optimisticStats: StudyStats = {
                ...stats,
                total_sessions: newTotalSessions,
                total_time: newTotalTime,
                current_streak: newStreak,
                longest_streak: Math.max(stats.longest_streak, newStreak),
                last_study_date: today,
                weekly_time: stats.weekly_time + finalDuration // Approximate, assumes session is within this week
            };

            setStats(optimisticStats);
            localStorage.setItem('newton_study_stats_cache', JSON.stringify(optimisticStats));
        }

        // Save to Supabase in background
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('study_sessions').insert({
                    user_id: user.id,
                    duration: sessionToSave.duration,
                    subject: sessionToSave.subject,
                });

                if (error) throw error;

                // Refresh stats after save to ensure accuracy
                await loadStatsFromDb();
            }
        } catch (e) {
            console.error("Failed to save session to DB:", e);
            setError("Failed to save session");
            // Note: We've already cleared the UI, so if this fails, the data is technically lost from the user's perspective
            // unless we implement a local retry queue. For now, we log the error.
        }

        return true;
    }, [session, stats, supabase, loadStatsFromDb]);

    const toggleStudying = useCallback(() => {
        if (!session) {
            startSession();
        } else if (isStudying) {
            pauseSession();
        } else {
            resumeSession();
        }
    }, [session, isStudying, startSession, pauseSession, resumeSession]);

    const formatTime = useCallback((totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }, []);

    const refreshStats = useCallback(() => {
        loadStatsFromDb();
    }, [loadStatsFromDb]);

    return (
        <StudySessionContext.Provider
            value={{
                session,
                stats,
                isStudying,
                seconds,
                isLoading,
                error,
                startSession,
                pauseSession,
                resumeSession,
                stopSession,
                toggleStudying,
                formatTime,
                refreshStats,
            }}
        >
            {children}
        </StudySessionContext.Provider>
    );
}

export function useStudySession() {
    const context = useContext(StudySessionContext);
    if (context === undefined) {
        throw new Error("useStudySession must be used within a StudySessionProvider");
    }
    return context;
}
