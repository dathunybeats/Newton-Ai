'use client';

import { useState } from 'react';

export default function TestAIPage() {
  const [prompt, setPrompt] = useState('Explain photosynthesis in simple terms');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/test-ai-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        setResult((prev) => prev + text);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">🤖 Vercel AI SDK Test</h1>
          <p className="text-gray-600 mb-6">
            Testing streaming AI responses with OpenAI GPT-4o-mini using AI SDK Core
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your prompt:
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Streaming...
                </span>
              ) : (
                'Generate Response'
              )}
            </button>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">❌ Error:</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <span className="mr-2">✨</span>
                AI Response {isLoading && <span className="ml-2 text-sm text-gray-500">(streaming...)</span>}
              </h3>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {result}
                  {isLoading && <span className="inline-block w-2 h-4 bg-gray-900 animate-pulse ml-1"></span>}
                </p>
              </div>
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
              <p className="text-blue-700">
                👆 Click "Generate Response" to see streaming AI in action!
              </p>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">📊 What's Happening:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>✅ Using AI SDK Core <code className="bg-yellow-100 px-1 rounded">streamText()</code></li>
              <li>✅ Streaming responses from OpenAI GPT-4o-mini</li>
              <li>✅ Real-time character-by-character display (like ChatGPT)</li>
              <li>✅ No React hooks needed - pure fetch API</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
