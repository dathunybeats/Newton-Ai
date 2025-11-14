"use client";

import { motion } from "motion/react";
import Image from "next/image";

export function ImportWorkflow() {
  const testimonials = [
    {
      quote: "I love this tool, like the YouTube video summarizer! I use it to learn concepts ranging from Econ to Quantum Mechanics, and it makes learning so much easier and more effective.",
      name: "Mihir Wadekar",
      title: "Product Engineer, Web3",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop"
    },
    {
      quote: "I definitely plan to experiment with YouLearn in my online course this summer to offer students an additional method of engagement with more complex topics.",
      name: "G. Shaw Jr.",
      title: "Assistant Professor, UNC",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop"
    },
    {
      quote: "I wish I had this when I was in school",
      name: "Nasim Uddin",
      title: "Indiehacker, Independent",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop"
    },
    {
      quote: "Youlearn.ai is awesome , just used it to learn from a biotech roundtable discussion!",
      name: "Rohan Robinson",
      title: "Software Engineer, Independent",
      avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop"
    },
    {
      quote: "This YouLearn site, with features like \"Chat with PDF,\" has become an integral part of our daily workflow. It's streamlined our process of understanding videos and PDFs.",
      name: "Jason Patel",
      title: "Writer",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop"
    },
    {
      quote: "I use YouLearn on a daily basis now. It's streamlined my processes and improved how I learn materials.",
      name: "Kate Doe",
      title: "Content Manager",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
    }
  ];

  return (
    <section className="py-12 bg-white overflow-hidden mb-20">
      <div className="relative">
        {/* Mask gradient for fade effect */}
        <div className="relative overflow-hidden" style={{
          maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%)',
          WebkitMaskImage: 'linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%)'
        }}>
          <motion.div
            className="flex gap-2.5 py-2.5"
            animate={{
              x: [0, -50 * testimonials.length + "%"]
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 55,
                ease: "linear"
              }
            }}
          >
            {/* Duplicate testimonials for infinite scroll */}
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[480px] h-[254px]"
              >
                <div className="h-full w-full rounded-2xl border border-gray-100 bg-white p-6 flex flex-col">
                  <p className="text-center text-gray-900 text-sm mb-4 flex-grow flex items-center justify-center">
                    {testimonial.quote}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="w-[54px] h-[54px] rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={54}
                        height={54}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{testimonial.name}</p>
                      <p className="text-xs text-gray-400">{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
