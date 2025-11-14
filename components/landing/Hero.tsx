import Link from "next/link";
import { Highlighter } from "@/components/ui/highlighter";

export function Hero() {

  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-0 text-center md:pt-40 md:pb-0">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Meet Your Intelligent <br className="hidden sm:block" />
          Learning Assistant
        </h1>
        <p className="text-black leading-6 max-w-[750px] mt-7 mx-auto text-center text-balance">
          The AI-powered workspace to help you <Highlighter color="#7DFF97">learn, study, and master</Highlighter> any topic with ease.
        </p>

        {/* CTA Button */}
        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-flex order border-white/12  items-center gap-3 rounded-xl bg-black px-8 py-4  text-white  transition-all hover:bg-black-500"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '15px',
              fontWeight: 400,
              letterSpacing: '-0.15px',
              lineHeight: '21px'
            }}
          >
            <span>Start learning</span>
            <span style={{ fontSize: '15px', fontWeight: 400, letterSpacing: '-0.15px', lineHeight: '21px', opacity: 0.8 }}>– it&apos;s free</span>
          </Link>
        </div>

        {/* Social Proof */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <p className="text-sm text-[#747474] text-center font-semibold">
            Loved by 500,000+ students worldwide
          </p>
        </div>
      </div>
    </section>
  );
}
