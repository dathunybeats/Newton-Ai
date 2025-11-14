export function Features() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Learn, study, and ace exams
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 - Create */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-lg hover:border-gray-300">
            <div className="mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Create</h3>
            <p className="text-gray-600 leading-relaxed">
              Transform any content into beautiful notes, flashcards, and quizzes. Upload PDFs, videos, or record lectures live.
            </p>
          </div>

          {/* Feature 2 - Learn */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-lg hover:border-gray-300">
            <div className="mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Learn</h3>
            <p className="text-gray-600 leading-relaxed">
              Study with AI-powered flashcards, quizzes, and podcasts. Get explanations for any concept, anytime.
            </p>
          </div>

          {/* Feature 3 - Master */}
          <div className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-lg hover:border-gray-300">
            <div className="mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Master</h3>
            <p className="text-gray-600 leading-relaxed">
              Track your progress, identify weak spots, and ace your exams with spaced repetition and adaptive learning.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
