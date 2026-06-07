import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  HeroSection,
  AboutSection,
  AreaSection,
  ClimateSection,
  SatelliteSection,
  ResultsSection,
  DownloadsSection,
  CTASection,
  ProblemSection,
  DocumentationSection,
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
      <DownloadsSection />
      <CTASection />
      <DocumentationSection />
      <Footer />
    </div>
  );
}
