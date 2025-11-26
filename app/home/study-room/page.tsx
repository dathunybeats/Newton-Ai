"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import * as Slider from "@radix-ui/react-slider";
import {
  Play,
  Pause,
  Square,
  Users,
  Trophy,
  Activity,
  Clock,
  Flame,
  BookOpen,
  Plus,
  CheckCircle2,
  Circle,
  X,
  Headphones,
  CloudRain,
  Music,
  Coffee,
  Copy,
  Link as LinkIcon,
  ChevronRight,
  Target,
  Calendar,
  Video,
  Mic,
  MicOff,
  Globe,
  Lock,
  Menu,
  Volume2,
  VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "@/app/home/layout";
import { useStudySession } from "@/hooks/useStudySession";
import { useFocusSound } from "@/contexts/FocusSoundContext";


export default function StudyRoomPage() {
  const { setSidebarOpen } = useSidebar();
  const {
    isStudying,
    seconds,
    stats,
    isLoading,
    toggleStudying,
    stopSession,
    formatTime
  } = useStudySession();

  const {
    activeSound,
    volume: soundVolume,
    playSound,
    stopSound,
    setVolume: setSoundVolume,
  } = useFocusSound();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [activeRoom, setActiveRoom] = useState<any>(null); // Track active room

  // Create Room State
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPrivacy, setNewRoomPrivacy] = useState("public");
  const [copiedLink, setCopiedLink] = useState(false);

  const [selectedNote, setSelectedNote] = useState("Linear Algebra");

  // Modal States
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<any>(null); // Start null to show setup flow

  // Challenge Creation State
  const [challengeStep, setChallengeStep] = useState(1);
  const [newChallenge, setNewChallenge] = useState({ goal: "40h", duration: "8 days" });

  // Friends State
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [friendError, setFriendError] = useState("");

  // Helper for short time format
  const formatTimeShort = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`;
    return `${m}m`;
  };

  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const fetchActiveChallenge = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Fetching active challenge for user:', user.id);

      // Find a challenge the user is in that hasn't ended
      const { data: myChallenges } = await supabase
        .from('challenge_participants')
        .select('challenge_id, challenges(*)')
        .eq('user_id', user.id)
        .gt('challenges.end_date', new Date().toISOString())
        .order('joined_at', { ascending: false })
        .limit(1);

      console.log('My challenges:', myChallenges);

      if (myChallenges && myChallenges.length > 0) {
        const challenge = myChallenges[0].challenges as any;

        // Check if challenge exists (could be null if deleted or join failed)
        if (!challenge) {
          setActiveChallenge(null);
          localStorage.removeItem('newton_challenge_cache');
          return;
        }

        console.log('Active challenge found:', challenge);

        // Fetch all participants
        const { data: participants } = await supabase
          .from('challenge_participants')
          .select('user_id, progress_seconds')
          .eq('challenge_id', challenge.id);

        console.log('Challenge participants:', participants);

      if (participants) {
        // Map to UI format
        // We need names. For friends, we can look up in our friends list. For self, "You".
        // Ideally we'd join with profiles, but let's use what we have locally first to avoid complex joins if profiles aren't set up.

        console.log('Current friends list:', friends);

        const formattedParticipants = participants.map((p: any, index: number) => {
          const isMe = p.user_id === user.id;
          let name = "Unknown";
          if (isMe) {
            name = "You";
          } else {
            const friend = friends.find(f => f.friendId === p.user_id);
            console.log(`Looking for friend with id ${p.user_id}:`, friend);
            name = friend ? friend.name : "Friend";
          }

          const progressPercent = (p.progress_seconds / challenge.goal_seconds) * 100;
          const colors = [
            "bg-gradient-to-br from-blue-500 to-indigo-500",
            "bg-gradient-to-br from-emerald-400 to-teal-300",
            "bg-gradient-to-br from-purple-400 to-pink-300",
            "bg-gradient-to-br from-orange-400 to-red-300"
          ];

          return {
            id: p.user_id,
            name,
            time: formatTimeShort(p.progress_seconds),
            goal: formatTimeShort(challenge.goal_seconds),
            progress: Math.min(progressPercent, 100),
            color: colors[index % colors.length],
            isCurrentUser: isMe
          };
        });

        // Sort: Me first, then by progress
        formattedParticipants.sort((a: any, b: any) => {
          if (a.isCurrentUser) return -1;
          if (b.isCurrentUser) return 1;
          return b.progress - a.progress;
        });

        const challengeData = {
          id: challenge.id,
          title: challenge.title,
          dateRange: `${new Date(challenge.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${new Date(challenge.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
          participants: formattedParticipants
        };
        console.log('Final challenge data:', challengeData);
        setActiveChallenge(challengeData);
        // Cache the challenge data
        localStorage.setItem('newton_challenge_cache', JSON.stringify(challengeData));
      }
    } else {
      console.log('No active challenges found or no participants');
      setActiveChallenge(null);
      localStorage.removeItem('newton_challenge_cache');
    }
    } catch (error) {
      console.error('Error fetching active challenge:', error);
    }
  };

  useEffect(() => {
    // Load from cache first for instant display
    const cachedChallenge = localStorage.getItem('newton_challenge_cache');
    if (cachedChallenge) {
      try {
        setActiveChallenge(JSON.parse(cachedChallenge));
      } catch (e) {
        console.error('Error parsing cached challenge:', e);
      }
    }

    // Then fetch fresh data
    fetchActiveChallenge();
  }, [friends, stats]); // Re-run when friends load or stats change (session stopped)

  const handleCreateChallenge = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('Creating challenge with selected friends:', selectedFriends);

    const goalHours = parseInt(newChallenge.goal);
    const goalSeconds = goalHours * 3600;
    const durationDays = parseInt(newChallenge.duration);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        creator_id: user.id,
        title: `Study for ${newChallenge.goal} in ${newChallenge.duration}`,
        goal_seconds: goalSeconds,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating challenge:", error);
      return;
    }

    if (challenge) {
      console.log('Challenge created:', challenge);

      // Add self
      const { error: selfError } = await supabase.from('challenge_participants').insert({
        challenge_id: challenge.id,
        user_id: user.id
      });

      if (selfError) {
        console.error('Error adding self to challenge:', selfError);
      }

      // Add selected friends
      if (selectedFriends.length > 0) {
        const friendsToAdd = selectedFriends.map(friendId => ({
          challenge_id: challenge.id,
          user_id: friendId
        }));
        console.log('Adding friends to challenge:', friendsToAdd);
        const { error: friendsError } = await supabase.from('challenge_participants').insert(friendsToAdd);

        if (friendsError) {
          console.error('Error adding friends to challenge:', friendsError);
        } else {
          console.log('Friends added successfully');
        }
      }

      setShowChallengeModal(false);
      setSelectedFriends([]); // Reset selected friends
      fetchActiveChallenge();
    }
  };

  const handleEndChallenge = async () => {
    if (!activeChallenge) return;

    try {
      const supabase = createClient();

      // Update the challenge's end_date to now, effectively ending it
      const { error } = await supabase
        .from('challenges')
        .update({ end_date: new Date().toISOString() })
        .eq('id', activeChallenge.id);

      if (error) {
        console.error('Error ending challenge:', error);
        return;
      }

      // Clear local state and cache
      setActiveChallenge(null);
      localStorage.removeItem('newton_challenge_cache');
    } catch (error) {
      console.error('Error ending challenge:', error);
    }
  };

  // Task state
  interface Task {
    id: string;
    text: string;
    completed: boolean;
    completed_at?: string | null;
  }

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  // Load tasks from Supabase on mount
  useEffect(() => {
    // Load from cache first
    const cachedTasks = localStorage.getItem('newton_tasks_cache');
    if (cachedTasks) {
      try {
        setTasks(JSON.parse(cachedTasks));
      } catch (e) {
        console.error("Error parsing cached tasks:", e);
      }
    }

    const fetchTasks = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        return;
      }

      if (data) {
        // Filter out tasks completed on previous days
        const today = new Date().toDateString();
        const activeTasks = data.filter((task: Task) => {
          if (!task.completed || !task.completed_at) return true;
          return new Date(task.completed_at).toDateString() === today;
        });
        setTasks(activeTasks);
        localStorage.setItem('newton_tasks_cache', JSON.stringify(activeTasks));
      }
    };

    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTask.trim()) {
      const taskText = newTask.trim();
      setNewTask(""); // Clear input immediately

      // Optimistic update
      const tempId = crypto.randomUUID();
      const tempTask: Task = {
        id: tempId,
        text: taskText,
        completed: false,
        completed_at: null
      };

      const updatedTasks = [...tasks, tempTask];
      setTasks(updatedTasks);
      localStorage.setItem('newton_tasks_cache', JSON.stringify(updatedTasks));

      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .insert({ text: taskText })
        .select()
        .single();

      if (error) {
        console.error("Error adding task:", error);
        // Rollback
        setTasks(prev => prev.filter(t => t.id !== tempId));
        return;
      }

      // Update with real ID
      if (data) {
        setTasks(prev => {
          const newTasks = prev.map(t => t.id === tempId ? data : t);
          localStorage.setItem('newton_tasks_cache', JSON.stringify(newTasks));
          return newTasks;
        });
      }
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    const now = new Date().toISOString();
    const newCompletedAt = newCompleted ? now : null;

    // Optimistic update
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          completed: newCompleted,
          completed_at: newCompletedAt
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    localStorage.setItem('newton_tasks_cache', JSON.stringify(updatedTasks));

    const supabase = createClient();
    const { error } = await supabase
      .from('tasks')
      .update({
        completed: newCompleted,
        completed_at: newCompletedAt
      })
      .eq('id', id);

    if (error) {
      console.error("Error toggling task:", error);
      // Rollback
      setTasks(prev => prev.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: !newCompleted,
            completed_at: !newCompleted ? now : null // Approximate rollback
          };
        }
        return t;
      }));
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistic update
    const previousTasks = tasks;
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('newton_tasks_cache', JSON.stringify(updatedTasks));

    const supabase = createClient();
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting task:", error);
      // Rollback
      setTasks(previousTasks);
    }
  };

  // Fetch friends on mount
  useEffect(() => {
    // Load from cache first
    const cachedFriends = localStorage.getItem('newton_friends_cache');
    const cachedRequests = localStorage.getItem('newton_requests_cache');

    if (cachedFriends) {
      try { setFriends(JSON.parse(cachedFriends)); } catch (e) { }
    }
    if (cachedRequests) {
      try { setPendingRequests(JSON.parse(cachedRequests)); } catch (e) { }
    }

    const fetchFriends = async () => {
      try {
        const response = await fetch('/api/friends');
        if (response.ok) {
          const data = await response.json();
          const friendsList = data.friends || [];
          const requestsList = data.pendingReceived || [];

          setFriends(friendsList);
          setPendingRequests(requestsList);

          localStorage.setItem('newton_friends_cache', JSON.stringify(friendsList));
          localStorage.setItem('newton_requests_cache', JSON.stringify(requestsList));
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };
    fetchFriends();
  }, []);

  // Send friend request
  const handleSendFriendRequest = async () => {
    if (!friendEmail.trim()) return;

    setIsSendingRequest(true);
    setFriendError("");

    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: friendEmail.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setFriendEmail("");
        setShowFriendModal(false);
        // Refresh friends list
        const friendsResponse = await fetch('/api/friends');
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData.friends || []);
          setPendingRequests(friendsData.pendingReceived || []);
        }
      } else {
        setFriendError(data.error || 'Failed to send friend request');
      }
    } catch (error) {
      setFriendError('An error occurred. Please try again.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Accept friend request
  const handleAcceptFriend = async (friendshipId: string) => {
    try {
      const response = await fetch('/api/friends/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action: 'accept' })
      });

      if (response.ok) {
        // Refresh friends list
        const friendsResponse = await fetch('/api/friends');
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData.friends || []);
          setPendingRequests(friendsData.pendingReceived || []);
        }
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  // Reject friend request
  const handleRejectFriend = async (friendshipId: string) => {
    try {
      const response = await fetch('/api/friends/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action: 'reject' })
      });

      if (response.ok) {
        // Refresh friends list
        const friendsResponse = await fetch('/api/friends');
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          setFriends(friendsData.friends || []);
          setPendingRequests(friendsData.pendingReceived || []);
        }
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  // Live Rooms State
  const [liveRooms, setLiveRooms] = useState<any[]>([]);
  const [roomParticipants, setRoomParticipants] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Fetch live rooms
  const fetchLiveRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setLiveRooms(data.rooms || []);
      } else {
        console.error('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Fetch rooms when switching to live tab
  useEffect(() => {
    if (activeTab === 'live') {
      fetchLiveRooms();
    }
  }, [activeTab]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      const response = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          privacy: newRoomPrivacy,
          tags: [newRoomPrivacy === "public" ? "Open" : "Invite Only", "Study"],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Room created:', data.room);

        // Refresh rooms list
        await fetchLiveRooms();

        // Reset form
        setNewRoomName("");
        setNewRoomPrivacy("public");
        setCopiedLink(false);
        setShowCreateRoomModal(false);

        // Optionally join the room
        // setActiveRoom(data.room);
      } else {
        const error = await response.json();
        console.error('Failed to create room:', error.error);
        alert(error.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('An error occurred while creating the room');
    }
  };

  const copyRoomLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="h-[100dvh] bg-white text-black flex flex-col overflow-hidden">
      {activeRoom ? (
        // Active Room View (Light Mode)
        <div className="relative w-full h-full bg-gray-50 flex flex-col">
          {/* Room Header */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveRoom(null)}
                className="p-2 rounded-full bg-white hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer shadow-sm border border-gray-200"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-gray-900 font-bold text-lg leading-none">{activeRoom.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-gray-500 text-xs font-medium">{activeRoom.participants} online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 text-sm font-mono">00:42:15</span>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-1 p-4 pt-24 pb-24 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto h-full content-center">
              {roomParticipants.map((participant) => (
                <div key={participant.id} className="aspect-video bg-white rounded-2xl overflow-hidden relative group border border-gray-200 shadow-sm">
                  {/* Video Placeholder / Avatar */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    {participant.isVideoOff ? (
                      <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-gray-400 shadow-sm border border-gray-200">
                        {participant.avatar}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm font-medium">Video Feed</div>
                    )}
                  </div>

                  {/* Overlay Info */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    {participant.isMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                    <span className="text-gray-700 text-xs font-bold">{participant.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-gray-200 shadow-xl z-20">
            <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer group">
              <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer group">
              <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <button className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer group">
              <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <div className="w-px h-8 bg-gray-200 mx-1" />
            <button
              onClick={() => setActiveRoom(null)}
              className="px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-all cursor-pointer"
            >
              Leave Room
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full max-w-[1600px] mx-auto flex flex-col gap-6 p-4 lg:p-6">
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden max-[872px]:flex items-center justify-center w-9 h-9 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-gray-900" />
                  Study Room
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Focus on your goals and track your progress
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tab Switcher */}
              <div className="flex p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === "dashboard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("live")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === "live" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Live Rooms
                </button>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  {stats ? `${stats.current_streak} Day Streak` : 'No Streak'}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 relative">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 overflow-y-auto lg:overflow-hidden pr-1"
                >
                  {/* Column 1: Timer & Tasks - 5/12 */}
                  <div className="lg:col-span-5 h-fit lg:h-full flex flex-col gap-4 lg:gap-2 lg:min-h-0">
                    {/* Timer Card - Flexible on Desktop, Fixed on Mobile */}
                    <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl shrink-0 lg:shrink lg:flex-[0.8] lg:min-h-0 overflow-visible lg:overflow-hidden">
                      <CardBody className="p-6 lg:p-4 flex flex-col items-center justify-center relative overflow-hidden h-full">
                        {/* Background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center w-full justify-between h-full py-2 lg:py-1">
                          <div className="relative flex flex-col items-center justify-center flex-1">
                            <div className="absolute inset-0 rounded-full bg-gray-100 blur-3xl opacity-50 transform scale-150 pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col items-center">
                              <span
                                className="font-bold text-gray-900 font-mono tracking-tighter tabular-nums select-none max-w-full leading-none"
                                style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}
                              >
                                {formatTime(seconds)}
                              </span>
                              <div className="mt-4 lg:mt-2 flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                <div className={`w-2 h-2 rounded-full ${isStudying ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                <span className="text-xs lg:text-[10px] font-medium whitespace-nowrap">
                                  {isStudying ? `Focusing: ${selectedNote}` : seconds > 0 ? "Paused" : "Ready?"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 lg:gap-3 shrink-0">
                            <button
                              onClick={toggleStudying}
                              className="h-14 w-14 lg:h-10 lg:w-10 rounded-full flex items-center justify-center bg-black text-white cursor-pointer hover:scale-105 transition-transform"
                            >
                              {isStudying ? (
                                <Pause size={24} strokeWidth={2.5} className="fill-current lg:w-4 lg:h-4" />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" className="w-6 h-6 lg:w-4 lg:h-4">
                                  <path fill="currentColor" d="M10.138 3.382C8.304 2.31 6 3.632 6 5.756v16.489c0 2.123 2.304 3.445 4.138 2.374l14.697-8.59c1.552-.907 1.552-3.15 0-4.057l-14.697-8.59Z" />
                                </svg>
                              )}
                            </button>

                            <button
                              disabled={seconds === 0}
                              className={`h-14 w-14 lg:h-10 lg:w-10 rounded-full flex items-center justify-center border transition-all ${seconds === 0
                                ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                : "bg-white text-red-500 border-gray-200 cursor-pointer hover:bg-red-50 hover:border-red-100"
                                }`}
                              onClick={() => stopSession()}
                            >
                              <Square size={24} strokeWidth={2.5} className="fill-current lg:w-4 lg:h-4" />
                            </button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Tasks Card - Flexible on Desktop, Fixed height on Mobile */}
                    <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl h-[400px] lg:h-auto lg:flex-[1.2] lg:min-h-0 overflow-hidden shrink-0 lg:shrink">
                      <CardHeader className="pb-2 pt-6 lg:pt-4 px-6 lg:px-5 flex justify-between items-center shrink-0">
                        <h3 className="text-lg lg:text-base font-semibold text-gray-900">Tasks</h3>
                        <span className="text-sm lg:text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {tasks.filter(t => t.completed).length}/{tasks.length}
                        </span>
                      </CardHeader>
                      <CardBody className="px-6 lg:px-5 pb-6 lg:pb-4 pt-0 flex flex-col min-h-0 overflow-hidden">
                        <div className="mb-4 lg:mb-4 shrink-0">
                          <Input
                            placeholder="Add task..."
                            value={newTask}
                            onValueChange={setNewTask}
                            onKeyDown={handleAddTask}
                            startContent={<Plus className="w-5 h-5 lg:w-4 lg:h-4 text-gray-400" />}
                            classNames={{
                              inputWrapper: "bg-gray-50 border-none shadow-none h-12 lg:h-11 rounded-xl w-full min-h-0",
                              input: "outline-none text-base lg:text-sm",
                            }}
                            fullWidth
                          />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 lg:space-y-2 pr-1 min-h-0">
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              className="group flex items-center gap-3 lg:gap-3 p-2 lg:p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => toggleTask(task.id)}
                            >
                              <div className={`shrink-0 transition-colors ${task.completed ? "text-green-500" : "text-gray-300 group-hover:text-gray-400"}`}>
                                {task.completed ? (
                                  <CheckCircle2 className="w-5 h-5 lg:w-5 lg:h-5" />
                                ) : (
                                  <Circle className="w-5 h-5 lg:w-5 lg:h-5" />
                                )}
                              </div>
                              <span className={`flex-1 text-base lg:text-sm transition-all truncate ${task.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                {task.text}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                              >
                                <X className="w-4 h-4 lg:w-4 lg:h-4" />
                              </button>
                            </div>
                          ))}
                          {tasks.length === 0 && (
                            <div className="text-center py-8 lg:py-4 text-gray-400 text-sm lg:text-xs">
                              No tasks yet.
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Column 2: Social & Stats - 4/12 */}
                  <div className="lg:col-span-4 h-fit lg:h-full flex flex-col gap-6 lg:gap-4 lg:min-h-0">
                    {/* Stats - Flexible but with max height constraint preference */}
                    <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl shrink-0 lg:shrink lg:flex-[0.3] lg:min-h-0">
                      <CardHeader className="pb-2 pt-6 lg:pt-4 px-6 lg:px-5">
                        <h3 className="text-base lg:text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-gray-500" />
                          Stats
                        </h3>
                      </CardHeader>
                      <CardBody className="px-6 lg:px-5 pb-6 lg:pb-4 pt-0 h-full">
                        <div className="flex flex-col h-full gap-4 lg:gap-2">
                          <div className="flex-1 flex flex-col justify-center min-h-0">
                            <div className="flex justify-between mb-2 lg:mb-1">
                              <span className="text-sm lg:text-xs text-gray-500">Weekly Goal</span>
                              <span className="text-sm lg:text-xs font-semibold text-gray-900">
                                {stats
                                  ? `${((stats.weekly_time + seconds) / 3600).toFixed(1)}h / ${(stats.weekly_goal / 3600).toFixed(0)}h`
                                  : '0h / 20h'}
                              </span>
                            </div>
                            <Progress
                              value={stats ? Math.min(((stats.weekly_time + seconds) / stats.weekly_goal) * 100, 100) : 0}
                              aria-label="Weekly study goal progress"
                              classNames={{
                                indicator: "bg-gray-900",
                                track: "bg-gray-100",
                              }}
                              className="h-2 lg:h-1.5"
                            />
                          </div>

                          <div className="flex-[1.2] grid grid-cols-2 gap-4 lg:gap-3 min-h-0">
                            <div className="p-3 lg:p-2.5 bg-gray-50 rounded-2xl lg:rounded-xl flex flex-col justify-center h-full">
                              <p className="text-[10px] lg:text-[9px] uppercase tracking-wider text-gray-500 mb-1 lg:mb-0.5">Total Time</p>
                              <p className="text-lg lg:text-base font-bold text-gray-900 leading-none">
                                {stats ? `${((stats.total_time + seconds) / 3600).toFixed(1)}h` : '0h'}
                              </p>
                            </div>
                            <div className="p-3 lg:p-2.5 bg-gray-50 rounded-2xl lg:rounded-xl flex flex-col justify-center h-full">
                              <p className="text-[10px] lg:text-[9px] uppercase tracking-wider text-gray-500 mb-1 lg:mb-0.5">Sessions</p>
                              <p className="text-lg lg:text-base font-bold text-gray-900 leading-none">
                                {stats ? stats.total_sessions : 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Friends - Takes remaining space */}
                    <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl h-[300px] lg:h-auto lg:flex-[0.7] lg:min-h-0 overflow-hidden shrink-0 lg:shrink">
                      <CardHeader className="pb-2 pt-6 lg:pt-4 px-6 lg:px-5 flex justify-between items-center shrink-0">
                        <h3 className="text-lg lg:text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Users className="w-5 h-5 lg:w-4 lg:h-4 text-gray-500" />
                          Friends
                        </h3>
                        <div className="flex items-center gap-2">
                          {pendingRequests.length > 0 && (
                            <Chip size="sm" variant="flat" className="bg-orange-50 text-orange-700 h-7 lg:h-6 text-sm lg:text-xs px-1">
                              {pendingRequests.length} pending
                            </Chip>
                          )}
                          <Chip size="sm" variant="flat" className="bg-green-50 text-green-700 h-7 lg:h-6 text-sm lg:text-xs px-1">
                            {friends.length} friends
                          </Chip>
                          <button
                            onClick={() => setShowFriendModal(true)}
                            className="w-7 h-7 lg:w-6 lg:h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardBody className="px-6 lg:px-5 pb-6 lg:pb-4 pt-0 overflow-y-auto custom-scrollbar min-h-0">
                        <div className="space-y-4 lg:space-y-3">
                          {/* Pending Requests */}
                          {pendingRequests.map((request: any) => (
                            <div
                              key={request.id}
                              className="flex items-center justify-between p-3 lg:p-2.5 bg-orange-50 rounded-xl border border-orange-100"
                            >
                              <div className="flex items-center gap-3 lg:gap-2 flex-1 min-w-0">

                                <Avatar
                                  src={request.avatar || undefined}
                                  name={request.name[0]}
                                  size="sm"
                                  className="bg-orange-100 text-orange-600 font-semibold w-9 h-9 lg:w-8 lg:h-8 text-sm lg:text-xs flex-shrink-0"
                                  classNames={{
                                    img: "opacity-100"
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm lg:text-xs text-gray-900 truncate">
                                    {request.name}
                                  </p>
                                  <p className="text-xs lg:text-[10px] text-gray-500">Friend request</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleAcceptFriend(request.id)}
                                  className="w-7 h-7 lg:w-6 lg:h-6 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors cursor-pointer"
                                  title="Accept"
                                >
                                  <CheckCircle2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRejectFriend(request.id)}
                                  className="w-7 h-7 lg:w-6 lg:h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Friends List */}
                          {friends.map((friend: any) => (
                            <div
                              key={friend.id}
                              className="flex items-center justify-between group p-3 lg:p-2.5 hover:bg-gray-50 rounded-xl transition-colors -mx-2 lg:-mx-1.5"
                            >
                              <div className="flex items-center gap-3 lg:gap-3">
                                <div className="relative">
                                  <Avatar
                                    src={friend.avatar || undefined}
                                    name={friend.name[0]}
                                    size="sm"
                                    className="bg-gray-100 text-gray-600 font-semibold w-10 h-10 lg:w-9 lg:h-9 text-sm lg:text-xs"
                                    classNames={{
                                      img: "opacity-100"
                                    }}
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-2.5 lg:h-2.5 bg-gray-300 rounded-full border-2 border-white"></div>
                                </div>
                                <div>
                                  <p className="font-medium text-base lg:text-sm text-gray-900">
                                    {friend.name}
                                  </p>
                                  <p className="text-sm lg:text-xs text-gray-500">Offline</p>
                                </div>
                              </div>
                            </div>
                          ))}

                          {friends.length === 0 && pendingRequests.length === 0 && (
                            <div className="text-center py-6 text-gray-400">
                              <p className="text-sm lg:text-xs">No friends yet</p>
                              <p className="text-xs lg:text-[10px] mt-1">Add friends to study together!</p>
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  </div>

                  {/* Column 3: Challenge & Sounds - 3/12 */}
                  <div className="lg:col-span-3 h-fit lg:h-full flex flex-col gap-6 lg:gap-4 lg:min-h-0">
                    {/* Challenge Card */}
                    <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl h-[400px] lg:h-auto lg:flex-[3] lg:min-h-0 flex flex-col relative overflow-hidden shrink-0 lg:shrink">
                      {!activeChallenge ? (
                        <CardBody className="flex flex-col items-center justify-center p-6 lg:p-4 text-center h-full">
                          <div className="w-14 h-14 lg:w-12 lg:h-12 bg-orange-50 rounded-full flex items-center justify-center mb-4 lg:mb-3">
                            <Trophy className="w-7 h-7 lg:w-6 lg:h-6 text-orange-500" />
                          </div>
                          <h3 className="text-base lg:text-sm font-bold text-gray-900 mb-2 lg:mb-1">No Active Challenge</h3>
                          <p className="text-xs lg:text-[10px] text-gray-500 mb-6 lg:mb-4 max-w-[200px] lg:max-w-[150px]">
                            Push your limits. Set a goal.
                          </p>
                          <Button
                            onPress={() => {
                              setChallengeStep(1);
                              setSelectedFriends([]);
                              setNewChallenge({ goal: "40h", duration: "8 days" });
                              setShowChallengeModal(true);
                            }}
                            className="bg-gray-900 text-white font-medium rounded-xl lg:rounded-lg px-6 lg:px-4 h-10 lg:h-8 text-sm lg:text-xs"
                          >
                            Create Challenge
                          </Button>
                        </CardBody>
                      ) : (
                        <>
                          <CardHeader className="pb-2 pt-6 lg:pt-4 px-6 lg:px-5 shrink-0 flex flex-col items-start gap-1">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2 mb-2 lg:mb-1">
                                <div className="p-1.5 lg:p-1 bg-orange-50 rounded-lg lg:rounded-md">
                                  <Trophy className="w-4 h-4 lg:w-3 lg:h-3 text-orange-500" />
                                </div>
                                <span className="text-sm lg:text-xs font-semibold text-orange-600 uppercase tracking-wider">Active</span>
                              </div>
                              <button
                                onClick={handleEndChallenge}
                                className="text-sm lg:text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                End
                              </button>
                            </div>
                            <h3 className="text-xl lg:text-lg font-bold text-gray-900 leading-tight">
                              {activeChallenge.title}
                            </h3>
                            <p className="text-sm lg:text-xs font-medium text-gray-400">
                              {activeChallenge.dateRange}
                            </p>
                          </CardHeader>
                          <CardBody className="px-6 lg:px-5 pb-6 lg:pb-4 pt-4 lg:pt-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                            <div className="space-y-5 lg:space-y-4">
                              {activeChallenge.participants.map((participant: any) => (
                                <div key={participant.id} className="flex flex-col gap-2 lg:gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-7 h-7 lg:w-6 lg:h-6 rounded-full ${participant.color} shadow-sm`} />
                                      <span className={`text-base lg:text-sm font-medium ${participant.isCurrentUser ? "text-gray-900" : "text-gray-600"}`}>
                                        {participant.name}
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-base lg:text-sm font-bold text-gray-900">{participant.time}</span>
                                      <span className="text-sm lg:text-xs text-gray-400">/ {participant.goal}</span>
                                    </div>
                                  </div>
                                  <div className="h-2.5 lg:h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${participant.progress}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                      className={`h-full rounded-full ${participant.color}`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardBody>
                        </>
                      )}
                    </Card>

                    {/* Focus Sounds Card - Takes remaining space */}
                    <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl h-[200px] lg:h-auto lg:flex-[1] lg:min-h-0 overflow-hidden shrink-0 lg:shrink flex flex-col">
                      <CardHeader className="pb-2 pt-6 lg:pt-4 px-6 lg:px-5 shrink-0 flex justify-between items-center">
                        <h3 className="text-base lg:text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <Headphones className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-violet-500" />
                          Focus Sounds
                        </h3>
                        {activeSound && (
                          <button
                            onClick={stopSound}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                      </CardHeader>
                      <CardBody className="px-6 lg:px-5 pb-6 lg:pb-4 pt-0 flex-1 min-h-0 relative">
                        <AnimatePresence mode="wait">
                          {!activeSound ? (
                            <motion.div
                              key="sound-selection"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                              className="grid grid-cols-3 gap-3 lg:gap-2 h-full"
                            >
                              <button
                                onClick={() => playSound('rain')}
                                className="flex flex-col items-center justify-center gap-2 lg:gap-1.5 p-3 lg:p-2 rounded-2xl lg:rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-all group cursor-pointer h-full"
                              >
                                <CloudRain className="w-5 h-5 lg:w-7 lg:h-7 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="text-sm lg:text-xs font-medium">Rain</span>
                              </button>
                              <button
                                onClick={() => playSound('lofi')}
                                className="flex flex-col items-center justify-center gap-2 lg:gap-1.5 p-3 lg:p-2 rounded-2xl lg:rounded-xl bg-gray-50 hover:bg-purple-50 hover:text-purple-600 transition-all group cursor-pointer h-full"
                              >
                                <Music className="w-5 h-5 lg:w-7 lg:h-7 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                <span className="text-sm lg:text-xs font-medium">Lo-Fi</span>
                              </button>
                              <button
                                onClick={() => playSound('cafe')}
                                className="flex flex-col items-center justify-center gap-2 lg:gap-1.5 p-3 lg:p-2 rounded-2xl lg:rounded-xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-all group cursor-pointer h-full"
                              >
                                <Coffee className="w-5 h-5 lg:w-7 lg:h-7 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                <span className="text-sm lg:text-xs font-medium">Cafe</span>
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="volume-control"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                              exit={{ opacity: 0, y: 10 }}
                              className="flex items-center justify-center h-full w-full px-4"
                            >
                              <Slider.Root
                                value={[soundVolume]}
                                onValueChange={(value) => setSoundVolume(value[0])}
                                max={100}
                                step={1}
                                className="relative flex items-center select-none touch-none w-full h-5"
                              >
                                <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                                  <Slider.Range className="absolute bg-gray-900 rounded-full h-full" />
                                </Slider.Track>
                                <Slider.Thumb
                                  className="block w-4 h-4 bg-gray-900 rounded-full hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-transform cursor-pointer"
                                  aria-label="Volume"
                                />
                              </Slider.Root>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardBody>
                    </Card>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="live"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-y-auto custom-scrollbar"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Loading State */}
                    {isLoadingRooms && (
                      <div className="col-span-full flex items-center justify-center py-20">
                        <div className="text-center">
                          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-500 text-sm">Loading live rooms...</p>
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {!isLoadingRooms && liveRooms.length === 0 && (
                      <div className="col-span-full flex items-center justify-center py-20">
                        <div className="text-center max-w-md">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Live Rooms Yet</h3>
                          <p className="text-sm text-gray-500 mb-6">
                            Be the first to create a study room and invite others to join!
                          </p>
                          <Button
                            onPress={() => setShowCreateRoomModal(true)}
                            className="bg-gray-900 text-white font-medium rounded-xl px-6 h-10"
                          >
                            Create First Room
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Live Room Cards */}
                    {!isLoadingRooms && liveRooms.map((room, index) => {
                      // Generate consistent gradient for each room
                      const gradients = [
                        "bg-gradient-to-br from-slate-900 to-slate-800",
                        "bg-gradient-to-br from-indigo-950 to-slate-900",
                        "bg-gradient-to-br from-rose-950 to-slate-900",
                        "bg-gradient-to-br from-blue-950 to-slate-900",
                        "bg-gradient-to-br from-teal-950 to-slate-900",
                      ];
                      const gradient = gradients[index % gradients.length];

                      return (
                        <Card
                          key={room.id}
                          className="h-[240px] border-none shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group rounded-3xl overflow-hidden relative"
                          isPressable
                          onPress={() => setActiveRoom(room)}
                        >
                          <CardBody className="p-0 h-full relative overflow-hidden">
                            {/* Background Image/Gradient */}
                            <div className={`absolute inset-0 ${gradient}`} />

                          {/* Content */}
                          <div className="relative h-full flex flex-col justify-between p-6 pb-20 md:pb-6 text-white z-10">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-2 flex-wrap">
                                {room.tags.map((tag: string) => (
                                  <span key={tag} className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-medium border border-white/5">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {room.type === "private" && (
                                <div className="p-1.5 rounded-full bg-black/20 backdrop-blur-md">
                                  <Lock className="w-3 h-3 text-white/70" />
                                </div>
                              )}
                            </div>

                            <div className="transform transition-transform duration-300 md:group-hover:-translate-y-12">
                              <h3 className="text-xl font-bold mb-2 tracking-tight">{room.name}</h3>
                              <div className="flex items-center gap-3 text-sm text-white/60 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                <span>{room.participants} online</span>
                              </div>
                            </div>

                            {/* Join Button - Visible on mobile, hover on desktop */}
                            <div className="absolute inset-x-0 bottom-0 p-6 opacity-100 translate-y-0 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300">
                              <div className="w-full bg-white text-black py-2.5 rounded-xl font-bold text-sm text-center shadow-lg">
                                Join Session
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                    })}

                    {/* Create Room Card - Now at the end */}
                    <button
                      onClick={() => setShowCreateRoomModal(true)}
                      className="group flex flex-col items-center justify-center h-[240px] rounded-3xl border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 gap-4 bg-white cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-50 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all duration-300 border border-gray-100">
                        <Plus className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900 text-base">Create Room</h3>
                        <p className="text-xs text-gray-500 mt-1">Host a session</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )
      }

      {/* Invite Friend Modal */}
      <AnimatePresence>
        {showFriendModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFriendModal(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-3xl shadow-2xl z-50 p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add Friend</h3>
                <button onClick={() => {
                  setShowFriendModal(false);
                  setFriendEmail("");
                  setFriendError("");
                }} className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                    Enter Friend's Email
                  </label>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={friendEmail}
                    onValueChange={setFriendEmail}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isSendingRequest) {
                        handleSendFriendRequest();
                      }
                    }}
                    startContent={<Users className="w-4 h-4 text-gray-400" />}
                    classNames={{
                      inputWrapper: "bg-gray-50 border-none shadow-none h-12 rounded-xl w-full",
                      input: "outline-none",
                    }}
                    fullWidth
                  />
                  {friendError && (
                    <p className="text-xs text-red-500 mt-2">{friendError}</p>
                  )}
                </div>

                <Button
                  onPress={handleSendFriendRequest}
                  isDisabled={!friendEmail.trim() || isSendingRequest}
                  className="w-full bg-gray-900 text-white font-medium rounded-xl py-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSendingRequest ? "Sending..." : "Send Friend Request"}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Your friend will receive a friend request that they can accept or decline.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Challenge Modal */}
      <AnimatePresence>
        {showChallengeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowChallengeModal(false);
                setChallengeStep(1);
                setSelectedFriends([]);
                setNewChallenge({ goal: "40h", duration: "8 days" });
              }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-3xl shadow-2xl z-50 p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">New Challenge</h3>
                <button onClick={() => {
                  setShowChallengeModal(false);
                  setChallengeStep(1);
                  setSelectedFriends([]);
                  setNewChallenge({ goal: "40h", duration: "8 days" });
                }} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {challengeStep === 1 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setNewChallenge({ ...newChallenge, goal: "40h" })}
                      className={`p-4 rounded-2xl border text-left transition-all ${newChallenge.goal === "40h" ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <Target className="w-5 h-5 mb-3 text-gray-900" />
                      <p className="font-semibold text-gray-900">40 Hours</p>
                      <p className="text-xs text-gray-500 mt-1">Intense focus</p>
                    </button>
                    <button
                      onClick={() => setNewChallenge({ ...newChallenge, goal: "20h" })}
                      className={`p-4 rounded-2xl border text-left transition-all ${newChallenge.goal === "20h" ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <Target className="w-5 h-5 mb-3 text-gray-900" />
                      <p className="font-semibold text-gray-900">20 Hours</p>
                      <p className="text-xs text-gray-500 mt-1">Balanced week</p>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Duration</label>
                    <div className="flex gap-2">
                      {["3 days", "5 days", "8 days"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setNewChallenge({ ...newChallenge, duration: d })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${newChallenge.duration === d ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onPress={() => setChallengeStep(2)}
                    className="w-full bg-gray-900 text-white font-medium rounded-xl py-6"
                    endContent={<ChevronRight className="w-4 h-4" />}
                  >
                    Next Step
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-orange-50 rounded-2xl p-6 text-center">
                    <Trophy className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                    <h4 className="text-lg font-bold text-gray-900">Ready to start?</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Goal: {newChallenge.goal} in {newChallenge.duration}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Invite Friends</label>
                    <div className="space-y-2">
                      {friends.length > 0 ? (
                        friends.map((friend: any) => (
                          <div key={friend.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Avatar name={friend.name} size="sm" className="w-8 h-8 text-xs" />
                              <span className="text-sm font-medium text-gray-900">{friend.name}</span>
                            </div>
                            <Checkbox
                              isSelected={selectedFriends.includes(friend.friendId)}
                              onValueChange={(isSelected) => {
                                if (isSelected) {
                                  setSelectedFriends([...selectedFriends, friend.friendId]);
                                } else {
                                  setSelectedFriends(selectedFriends.filter(id => id !== friend.friendId));
                                }
                              }}
                              size="sm"
                              color="default"
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No friends found. Add friends to challenge them!</p>
                      )}
                    </div>
                  </div>

                  <Button
                    onPress={handleCreateChallenge}
                    className="w-full bg-gray-900 text-white font-medium rounded-xl py-6"
                  >
                    Start Challenge
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoomModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowCreateRoomModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Create Live Room</h2>
                  <button
                    onClick={() => setShowCreateRoomModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Room Name</label>
                    <Input
                      placeholder="e.g., Late Night Grind 🌙"
                      value={newRoomName}
                      onValueChange={setNewRoomName}
                      classNames={{
                        inputWrapper: "bg-gray-50 border-none shadow-none h-12 rounded-xl w-full",
                        input: "outline-none",
                      }}
                      fullWidth
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Privacy</label>
                    <div className="flex gap-4 p-1 bg-gray-50 rounded-xl">
                      <button
                        onClick={() => setNewRoomPrivacy("public")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${newRoomPrivacy === "public" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"
                          }`}
                      >
                        Public
                      </button>
                      <button
                        onClick={() => setNewRoomPrivacy("private")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${newRoomPrivacy === "private" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-900"
                          }`}
                      >
                        Private
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Invite Link</label>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={copyRoomLink}
                        className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4" />
                            Copy Invite Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gray-900 text-white font-bold h-12 rounded-xl mt-4"
                    onPress={handleCreateRoom}
                    isDisabled={!newRoomName.trim()}
                  >
                    Create Room
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
}
