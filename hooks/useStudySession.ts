import { useState, useEffect, useCallback, useRef } from "react";

interface StudySession {
  id: string;
  user_id: string;
  subject: string | null;
  start_time: string;
  end_time: string | null;
  pause_time: string | null;
  total_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StudyStats {
  id: string;
  user_id: string;
  total_time: number;
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  weekly_goal: number;
  weekly_time: number;
  created_at: string;
  updated_at: string;
}

export function useStudySession() {
  const [session, setSession] = useState<StudySession | null>(null);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [isStudying, setIsStudying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active session on mount
  useEffect(() => {
    fetchActiveSession();
    fetchStats();
  }, []);

  const fetchActiveSession = async () => {
    try {
      const response = await fetch("/api/study-sessions/active");
      const data = await response.json();

      if (response.ok && data.session) {
        setSession(data.session);
        // Use the stored total_duration from database
        const duration = data.session.total_duration || 0;
        setSeconds(duration);
        accumulatedTimeRef.current = duration;

        // Check if session was paused
        if (data.session.pause_time) {
          // Session is paused, don't start counting
          setIsStudying(false);
          startTimeRef.current = null;
        } else {
          // Session is active, resume counting from stored duration
          setIsStudying(true);
          startTimeRef.current = Date.now();
        }
      }
    } catch (err) {
      console.error("Error fetching active session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/study-sessions/stats");
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Timer logic
  useEffect(() => {
    if (isStudying && startTimeRef.current) {
      // Update immediately first
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      setSeconds(accumulatedTimeRef.current + elapsed);

      // Then start interval
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
        setSeconds(accumulatedTimeRef.current + elapsed);
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStudying]);

  // Removed auto-update - we update on pause and stop instead

  const startSession = useCallback(async (subject?: string) => {
    setError(null);

    // Optimistic update - start timer immediately
    setSeconds(1);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = Date.now() - 1000;
    setIsStudying(true);

    // Create temporary session for optimistic UI
    const tempSession = {
      id: 'temp-' + Date.now(),
      user_id: 'temp',
      subject: subject || null,
      start_time: new Date().toISOString(),
      end_time: null,
      pause_time: null,
      total_duration: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSession(tempSession);

    // Sync with backend in background
    fetch("/api/study-sessions/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.session) {
          setSession(data.session);
        }
      })
      .catch(err => {
        console.error("Error starting session:", err);
        setError("Failed to start session");
      });

    return true;
  }, []);

  const pauseSession = useCallback(() => {
    if (!session) return;

    // Pause immediately in UI (no waiting)
    const currentSeconds = seconds;
    setIsStudying(false);
    accumulatedTimeRef.current = currentSeconds;
    startTimeRef.current = null;

    // Update backend asynchronously (fire and forget)
    setTimeout(() => {
      fetch("/api/study-sessions/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          totalDuration: currentSeconds,
          pauseTime: new Date().toISOString(),
        }),
      }).catch(err => {
        console.error("Error pausing session:", err);
      });
    }, 0);
  }, [session, seconds]);

  const resumeSession = useCallback(() => {
    if (!session) return;

    // Resume immediately in UI (no waiting)
    setIsStudying(true);
    startTimeRef.current = Date.now();

    // Clear pause_time in backend asynchronously (fire and forget)
    setTimeout(() => {
      fetch("/api/study-sessions/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          pauseTime: null,
        }),
      }).catch(err => {
        console.error("Error resuming session:", err);
      });
    }, 0);
  }, [session]);

  const stopSession = useCallback(async () => {
    if (!session) return false;

    setError(null);
    const finalDuration = seconds;
    const sessionId = session.id;

    // Don't stop if session is still temp (backend hasn't responded yet)
    if (sessionId.startsWith('temp-')) {
      console.warn("Cannot stop session - still syncing with backend");
      return false;
    }

    // Optimistic update - stop immediately
    setSession(null);
    setIsStudying(false);
    setSeconds(0);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;

    // Optimistically update stats (estimate)
    if (stats) {
      setStats({
        ...stats,
        total_time: stats.total_time + finalDuration,
        total_sessions: stats.total_sessions + 1,
        weekly_time: stats.weekly_time + finalDuration,
      });
    }

    // Sync with backend in background
    fetch("/api/study-sessions/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId,
        totalDuration: finalDuration,
      }),
    })
      .then(() => {
        // Refresh actual stats from server
        fetchStats();
      })
      .catch(err => {
        console.error("Error stopping session:", err);
        setError("Failed to stop session");
      });

    return true;
  }, [session, seconds, stats]);

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

  return {
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
    refreshStats: fetchStats,
  };
}
