import Link from "next/link";
import Image from "next/image";
import { Highlighter } from "@/components/ui/highlighter";

export function Hero() {

  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-0 text-center md:pt-32 md:pb-0">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Meet Your Intelligent <br className="hidden sm:block" />
          Learning Assistant
        </h1>
        <p className="text-black leading-6 max-w-[750px] mt-7 mx-auto text-center text-balance">
          The AI-powered workspace to help you <Highlighter color="#93C5FD">learn, study, and master</Highlighter> any topic with ease.
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
            <span style={{ fontWeight: 600 }}>Start learning</span>
            <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.15px', lineHeight: '21px', opacity: 0.8 }}>– it&apos;s free</span>
          </Link>
        </div>

        {/* Social Proof */}
        <div className="mt-10 flex flex-col items-center justify-center gap-8">
          <p className="text-sm text-[#747474] text-center font-semibold">
            Loved by 500,000+ students worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20">
            <Image
              src="/universities/Harvard-Emblema-1536x864.png"
              alt="Harvard"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
            />
            <Image
              src="/universities/Princeton_seal.svg"
              alt="Princeton"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
            />
            <Image
              src="/universities/Yale_University_Shield_1.svg.png"
              alt="Yale"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
            />
            <Image
              src="/universities/Cornell_University_seal.svg.png"
              alt="Cornell"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
            />
            <Image
              src="/universities/UniversityofPennsylvania_FullLogo_RGB-4_0.png"
              alt="UPenn"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
            />
            <Image
              src="/universities/pngwing.com.png"
              alt="University"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
