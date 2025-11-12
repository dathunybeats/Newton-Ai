"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Separate effect for redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push("/home");
    }
  }, [countdown, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          Payment Successful!
        </h1>

        {/* Message */}
        <p className="mb-6 text-gray-600">
          Thank you for upgrading to Newton AI Premium. Your account has been activated and you now have access to all premium features.
        </p>

        {/* Features List */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            You now have access to:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Unlimited note generations
            </li>
            <li className="flex items-center">
              <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Unlimited quiz & flashcards
            </li>
            <li className="flex items-center">
              <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Priority support
            </li>
          </ul>
        </div>

        {/* Redirect Notice */}
        <p className="mb-4 text-sm text-gray-500">
          Redirecting you to your dashboard in{" "}
          <span className="font-semibold text-gray-700">{countdown}</span>{" "}
          {countdown === 1 ? "second" : "seconds"}...
        </p>

        {/* Button */}
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
