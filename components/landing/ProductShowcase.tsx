import Image from "next/image";

export function ProductShowcase() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-[1040px] px-6">
        <div
          className="relative rounded-2xl border-2 border-gray-300 bg-white p-4"
          style={{
            willChange: 'transform',
            opacity: 1,
            transform: 'none',
            maskImage: 'linear-gradient(to bottom, rgb(0, 0, 0) 70%, rgba(0, 0, 0, 0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgb(0, 0, 0) 70%, rgba(0, 0, 0, 0) 100%)'
          }}
        >
          <div className="relative overflow-hidden rounded-xl">
            <div className="relative w-full" style={{ paddingBottom: '56.6%' }}>
              <Image
                src="/screenshot.png"
                alt="Newton AI App Interface"
                fill
                sizes="min(100vw, 1040px)"
                className="object-cover object-center"
                style={{
                  borderRadius: 'inherit'
                }}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
