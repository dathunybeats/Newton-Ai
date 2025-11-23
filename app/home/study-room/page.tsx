"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
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
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudyRoomPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isStudying, setIsStudying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedNote, setSelectedNote] = useState("Linear Algebra");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);

  // Modal States
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<any>(null); // Start null to show setup flow

  // Challenge Creation State
  const [challengeStep, setChallengeStep] = useState(1);
  const [newChallenge, setNewChallenge] = useState({ goal: "40h", duration: "8 days" });

  const handleCreateChallenge = () => {
    setActiveChallenge({
      title: `Study for ${newChallenge.goal} in ${newChallenge.duration}`,
      dateRange: "2 Apr 2025 - 10 Apr 2025",
      participants: [
        { id: 1, name: "Bro 3", time: "1h 24m", goal: newChallenge.goal, progress: 3.5, color: "bg-gradient-to-br from-blue-400 to-cyan-300", isCurrentUser: false },
        { id: 2, name: "Bro 2", time: "49m", goal: newChallenge.goal, progress: 2, color: "bg-gradient-to-br from-emerald-400 to-teal-300", isCurrentUser: false },
        { id: 3, name: "You", time: "31m", goal: newChallenge.goal, progress: 1.2, color: "bg-gradient-to-br from-blue-500 to-indigo-500", isCurrentUser: true },
        { id: 4, name: "Bro", time: "32s", goal: newChallenge.goal, progress: 0.1, color: "bg-gradient-to-br from-purple-400 to-pink-300", isCurrentUser: false },
      ]
    });
    setShowChallengeModal(false);
    setChallengeStep(1);
  };

  const toggleStudying = () => {
    if (!isStudying) {
      // Starting timer - set to 1 second immediately
      setSeconds(accumulatedTime + 1);
      setStartTime(Date.now() - 1000);
      setIsStudying(true);
    } else {
      // Pausing timer
      setAccumulatedTime(seconds);
      setStartTime(null);
      setIsStudying(false);
    }
  };

  // Task state
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review Linear Algebra notes", completed: false },
    { id: 2, text: "Complete practice problems", completed: false },
    { id: 3, text: "Read Chapter 4", completed: true },
  ]);
  const [newTask, setNewTask] = useState("");

  // Timer logic - updates every 100ms for smooth counting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStudying && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSeconds(accumulatedTime + elapsed);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isStudying, startTime, accumulatedTime]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddTask = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask("");
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Mock data
  const friendsStudying = [
    { name: "Sarah", subject: "Biology", duration: "12 min", avatar: "S", color: "success" },
    { name: "Mike", subject: "Physics", duration: "1h 4m", avatar: "M", color: "primary" },
    { name: "Alex", subject: "Chemistry", duration: "23 min", avatar: "A", color: "warning" },
    { name: "Emma", subject: "History", duration: "5 min", avatar: "E", color: "secondary" },
    { name: "John", subject: "Math", duration: "45 min", avatar: "J", color: "danger" },
  ];

  // Removed static challengeParticipants, now using activeChallenge state

  // Live Rooms Mock Data
  const liveRooms = [
    { id: 1, name: "Deep Work 🌙", participants: 124, type: "public", tags: ["Silent", "Cam On"], image: "bg-gradient-to-br from-indigo-900 to-slate-900" },
    { id: 2, name: "Lo-Fi Study 🎵", participants: 45, type: "public", tags: ["Music", "Chat"], image: "bg-gradient-to-br from-purple-900 to-fuchsia-900" },
    { id: 3, name: "Pomodoro 25/5 🍅", participants: 28, type: "public", tags: ["Timer", "Guided"], image: "bg-gradient-to-br from-red-900 to-orange-900" },
    { id: 4, name: "Math Club 📐", participants: 8, type: "private", tags: ["Group", "Help"], image: "bg-gradient-to-br from-blue-900 to-cyan-900" },
  ];

  return (
    <div className="h-[100dvh] bg-white p-4 lg:p-6 text-black flex flex-col overflow-hidden">
      <div className="w-full h-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-gray-900" />
              Study Room
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Focus on your goals and track your progress
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Tab Switcher */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "dashboard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("live")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "live" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Live Rooms
              </button>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="text-sm font-medium text-gray-700">7 Day Streak</span>
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
                className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto lg:overflow-visible pr-1"
              >
                {/* Column 1: Timer & Tasks - 5/12 */}
                <div className="lg:col-span-5 h-full flex flex-col gap-6">
                  {/* Timer Card */}
                  <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl shrink-0 overflow-visible">
                    <CardBody className="p-8 flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Background decoration */}
                      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none" />

                      <div className="relative z-10 flex flex-col items-center w-full">
                        <div className="relative mb-8">
                          <div className="absolute inset-0 rounded-full bg-gray-100 blur-3xl opacity-50 transform scale-150"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <span className="text-6xl sm:text-7xl xl:text-8xl font-bold text-gray-900 font-mono tracking-tighter tabular-nums select-none">
                              {formatTime(seconds)}
                            </span>
                            <div className="mt-4 flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                              <div className={`w-2 h-2 rounded-full ${isStudying ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                              <span className="text-xs font-medium">
                                {isStudying ? `Focusing: ${selectedNote}` : "Ready to start?"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={toggleStudying}
                            className="h-14 w-14 rounded-full flex items-center justify-center bg-black text-white"
                          >
                            {isStudying ? (
                              <Pause size={24} strokeWidth={2.5} className="fill-current" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 28 28">
                                <path fill="currentColor" d="M10.138 3.382C8.304 2.31 6 3.632 6 5.756v16.489c0 2.123 2.304 3.445 4.138 2.374l14.697-8.59c1.552-.907 1.552-3.15 0-4.057l-14.697-8.59Z" />
                              </svg>
                            )}
                          </button>

                          <button
                            disabled={seconds === 0}
                            className={`h-14 w-14 rounded-full flex items-center justify-center border ${seconds === 0
                              ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                              : "bg-white text-red-500 border-gray-200"
                              }`}
                            onClick={() => {
                              setSeconds(0);
                              setIsStudying(false);
                              setAccumulatedTime(0);
                              setStartTime(null);
                            }}
                          >
                            <Square size={24} strokeWidth={2.5} className="fill-current" />
                          </button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Tasks Card */}
                  <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl flex-1 min-h-0">
                    <CardHeader className="pb-2 pt-6 px-6 flex justify-between items-center shrink-0">
                      <h3 className="text-base font-semibold text-gray-900">Session Tasks</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {tasks.filter(t => t.completed).length}/{tasks.length}
                      </span>
                    </CardHeader>
                    <CardBody className="px-6 pb-6 pt-2 flex flex-col min-h-0">
                      <div className="mb-4">
                        <Input
                          placeholder="Add a new task..."
                          value={newTask}
                          onValueChange={setNewTask}
                          onKeyDown={handleAddTask}
                          startContent={<Plus className="w-4 h-4 text-gray-400" />}
                          classNames={{
                            inputWrapper: "bg-gray-50 border-none shadow-none hover:bg-gray-100 transition-colors",
                          }}
                          size="sm"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => toggleTask(task.id)}
                          >
                            <div className={`shrink-0 transition-colors ${task.completed ? "text-green-500" : "text-gray-300 group-hover:text-gray-400"}`}>
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </div>
                            <span className={`flex-1 text-sm transition-all ${task.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                              {task.text}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {tasks.length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            No tasks yet. Add one to get started!
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Column 2: Social & Stats - 4/12 */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-full">
                  {/* Stats - Fixed height */}
                  <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl shrink-0">
                    <CardHeader className="pb-2 pt-6 px-6">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        Your Stats
                      </h3>
                    </CardHeader>
                    <CardBody className="px-6 pb-6 pt-2">
                      <div className="space-y-5">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-xs text-gray-500">Weekly Goal</span>
                            <span className="text-xs font-semibold text-gray-900">
                              12h / 20h
                            </span>
                          </div>
                          <Progress
                            value={60}
                            classNames={{
                              indicator: "bg-gray-900",
                              track: "bg-gray-100",
                            }}
                            className="h-1.5"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Time</p>
                            <p className="text-lg font-bold text-gray-900">48.5h</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Sessions</p>
                            <p className="text-lg font-bold text-gray-900">24</p>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Friends - Takes remaining space */}
                  <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl flex-1 min-h-0">
                    <CardHeader className="pb-2 pt-6 px-6 flex justify-between items-center shrink-0">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        Friends Online
                      </h3>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat" className="bg-green-50 text-green-700 h-6 text-xs">
                          {friendsStudying.length} active
                        </Chip>
                        <button
                          onClick={() => setShowFriendModal(true)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardBody className="px-6 pb-6 pt-2 overflow-y-auto custom-scrollbar">
                      <div className="space-y-3">
                        {friendsStudying.map((friend, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-xl transition-colors -mx-2"
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar
                                  name={friend.avatar}
                                  size="sm"
                                  className="bg-gray-100 text-gray-600 font-semibold w-8 h-8 text-xs"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-gray-900">
                                  {friend.name}
                                </p>
                                <p className="text-xs text-gray-500">{friend.subject}</p>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-white transition-colors">
                              {friend.duration}
                            </span>
                          </div>
                        ))}
                        {friendsStudying.length === 0 && (
                          <div className="text-center py-6 text-gray-400">
                            <p className="text-sm">No friends studying right now</p>
                          </div>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Column 3: Challenge & Sounds - 3/12 */}
                <div className="lg:col-span-3 h-full flex flex-col gap-6">
                  {/* Challenge Card */}
                  <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl flex-1 min-h-0 flex flex-col relative overflow-hidden">
                    {!activeChallenge ? (
                      <CardBody className="flex flex-col items-center justify-center p-8 text-center h-full">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                          <Trophy className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Challenge</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-[200px]">
                          Push your limits. Set a goal and compete with friends.
                        </p>
                        <Button
                          onPress={() => setShowChallengeModal(true)}
                          className="bg-gray-900 text-white font-medium rounded-xl px-6"
                        >
                          Create Challenge
                        </Button>
                      </CardBody>
                    ) : (
                      <>
                        <CardHeader className="pb-2 pt-6 px-6 shrink-0 flex flex-col items-start gap-1">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-orange-50 rounded-lg">
                                <Trophy className="w-4 h-4 text-orange-500" />
                              </div>
                              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Active Challenge</span>
                            </div>
                            <button
                              onClick={() => setActiveChallenge(null)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                              End
                            </button>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            {activeChallenge.title}
                          </h3>
                          <p className="text-xs font-medium text-gray-400">
                            {activeChallenge.dateRange}
                          </p>
                        </CardHeader>
                        <CardBody className="px-6 pb-6 pt-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                          <div className="space-y-6">
                            {activeChallenge.participants.map((participant: any) => (
                              <div key={participant.id} className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full ${participant.color} shadow-sm`} />
                                    <span className={`text-sm font-medium ${participant.isCurrentUser ? "text-gray-900" : "text-gray-600"}`}>
                                      {participant.name}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-gray-900">{participant.time}</span>
                                    <span className="text-xs text-gray-400">/ {participant.goal}</span>
                                  </div>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
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

                  {/* Focus Sounds Card */}
                  <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl shrink-0">
                    <CardHeader className="pb-2 pt-6 px-6">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-violet-500" />
                        Focus Sounds
                      </h3>
                    </CardHeader>
                    <CardBody className="px-6 pb-6 pt-2">
                      <div className="grid grid-cols-3 gap-3">
                        <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                          <CloudRain className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                          <span className="text-xs font-medium">Rain</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-purple-50 hover:text-purple-600 transition-all group">
                          <Music className="w-6 h-6 text-gray-400 group-hover:text-purple-500" />
                          <span className="text-xs font-medium">Lo-Fi</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-all group">
                          <Coffee className="w-6 h-6 text-gray-400 group-hover:text-orange-500" />
                          <span className="text-xs font-medium">Cafe</span>
                        </button>
                      </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                  {/* Create Room Card */}
                  <button className="group flex flex-col items-center justify-center h-[280px] rounded-3xl border-2 border-dashed border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-white flex items-center justify-center transition-colors shadow-sm">
                      <Plus className="w-8 h-8 text-gray-400 group-hover:text-gray-900" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-gray-900">Create Room</h3>
                      <p className="text-sm text-gray-500 mt-1">Start a new focus session</p>
                    </div>
                  </button>

                  {/* Live Room Cards */}
                  {liveRooms.map((room) => (
                    <Card key={room.id} className="h-[280px] border-none shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-3xl overflow-hidden">
                      <CardBody className="p-0 h-full relative">
                        {/* Background Image/Gradient */}
                        <div className={`absolute inset-0 ${room.image} transition-transform duration-700 group-hover:scale-105`} />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                        {/* Content */}
                        <div className="relative h-full flex flex-col justify-between p-6 text-white">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2">
                              {room.tags.map((tag) => (
                                <span key={tag} className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-medium border border-white/10">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            {room.type === "private" && (
                              <Lock className="w-4 h-4 text-white/70" />
                            )}
                          </div>

                          <div>
                            <h3 className="text-2xl font-bold mb-2">{room.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-white/80">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span>{room.participants}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Video className="w-4 h-4" />
                                <span>Live</span>
                              </div>
                            </div>
                          </div>

                          {/* Hover Overlay Button */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                            <button className="bg-white text-black px-8 py-3 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform">
                              Join Room
                            </button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
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
                <h3 className="text-xl font-bold text-gray-900">Invite Friends</h3>
                <button onClick={() => setShowFriendModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Share Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 truncate">
                      newton.ai/invite/u/hanim
                    </div>
                    <button className="bg-gray-900 text-white px-4 rounded-xl hover:bg-gray-800 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">Or search</span>
                  </div>
                </div>

                <div>
                  <Input
                    placeholder="Search by username..."
                    startContent={<Users className="w-4 h-4 text-gray-400" />}
                    classNames={{
                      inputWrapper: "bg-gray-50 border-none shadow-none",
                    }}
                  />
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
              onClick={() => setShowChallengeModal(false)}
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
                <button onClick={() => setShowChallengeModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
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
                      {friendsStudying.slice(0, 3).map((friend, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                          <div className="flex items-center gap-3">
                            <Avatar name={friend.avatar} size="sm" className="w-8 h-8 text-xs" />
                            <span className="text-sm font-medium text-gray-900">{friend.name}</span>
                          </div>
                          <Checkbox defaultSelected={i === 0} size="sm" color="default" />
                        </div>
                      ))}
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
    </div>
  );
}
