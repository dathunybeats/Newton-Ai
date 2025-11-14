import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { MoreFeatures } from "@/components/landing/MoreFeatures";
import { ImportWorkflow } from "@/components/landing/ImportWorkflow";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-white"
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '15px',
        fontWeight: 400,
        letterSpacing: '-0.15px',
        lineHeight: '1.5'
      }}
    >
      <Navbar />
      <Hero />
      <ProductShowcase />
      <Features />
      <MoreFeatures />
      <ImportWorkflow />
      <Footer />
    </div>
  );
}
