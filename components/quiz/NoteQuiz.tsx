"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

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

  const progressPercentage = getProgressPercentage(
    Math.min(answeredCount, totalQuestions),
    totalQuestions,
  );

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
      <div className="text-center py-12">
        <p className="text-gray-600">No quiz content available yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden gap-4">
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex justify-between items-center gap-4">
          <p className="text-sm font-bold text-muted-foreground">
            Quiz for
          </p>
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetQuiz}
            disabled={!answeredCount && currentIndex === 0}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg
              className="size-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M22 12c0 5.52-4.48 10-10 10s-8.89-5.56-8.89-5.56m0 0h4.52m-4.52 0v5M2 12C2 6.48 6.44 2 12 2c6.67 0 10 5.56 10 5.56m0 0v-5m0 5h-4.44"
              ></path>
            </svg>
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleShuffleQuestions}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-shuffle size-4 mr-2"
            >
              <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"></path>
              <path d="m18 2 4 4-4 4"></path>
              <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"></path>
              <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"></path>
              <path d="m18 14 4 4-4 4"></path>
            </svg>
            <span>Shuffle questions</span>
          </button>
        </div>
        </div>
        <h2 className="text-2xl font-bold">{topic || "Your note"}</h2>
      </div>

      <div className="flex-shrink-0">
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          role="progressbar"
          data-state="active"
          className="relative overflow-hidden rounded-full bg-secondary w-full h-2"
        >
          <div
            className="h-full transition-all bg-purple-500 dark:bg-purple-400"
            style={{
              width: `${progressPercentage}%`,
            }}
          ></div>
        </div>
      </div>

      {showSummary ? (
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm p-6 space-y-4 flex-1 flex flex-col justify-center">
          <h3 className="text-xl font-semibold">Great job!</h3>
          <p className="text-muted-foreground">
            You answered {answeredCount} out of {totalQuestions} questions. Shuffle or reset the quiz
            to keep practicing.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleResetQuiz}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 cursor-pointer"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleShuffleQuestions}
              className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              Shuffle &amp; retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm flex-1 flex flex-col min-h-0">
            <div className="flex flex-col space-y-1.5 p-6 flex-shrink-0">
              <p className="text-sm font-semibold text-muted-foreground">
                Question {currentIndex + 1}
              </p>
              <h3 className="font-semibold tracking-tight text-lg">{currentQuestion?.prompt}</h3>
            </div>
            <div className="p-6 pt-0 flex flex-col gap-2">
              {currentQuestion?.options.map((option) => {
                const isSelected = selectedOption === option.id;
                const isCorrectAnswer = currentQuestion.answerId === option.id;
                const showCorrectState = isSelected && isCorrectAnswer;
                const showIncorrectState = isSelected && !isCorrectAnswer;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleOptionSelect(option.id)}
                    className={cn(
                      "items-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary hover:bg-muted text-foreground min-h-11 rounded-md w-full flex justify-between gap-3 px-5 py-2.5 border border-transparent text-left",
                      showCorrectState && "border-green-500 dark:border-green-400",
                      showIncorrectState && "border-red-500 dark:border-red-400",
                      !isSelected &&
                        selectedOption &&
                        isCorrectAnswer &&
                        "border-green-500 dark:border-green-400",
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    {showCorrectState && (
                      <svg
                        className="size-5 text-green-500 dark:text-green-400 flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2Zm4.78 7.7-5.67 5.67a.75.75 0 0 1-1.06 0l-2.83-2.83a.754.754 0 0 1 0-1.06c.29-.29.77-.29 1.06 0l2.3 2.3 5.14-5.14c.29-.29.77-.29 1.06 0 .29.29.29.76 0 1.06Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                    {showIncorrectState && (
                      <svg
                        className="size-5 text-red-500 dark:text-red-400 flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2Zm3.36 12.3c.29.29.29.77 0 1.06-.15.15-.34.22-.53.22s-.38-.07-.53-.22L12 13.06l-2.3 2.3c-.15.15-.34.22-.53.22s-.38-.07-.53-.22a.754.754 0 0 1 0-1.06L10.94 12l-2.3-2.3a.754.754 0 0 1 0-1.06c.29-.29.77-.29 1.06 0l2.3 2.3 2.3-2.3c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06L13.06 12l2.3 2.3Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                    {!isSelected && selectedOption && isCorrectAnswer && (
                      <svg
                        className="size-5 text-green-500 dark:text-green-400 flex-shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2Zm4.78 7.7-5.67 5.67a.75.75 0 0 1-1.06 0l-2.83-2.83a.754.754 0 0 1 0-1.06c.29-.29.77-.29 1.06 0l2.3 2.3 5.14-5.14c.29-.29.77-.29 1.06 0 .29.29.29.76 0 1.06Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center flex-shrink-0">
            <div className="py-2 text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </div>
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={!selectedOption}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {currentIndex === totalQuestions - 1 ? "Finish quiz" : "Next question"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NoteQuiz;
