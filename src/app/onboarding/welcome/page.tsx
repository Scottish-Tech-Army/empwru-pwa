"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FullScreenLayout, PrimaryButton, WizardHeader } from "@/components";
import { SECTIONS } from "../baseline/page";
import { Sparkles } from "lucide-react";

/**
 * Onboarding Screen 1: Welcome & Value Proposition
 *
 * Purpose: First impression - communicate core value in 5 seconds.
 * Route: /onboarding/welcome
 */
export default function WelcomePage() {
  const router = useRouter();

  const handleOnboardingWelcomeNext = () => {
    // Will navigate to baseline quiz in Chunk 3
    router.push("/onboarding/baseline");
  };



  return (
    <FullScreenLayout bgClass="bg-bg-card">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white sticky top-0 z-30">
          <WizardHeader title="About U" />
        </div>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-24 pt-8 sm:pt-12 min-h-[70vh] flex flex-col justify-start md:justify-center">

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4 max-w-xl mx-auto">
            <div className="flex gap-2 flex-1">
              {SECTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-500  ${idx <= 0 ? "bg-brand-primary" : "bg-gray-100"}`}
                />
              ))}
            </div>
          </div>

          {/* Section title centered */}
          {/* Section title */}
          <div className="text-center mt-16 sm:mt-20 md:mt-0">





            <h1 className="flex flex-wrap justify-center items-center text-3xl sm:text-4xl md:text-5xl font-semibold">

              {/* Static gradient Welcome */}
              <span className="bg-brand-gradient bg-clip-text text-transparent font-semibold mr-2 sm:mr-4 md:mr-6">
                Welcome
              </span>

              {/* Animated Name + Sparkle */}
              <span className="flex items-center gap-1 sm:gap-3 md:gap-4">
                <span
                  className="
        bg-brand-gradient
        bg-clip-text
        text-transparent
        animate-gradient-text
        font-bold
        text-[1.08em] sm:text-[1.1em] md:text-[1.15em]
      "
                >
                  Nicola
                </span>

                {/* Sparkle */}
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary shrink-0 animate-sparkle" />
              </span>

            </h1>


          </div>

          {/* Section content */}
          <div className="mt-8 sm:mt-10 max-w-xl mx-auto px-2 sm:px-4 text-center">
            <p className="text-base sm:text-lg md:text-xl font-medium text-[var(--color-charcoal)] leading-relaxed space-y-4">
              Let’s start where you are.
            </p>

            <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
              This quick check-in helps you capture where you are right now.
              It creates a starting point so you can look back later and see just how far you’ve
              come.
            </p>

            <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-600">
              It takes just a couple of minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Contextual Action Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50">
        <div className="flex justify-between items-center h-16 max-w-5xl mx-auto w-full px-6">
          {/* Back */}
          <button
            disabled={true}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors text-gray-300 cursor-not-allowed`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span className="text-xs mt-1">Back</span>
          </button>

          {/* Cancel */}
          <button
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-brand-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            <span className="text-xs mt-1">Cancel</span>
          </button>

          {/* Next/Continue */}
          <button
            onClick={handleOnboardingWelcomeNext}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors text-brand-primary`}
          >  <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-xs mt-1">Next</span>
            </>
          </button>
        </div>
      </nav>
    </FullScreenLayout >
  );
}
