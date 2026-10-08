import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#0a0a0f]">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}