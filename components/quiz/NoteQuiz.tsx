"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Shuffle, CheckCircle2, XCircle, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  answerId: string;
  explanation?: string;
};

type NoteQuizProps = {
  topic?: string | null;
  questions?: QuizQuestion[];
};

type QuizPanelProps = {
  topic?: string | null;
  initialQuestions: QuizQuestion[];
};

const buildFallbackQuestions = (topic?: string | null): QuizQuestion[] => {
  const safeTopic = topic?.trim() || "this topic";

  return [
    {
      id: "hosts",
      prompt: `Who are the primary voices guiding learners through ${safeTopic}?`,
      options: [
        { id: "a", label: "Bobby Lee and Andrew Schulz" },
        { id: "b", label: "Rudy Jules and Bobby Lee" },
        { id: "c", label: "Andrew Schulz and Rudy Jules" },
        { id: "d", label: "A surprise guest every week" },
      ],
      answerId: "a",
      explanation:
        "The Bad Friends podcast is led by comedians Bobby Lee and Andrew Schulz, setting the tone for our sample quiz.",
    },
    {
      id: "format",
      prompt: `What format best fits how ${safeTopic} is presented in the note?`,
      options: [
        { id: "a", label: "A scripted audiobook" },
        { id: "b", label: "Conversational highlights and commentary" },
        { id: "c", label: "A hands-on laboratory manual" },
        { id: "d", label: "A collection of citations" },
      ],
      answerId: "b",
      explanation:
        "Notes for shows, podcasts, or lectures are usually condensed into conversational highlights with key takeaways.",
    },
    {
      id: "takeaway",
      prompt: `What is the most actionable way to review ${safeTopic}?`,
      options: [
        { id: "a", label: "Skim the transcript once" },
        { id: "b", label: "Turn every section into a flashcard" },
        { id: "c", label: "Quiz yourself on hosts, themes, and story beats" },
        { id: "d", label: "Ignore the material until exam day" },
      ],
      answerId: "c",
      explanation:
        "Retrieval practice—quizzing yourself on who, what, and why—helps move information from short-term to long-term memory.",
    },
  ];
};

const shuffleArray = <T,>(items: T[]): T[] => {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const getProgressPercentage = (answered: number, total: number) => {
  if (!total) return 0;
  return (answered / total) * 100;
};

const NoteQuiz = ({ topic, questions }: NoteQuizProps) => {
  const preparedQuestions = useMemo(
    () => (questions?.length ? questions : buildFallbackQuestions(topic)),
    [questions, topic],
  );

  const quizInstanceKey = useMemo(() => {
    const fingerprint = preparedQuestions.map((question) => question.id).join("-");
    return `${topic ?? "topic"}-${fingerprint}-${preparedQuestions.length}`;
  }, [preparedQuestions, topic]);

  return (
    <QuizPanel
      key={quizInstanceKey}
      topic={topic}
      initialQuestions={preparedQuestions}
    />
  );
};

const QuizPanel = ({ topic, initialQuestions }: QuizPanelProps) => {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);

  const currentQuestion = quizQuestions[currentIndex];
  const totalQuestions = quizQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const selectedOption = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isAnswerCorrect =
    currentQuestion && selectedOption ? selectedOption === currentQuestion.answerId : false;

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleResetQuiz = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
    setQuizQuestions(initialQuestions);
  };

  const handleShuffleQuestions = () => {
    setQuizQuestions((prev) => shuffleArray(prev.length ? prev : initialQuestions));
    setAnswers({});
    setCurrentIndex(0);
    setShowSummary(false);
  };

  if (!currentQuestion && !showSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>No quiz content available.</p>
      </div>
    );
  }

  if (showSummary) {
    const correctCount = Object.entries(answers).reduce((acc, [qId, ansId]) => {
      const q = quizQuestions.find((q) => q.id === qId);
      return q && q.answerId === ansId ? acc + 1 : acc;
    }, 0);

    return (
      <div className="flex flex-col w-full h-full max-w-2xl mx-auto justify-center items-center py-4 sm:py-2 lg:py-0 lg:h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-card border border-border rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-8"
        >
          <div className="space-y-2">
            <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-zinc-900 dark:text-zinc-100" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Quiz Complete!</h3>
            <p className="text-muted-foreground text-lg">
              You scored <span className="text-foreground font-semibold">{correctCount}</span> out of <span className="text-foreground font-semibold">{totalQuestions}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-xs mx-auto">
            <Button
              onClick={handleResetQuiz}
              className="w-full h-12 rounded-xl bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={handleShuffleQuestions}
              variant="outline"
              className="w-full h-12 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all font-medium"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-auto lg:h-full max-w-3xl mx-auto justify-center py-4 sm:py-2 lg:py-0">
      {/* Header & Progress */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8 lg:mb-10 shrink-0">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            Question {currentIndex + 1} <span className="text-zinc-300 dark:text-zinc-700">/</span> {totalQuestions}
          </span>

          <div className="flex items-center gap-1">
            <Button
              onClick={handleResetQuiz}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              title="Reset Quiz"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleShuffleQuestions}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
              title="Shuffle Questions"
            >
              <Shuffle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <motion.div
            className="h-full bg-zinc-900 dark:bg-zinc-50 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
          </motion.div>
        </div>
      </div>

      {/* Question & Options */}
      <div className="flex-col lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col h-full"
          >
            {/* Question */}
            <div className="flex items-center justify-center mb-6 lg:mb-10 lg:flex-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-center text-foreground leading-relaxed tracking-tight">
                {currentQuestion.prompt}
              </h2>
            </div>

            {/* Options */}
            <div className="grid gap-3 sm:gap-4 w-full max-w-2xl mx-auto">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOption === option.id;
                const isCorrect = currentQuestion.answerId === option.id;
                const showCorrect = isSelected && isCorrect;
                const showIncorrect = isSelected && !isCorrect;
                const showMissed = !isSelected && selectedOption && isCorrect;

                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    disabled={!!selectedOption}
                    whileHover={!selectedOption ? { scale: 1.01 } : {}}
                    whileTap={!selectedOption ? { scale: 0.99 } : {}}
                    className={cn(
                      "relative w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 group",
                      !selectedOption && "bg-card border-border hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-secondary/50",
                      showCorrect && "bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600",
                      showIncorrect && "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-200",
                      showMissed && "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
                      !isSelected && selectedOption && !showMissed && "opacity-40 grayscale"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors font-medium text-sm",
                      !selectedOption && "border-zinc-300 text-zinc-500 group-hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400",
                      showCorrect && "border-white text-green-600 bg-white",
                      showIncorrect && "border-red-200 text-red-500 bg-red-100 dark:border-red-800 dark:bg-red-900/50",
                      showMissed && "border-green-300 text-green-600 dark:border-green-700 dark:text-green-400"
                    )}>
                      {showCorrect ? <Check className="w-4 h-4" /> :
                        showIncorrect ? <X className="w-4 h-4" /> :
                          option.id.toUpperCase()}
                    </div>

                    <span className="text-base sm:text-lg font-medium leading-snug">{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer / Next Button */}
      <div className="mt-8 lg:mt-10 h-16 flex items-center justify-center shrink-0">
        <AnimatePresence>
          {selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button
                onClick={handleNextQuestion}
                className="h-12 sm:h-14 px-8 rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg hover:shadow-xl transition-all text-base sm:text-lg font-medium"
              >
                {currentIndex === totalQuestions - 1 ? "Finish Quiz" : "Next Question"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NoteQuiz;
