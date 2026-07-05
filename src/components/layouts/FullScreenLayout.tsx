import { ReactNode } from "react";

interface FullScreenLayoutProps {
  children: ReactNode;
  /** Use brand gradient background instead of solid color */
  gradient?: boolean;
  /** Background color class (ignored if gradient is true) */
  bgClass?: string;
}

/**
 * Full-screen layout with centered content and bottom CTA area.
 * Used for onboarding screens, celebrations, single-action flows.
 *
 * @example
 * <FullScreenLayout gradient>
 *   <FullScreenLayout.Content>
 *     <h1>Welcome</h1>
 *   </FullScreenLayout.Content>
 *   <FullScreenLayout.Footer>
 *     <PrimaryButton>Get started</PrimaryButton>
 *   </FullScreenLayout.Footer>
 * </FullScreenLayout>
 */
export function FullScreenLayout({
  children,
  gradient = false,
  bgClass = "bg-warm-ivory",
}: FullScreenLayoutProps) {
  const backgroundClass = gradient ? "bg-brand-gradient" : bgClass;

  return (
    <div className={`min-h-dvh flex flex-col ${backgroundClass}`}>
      {children}
    </div>
  );
}

interface ContentProps {
  children: ReactNode;
  /** Center content both horizontally and vertically */
  centered?: boolean;
}

function Content({ children, centered = true }: ContentProps) {
  return (
    <div
      className={`flex-1 p-6 ${
        centered ? "flex items-center justify-center" : ""
      }`}
    >
      <div className="w-full max-w-5xl mx-auto">{children}</div>
    </div>
  );
}

interface FooterProps {
  children: ReactNode;
}

function Footer({ children }: FooterProps) {
  return (
    <div className="sticky bottom-0 p-6 pb-safe bg-white border-t border-gray-100">
      {children}
    </div>
  );
}

// Compound component pattern
FullScreenLayout.Content = Content;
FullScreenLayout.Footer = Footer;
