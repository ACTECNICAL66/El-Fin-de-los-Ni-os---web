import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import DetectiveErrorBoundary from "@/components/sections/DetectiveErrorBoundary";
import {
  HeroSection,
  AboutSection,
  AreaSection,
  ClimateSection,
  SatelliteSection,
  ResultsSection,
  CTASection,
  ProblemSection,
  DetectiveMode,
} from "@/components/sections";

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <ProblemSection />
      <AreaSection />
      <ClimateSection />
      <SatelliteSection />
      <ResultsSection />
      <DetectiveErrorBoundary>
        <DetectiveMode />
      </DetectiveErrorBoundary>
      <CTASection />
      <Footer />
      <ChatWidget />
    </div>
  );
}
