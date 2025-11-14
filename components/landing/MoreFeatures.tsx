import Image from "next/image";

export function MoreFeatures() {
  const learningContent = [
    {
      title: "Deep Dive into LLMs like ChatGPT",
      description: "A general audience deep dive into the Large Language Model (LLM).",
      imageUrl: "/andrej.jpg"
    },
    {
      title: "Harvard CS50 (2023) – Full Computer Science University Course",
      description: "Learn the basics of computer science from Harvard University.",
      imageUrl: "/cs50.jpg"
    },
    {
      title: "Controlling Your Dopamine For Motivation, Focus & Satisfaction",
      description: "Learn how to harness dopamine to improve your motivation and focus.",
      imageUrl: "/andrew.jpg"
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Title Content */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl mb-6">
            Built for any use case
          </h2>
          <p className="text-lg text-gray-500">
            Click on a learning content below, and start your learning journey ⤵
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {learningContent.map((content, index) => (
            <div key={index} className="flex flex-col">
              {/* Image Wrapper */}
              <div className="rounded-3xl border border-gray-200 bg-gray-50 overflow-hidden mb-6 aspect-video relative">
                <Image
                  src={content.imageUrl}
                  alt={content.title}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {content.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-500">
                {content.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
