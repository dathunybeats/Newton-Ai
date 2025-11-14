export function Testimonials() {
  const testimonials = [
    {
      quote: "Newton AI helped me go from struggling in organic chemistry to getting an A. The AI-generated quizzes are a game changer!",
      name: "Sarah Kim",
      title: "Chemistry Major at Stanford",
      initials: "SK",
      gradient: "from-blue-400 to-blue-600"
    },
    {
      quote: "The podcast feature is incredible. I can listen to my lecture notes while commuting. Newton AI saves me hours every week!",
      name: "Marcus Chen",
      title: "Computer Science at MIT",
      initials: "MC",
      gradient: "from-green-400 to-green-600"
    },
    {
      quote: "As a pre-med student, I have to memorize thousands of facts. The flashcard system with spaced repetition is perfect for me.",
      name: "Olivia Carter",
      title: "Pre-med at Harvard",
      initials: "OC",
      gradient: "from-purple-400 to-purple-600"
    }
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Join over 500,000 empowered students
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what students from top universities are saying about Newton AI
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="rounded-xl bg-gray-50 p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white text-sm font-semibold`}>
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
