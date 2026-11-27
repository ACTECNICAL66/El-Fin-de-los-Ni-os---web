import { useEffect } from "react";
import { useLocation } from "react-router";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import DetectiveErrorBoundary from "@/components/sections/DetectiveErrorBoundary";
import {
  HeroSection,
  ProjectVideoSection,
  AboutSection,
  ProblemSection,
  AreaSection,
  ClimateSection,
  SatelliteSection,
  ResultsSection,
  CTASection,
  DetectiveMode,
  ComparativeMapSection,
  StatisticalRigorSection,
  CaseStudySection,
  ChallengeFitSection,
  Correccion2026Section,
  MonitoringTeaserSection,
  FutureTechSection,
} from "@/components/sections";

export default function Home() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) {
        // Dejar que el navegador resuelva el ancla y luego compensar el header fijo.
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ProjectVideoSection />
      <AboutSection />
      <ProblemSection />
      <AreaSection />
      <ClimateSection />
      <SatelliteSection />
      <ResultsSection />
      <section id="detective" className="section-dark py-16">
        <div className="max-w-7xl mx-auto px-6">
          <DetectiveErrorBoundary>
            <DetectiveMode />
          </DetectiveErrorBoundary>
        </div>
      </section>
      <ComparativeMapSection />
      <StatisticalRigorSection />
      <Correccion2026Section />
      <CaseStudySection />
      <ChallengeFitSection />
      <MonitoringTeaserSection />
      <FutureTechSection />
      <CTASection />
      <Footer />
      <ChatWidget />
    </div>
  );
}
