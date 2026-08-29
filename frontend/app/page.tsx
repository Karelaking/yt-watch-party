import * as React from "react";
import dynamic from "next/dynamic";
import { GlassNav } from "@/components/ds/glass-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { ScrollReveal } from "@/components/ds/scroll-reveal";

// Dynamically import below-the-fold sections for instant initial page paint
const IntegrationOrbit = dynamic(
  () => import("@/components/landing/integration-orbit").then((m) => m.IntegrationOrbit),
  { ssr: true }
);

const InteractiveDemo = dynamic(
  () => import("@/components/landing/interactive-demo").then((m) => m.InteractiveDemo),
  { ssr: true }
);

const FeaturesGrid = dynamic(
  () => import("@/components/landing/features-grid").then((m) => m.FeaturesGrid),
  { ssr: true }
);

const HowItWorks = dynamic(
  () => import("@/components/landing/how-it-works").then((m) => m.HowItWorks),
  { ssr: true }
);

const StatsCounters = dynamic(
  () => import("@/components/landing/stats-counters").then((m) => m.StatsCounters),
  { ssr: true }
);

const Testimonials = dynamic(
  () => import("@/components/landing/testimonials").then((m) => m.Testimonials),
  { ssr: true }
);

const FaqAccordion = dynamic(
  () => import("@/components/landing/faq-accordion").then((m) => m.FaqAccordion),
  { ssr: true }
);

const FinalCta = dynamic(
  () => import("@/components/landing/final-cta").then((m) => m.FinalCta),
  { ssr: true }
);

const Footer = dynamic(
  () => import("@/components/landing/footer").then((m) => m.Footer),
  { ssr: true }
);

export default function Home(): React.JSX.Element {
  return (
    <div className="flex flex-col min-h-screen selection:bg-zinc-900 selection:text-white">
      {/* Top Floating Glass Capsule Navigation */}
      <GlassNav />

      {/* Hero Section - Above the fold, rendered with priority */}
      <HeroSection />

      {/* Integration / Orbit Section */}
      <IntegrationOrbit />

      {/* Interactive Room Builder Demo */}
      <section
        id="demo-screen"
        className="py-16 sm:py-24 px-4 max-w-6xl mx-auto w-full"
      >
        <ScrollReveal direction="up">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Experience Real-Time Sync in Action
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto mt-2 text-sm sm:text-xl">
              Test creating a real synchronized room right from the landing
              page.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <InteractiveDemo />
        </ScrollReveal>
      </section>

      {/* Features Bento Grid */}
      <FeaturesGrid />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Stats Metrics Counters */}
      <StatsCounters />

      {/* Testimonials / Social Reviews */}
      <Testimonials />

      {/* FAQ Accordion */}
      <FaqAccordion />

      {/* High-Impact Final CTA */}
      <FinalCta />

      {/* Minimal Footer */}
      <Footer />
    </div>
  );
}

