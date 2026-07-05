import { LucideIcon, Lightbulb } from "lucide-react";

interface TipBoxProps {
  children: React.ReactNode;
  icon?: LucideIcon;
}

/**
 * TipBox - A subtle explainer/coaching component with transparent magenta background
 * 
 * Used for helpful tips, explanations, and coaching messages throughout the app.
 */
export function TipBox({ children, icon: Icon = Lightbulb }: TipBoxProps) {
  return (
    <div className="bg-[var(--color-magenta)]/5 rounded-xl p-5 flex items-start gap-3">
      <Icon className="w-5 h-5 text-[var(--color-magenta)] flex-shrink-0 mt-0.5" />
      <p className="text-sm text-[var(--color-charcoal)]">{children}</p>
    </div>
  );
}
