import { useState, useEffect, useCallback } from "react";

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string; // ISO date string
  createdAt: string;
}

const TASKS_KEY = "newton_tasks";
const LAST_CLEANUP_KEY = "newton_tasks_last_cleanup";

// Load tasks from localStorage
const loadTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load tasks:", e);
    return [];
  }
};

// Save tasks to localStorage
const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks:", e);
  }
};

// Remove completed tasks from previous days
const cleanupCompletedTasks = (tasks: Task[]): Task[] => {
  const today = new Date().toISOString().split('T')[0];

  return tasks.filter(task => {
    // Keep uncompleted tasks
    if (!task.completed) return true;

    // Keep tasks completed today
    if (task.completedAt) {
      const completedDate = task.completedAt.split('T')[0];
      return completedDate === today;
    }

    // Remove tasks completed without a date (shouldn't happen but safe)
    return false;
  });
};

// Check if cleanup is needed
const shouldRunCleanup = (): boolean => {
  try {
    const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
    const today = new Date().toISOString().split('T')[0];

    // Run cleanup if never run or last run was a different day
    return !lastCleanup || lastCleanup !== today;
  } catch (e) {
    return true;
  }
};

// Mark cleanup as done for today
const markCleanupDone = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LAST_CLEANUP_KEY, today);
  } catch (e) {
    console.error("Failed to mark cleanup done:", e);
  }
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks on mount and run daily cleanup
  useEffect(() => {
    let loadedTasks = loadTasks();

    // Run cleanup if needed (once per day)
    if (shouldRunCleanup()) {
      loadedTasks = cleanupCompletedTasks(loadedTasks);
      saveTasks(loadedTasks);
      markCleanupDone();
    }

    setTasks(loadedTasks);
  }, []);

  // Add a new task
  const addTask = useCallback((text: string) => {
    if (!text.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  }, [tasks]);

  // Toggle task completion
  const toggleTask = useCallback((id: number) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  }, [tasks]);

  // Delete a task
  const deleteTask = useCallback((id: number) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  }, [tasks]);

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
  };
}
