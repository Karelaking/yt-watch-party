import * as React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GlassNav } from "@/components/ds/glass-nav";
import { ScrollReveal } from "@/components/ds/scroll-reveal";
import {
  HeroSection,
  IntegrationOrbit,
  InteractiveDemo,
  FeaturesGrid,
  HowItWorks,
  StatsCounters,
  Testimonials,
  FaqAccordion,
  FinalCta,
  Footer,
} from "@/components/landing";

export default async function Home(): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen selection:bg-zinc-900 selection:text-white">
      {/* Top Floating Glass Capsule Navigation */}
      <GlassNav />

      {/* Hero Section */}
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
