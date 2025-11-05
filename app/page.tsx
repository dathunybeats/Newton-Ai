import Link from "next/link";
import { Navbar } from "@/components/shared/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-16 text-center md:pt-40 md:pb-24">
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
          An Al tutor made for you
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600 md:text-xl">
          Transform any content into beautiful notes, flashcards, quizzes, and podcasts. Master any topic with evidence-based learning techniques.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-full bg-gray-900 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-gray-800"
          >
            Start Learning - It&apos;s Free
          </Link>
          <Link
            href="#demo"
            className="rounded-full border border-gray-300 px-8 py-3.5 text-base font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            See How It Works
          </Link>
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          Loved By My Friends And Classmates
          </p>
      </section>

      {/* Product Preview */}
      <section className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="h-full w-full rounded-lg bg-white shadow-sm">
              {/* Placeholder for product screenshot */}
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gray-100"></div>
                  <p className="text-sm">Product screenshot coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Universities */}
      <section className="border-t border-gray-100 bg-gray-50 py-12 md:py-16">
        <p className="mb-8 text-center text-sm font-medium text-gray-500">
          Trusted by top students all over the world
        </p>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-6 md:gap-12">
          {/* University logos placeholder */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex h-12 w-20 items-center justify-center rounded-full bg-white"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="demo" className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            How It Works - It&apos;s Simple
          </h2>
          <p className="mt-4 text-base text-gray-600 md:text-lg">
            Transform any content into study materials in four simple steps
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
              1
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Upload Your Content
            </h3>
            <p className="text-sm text-gray-600">
              Record lectures live or upload PDFs, YouTube videos, audio files, and documents. Works with any format.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
              2
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              AI Processes Everything
            </h3>
            <p className="text-sm text-gray-600">
              Our AI transcribes and analyzes your content in seconds, identifying key concepts and creating structured notes.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
              3
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Get Study Materials
            </h3>
            <p className="text-sm text-gray-600">
              Receive comprehensive notes, flashcards, quizzes, and podcasts tailored to your learning needs instantly.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
              4
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Study & Ace Your Exams
            </h3>
            <p className="text-sm text-gray-600">
              Access materials anywhere, share with classmates, and use built-in study modes to succeed.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Everything you need to learn smarter
            </h2>
            <p className="mt-4 text-base text-gray-600 md:text-lg">
              From PDFs to podcasts, we&apos;ve got your entire study workflow covered
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Beautiful Notes
              </h3>
              <p className="text-sm text-gray-600">
                Transform PDFs, videos, and audio into editable, structured notes with smart highlighting and formatting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Instant Flashcards
              </h3>
              <p className="text-sm text-gray-600">
                Turn hours of study into minutes with AI-generated flashcards using spaced repetition algorithms.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Smart Quizzes
              </h3>
              <p className="text-sm text-gray-600">
                Practice with AI-generated quizzes and get detailed explanations for every wrong answer to learn faster.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                24/7 AI Tutor
              </h3>
              <p className="text-sm text-gray-600">
                Chat with an AI tutor anytime to simplify complex topics and get unstuck at 2am before your exam.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                AI Podcasts
              </h3>
              <p className="text-sm text-gray-600">
                Turn any notes into engaging audio lessons. Perfect for learning during commutes or workouts.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Track Your Progress
              </h3>
              <p className="text-sm text-gray-600">
                Monitor your growth, identify weak spots, and master subjects faster with detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Testimonials Section */}
      <section className="border-t border-gray-100 bg-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Loved by students everywhere
            </h2>
            <p className="mt-4 text-base text-gray-600 md:text-lg">
              See what students from top universities are saying about Newton AI
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-sm text-gray-700">
                &quot;My professor lectures at a very fast pace, and I had a hard time keeping up. But Newton made it easy for me to take notes on the lecture.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Mark Chen</p>
                  <p className="text-xs text-gray-500">Mathematics Major at Stanford</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-sm text-gray-700">
                &quot;Having ADHD makes focusing in organic chem lectures tough, so I record every class. Then it quizzes me on reactions until I actually get them—went from a C+ to an A- this quarter.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                  S
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Sarah Kim</p>
                  <p className="text-xs text-gray-500">Chemistry Major at Stanford</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-sm text-gray-700">
                &quot;My bio textbook is 500 pages, but Newton makes podcasts of each chapter so I can listen during my long commutes or workouts. Game changer!&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-600">
                  O
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Olivia Carter</p>
                  <p className="text-xs text-gray-500">Pre-med at Harvard</p>
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-sm text-gray-700">
                &quot;I fell asleep during class because I had to work part-time, but luckily Newton helped me take notes on everything. Thank you for your amazing app!&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
                  P
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Peter Johnson</p>
                  <p className="text-xs text-gray-500">Computer Science Major at MIT</p>
                </div>
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-sm text-gray-700">
                &quot;Case law used to overwhelm me, but Newton instantly turns my readings into flashcards and quizzes. Now I can actually keep up daily instead of cramming all night.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-600">
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Marcus Oliver</p>
                  <p className="text-xs text-gray-500">Law Student at Yale</p>
                </div>
              </div>
            </div>

            {/* Testimonial 6 */}
            <div className="rounded-2xl bg-gray-50 p-6">
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="mb-4 text-sm text-gray-700">
                &quot;I use Newton to learn concepts ranging from Econ to Quantum Mechanics. The YouTube video summarizer makes learning so much easier and more effective.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                  M
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Mihir Wadekar</p>
                  <p className="text-xs text-gray-500">Product Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-base text-gray-600">
              Everything you need to know about Newton AI
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {/* FAQ 1 */}
            <details className="group rounded-2xl bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                <span>What is Newton AI?</span>
                <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">
                Newton AI is an AI-powered learning platform that transforms any content—PDFs, videos, audio files, and more—into beautiful notes, flashcards, quizzes, and podcasts. It uses evidence-based learning techniques to help you learn faster and remember longer.
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="group rounded-2xl bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                <span>How does Newton AI work?</span>
                <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">
                Simply upload or record your learning materials. Our AI transcribes, analyzes, and processes the content to identify key concepts. Within seconds, you&apos;ll receive comprehensive study materials including notes, flashcards, quizzes, and even podcasts tailored to your needs.
              </p>
            </details>

            {/* FAQ 3 */}
            <details className="group rounded-2xl bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                <span>Is Newton AI free?</span>
                <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">
                Yes! Newton AI offers a generous free tier so you can experience the power of AI-enhanced learning. We also offer premium plans with advanced features, unlimited processing, and priority support for students who want to get the most out of their studies.
              </p>
            </details>

            {/* FAQ 4 */}
            <details className="group rounded-2xl bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                <span>What formats does Newton AI support?</span>
                <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">
                Newton AI supports virtually any learning format: PDFs, Word documents, PowerPoint slides, YouTube videos, audio recordings, live lecture recordings, and more. We also support 100+ languages for transcription and translation.
              </p>
            </details>

            {/* FAQ 5 */}
            <details className="group rounded-2xl bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                <span>Can I use Newton AI on mobile?</span>
                <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">
                Absolutely! Newton AI works seamlessly on the web and mobile devices. Your study materials automatically sync across all your devices, so you can study anywhere, anytime. iOS and Android apps are available for download.
              </p>
            </details>

            {/* FAQ 6 */}
            <details className="group rounded-2xl bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                <span>Is this legal at my school?</span>
                <svg className="h-5 w-5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-sm text-gray-600">
                Newton AI is a study tool designed to enhance your learning, not replace it. It&apos;s similar to taking notes or using flashcards. However, academic integrity policies vary by institution, so we recommend checking with your school&apos;s guidelines. Newton AI should be used as a learning aid, not for academic dishonesty.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-100 bg-white py-16 text-center md:py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
          Ready to transform your learning?
        </h2>
        <p className="mt-4 text-base text-gray-600 md:text-lg">
          Join 500,000+ students who are learning smarter with Newton AI
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-full bg-gray-900 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-gray-800"
        >
          Start Learning - It&apos;s Free
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          No credit card required • Free forever plan available
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500">© Copyright 2025. Newton AI Inc.</p>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/blog" className="hover:text-gray-900">Blog</Link>
              <Link href="/help" className="hover:text-gray-900">Help & Earn</Link>
              <Link href="/careers" className="hover:text-gray-900">Careers</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-gray-900">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
