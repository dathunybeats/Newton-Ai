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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudyRoomPage() {
  const [isStudying, setIsStudying] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedNote, setSelectedNote] = useState("Linear Algebra");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);

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

  const leaderboard = [
    { rank: 1, name: "You", time: "12h 34m", isCurrentUser: true },
    { rank: 2, name: "Sarah", time: "11h 23m", isCurrentUser: false },
    { rank: 3, name: "Mike", time: "9h 12m", isCurrentUser: false },
    { rank: 4, name: "Alex", time: "7h 45m", isCurrentUser: false },
    { rank: 5, name: "Emma", time: "6h 18m", isCurrentUser: false },
    { rank: 6, name: "John", time: "5h 30m", isCurrentUser: false },
    { rank: 7, name: "David", time: "4h 15m", isCurrentUser: false },
  ];

  return (
    <div className="h-[100dvh] bg-white p-4 lg:p-6 text-black flex flex-col overflow-hidden">
      <div className="w-full h-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Header */}
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
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="text-sm font-medium text-gray-700">7 Day Streak</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto lg:overflow-visible">

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
                          <path fill="currentColor" d="M10.138 3.382C8.304 2.31 6 3.632 6 5.756v16.489c0 2.123 2.304 3.445 4.138 2.374l14.697-8.59c1.552-.907 1.552-3.15 0-4.057l-14.697-8.59Z"/>
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
                <Chip size="sm" variant="flat" className="bg-green-50 text-green-700 h-6 text-xs">
                  {friendsStudying.length} active
                </Chip>
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

          {/* Column 3: Leaderboard - 3/12 */}
          <div className="lg:col-span-3 h-full">
            <Card className="shadow-[0_4px_10px_rgba(0,0,0,0.02)] border border-gray-200 bg-white rounded-3xl h-full flex flex-col">
              <CardHeader className="pb-2 pt-6 px-6 shrink-0">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Leaderboard
                </h3>
              </CardHeader>
              <CardBody className="px-6 pb-6 pt-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${entry.isCurrentUser
                        ? "bg-gray-900 text-white shadow-md transform scale-[1.02]"
                        : "hover:bg-gray-50 text-gray-900"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${entry.isCurrentUser
                            ? "bg-gray-700 text-white"
                            : entry.rank <= 3
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                            }`}
                        >
                          {entry.rank}
                        </div>
                        <p className={`font-medium text-sm ${entry.isCurrentUser ? "text-white" : "text-gray-900"}`}>
                          {entry.name}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${entry.isCurrentUser ? "text-gray-300" : "text-gray-500"}`}>
                        {entry.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-full text-blue-600 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-900">Keep it up!</p>
                        <p className="text-[10px] text-blue-700 mt-1 leading-relaxed">
                          Top 10% this week. 2h to next rank.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
