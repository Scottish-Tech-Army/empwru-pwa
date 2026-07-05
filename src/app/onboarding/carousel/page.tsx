"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FullScreenLayout, PrimaryButton } from "@/components";

interface OnboardingScreen {
  headline: string;
  description: string;
  illustration?: string; // Path to illustration image
}

const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    headline: "Gain Clarity",
    description: "Discover your strengths, values, and what meaningful career growth looks like for you",
    // illustration: "/illustrations/onboarding-1.svg",
  },
  {
    headline: "Create Your Path",
    description: "Set goals that help you progress, change direction, or step into new opportunities",
    // illustration: "/illustrations/onboarding-3.svg",
  },
  {
    headline: "Track Your Growth",
    description: "Turn consistent action into visible progress over time, and celebrate your wins along the way",
    // illustration: "/illustrations/onboarding-2.svg",
  },
  {
    headline: "Find Encouragement",
    description:
      "Chat to Em, empwrU's friendly AI career and life coach, whenever you need guidance on your journey",
     //illustration: "/illustrations/Em-aicoach-2.png",
     illustration: "/illustrations/em-aicoachv1-full.png",
  },
];

/**
 * Onboarding Carousel with Image Support
 * 
 * Three-screen swipeable carousel with dot navigation and illustrations.
 * Route: /onboarding
 * 
 * To add illustrations:
 * 1. Add images to /public/illustrations/
 * 2. Uncomment the illustration paths above
 * 3. Images will automatically replace placeholders
 */
export default function OnboardingCarouselWithImages() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const totalScreens = ONBOARDING_SCREENS.length;
  const isLastScreen = currentScreen === totalScreens - 1;

  // Handle touch/swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;

    const distance = touchStart - touchEnd;
    const minSwipeDistance = 30; // Reduced from 50 for better sensitivity
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
    }

    if (isRightSwipe && currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }

    // Reset touch positions
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleNext = () => {
    if (isLastScreen) {
      router.push("/signUp");
    } else {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleSkip = () => {
    router.push("/signUp");
  };

  const handleDotClick = (index: number) => {
    setCurrentScreen(index);
  };

  const screen = ONBOARDING_SCREENS[currentScreen];

  return (
    <FullScreenLayout bgClass="bg-white">
      <FullScreenLayout.Content>
        <div
          className="relative w-full h-full flex flex-col items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Content with fade transition */}
          <div
            key={currentScreen}
            className="text-center space-y-8 px-6 animate-[fade-in_0.4s_ease-out] w-full"
          >
            {/* Illustration */}
            <div className="flex justify-center mb-8">
              {screen.illustration ? (
                // Real illustration
                <div className="relative w-64 h-64">
                  <Image
                    src={screen.illustration}
                    alt={screen.headline}
                    fill
                    className="object-contain"
                    priority={currentScreen === 0}
                  />
                </div>
              ) : (
                // Placeholder with icon
                <div className="w-48 h-48 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-50 relative">
                  {/* Different icon per screen */}
                  {currentScreen === 0 && (
                    <svg
                      className="w-24 h-24 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  )}
                  {currentScreen === 1 && (
                    <svg
                      className="w-24 h-24 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  )}
                  {currentScreen === 2 && (
                    <svg
                      className="w-24 h-24 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-[var(--color-charcoal)] text-3xl md:text-4xl font-bold leading-tight px-4 max-w-lg mx-auto">
                {screen.headline}
              </h1>
            </div>

            {/* Description */}
            <div>
              <p className="text-gray-600 text-lg md:text-xl px-4 max-w-md mx-auto leading-relaxed">
                {screen.description}
              </p>
            </div>
          </div>

        </div>
      </FullScreenLayout.Content>

      <FullScreenLayout.Footer>
        <div className="flex justify-center items-center gap-2 mb-6">
          {ONBOARDING_SCREENS.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className="transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-magenta)] focus:ring-offset-2 rounded-full p-1"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentScreen ? "true" : "false"}
            >
              <div
                className={`rounded-full transition-all duration-300 ${index === currentScreen
                  ? "w-3 h-3 bg-[var(--color-charcoal)]"
                  : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
              />
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {/* Next/Get Started Button */}
          <PrimaryButton onClick={handleNext}>
            {isLastScreen ? "Let's Go →" : "Next →"}
          </PrimaryButton>

          {/* Skip Button */}
          {!isLastScreen && (
            <button
              onClick={handleSkip}
              className="w-full text-gray-500 hover:text-gray-700 transition-colors duration-150 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-magenta)] focus:ring-offset-2 rounded"
            >
              Skip
            </button>
          )}
        </div>
      </FullScreenLayout.Footer>
    </FullScreenLayout>
  );
}
