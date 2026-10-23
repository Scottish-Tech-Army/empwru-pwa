import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/password-rules";

/**
 * Checklist of the password rules, ticked off live as the person types.
 * Shown under a "create a password" field.
 */
export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1 text-sm" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-2 ${met ? "text-[#1e9e6d]" : "text-text-subtle"}`}>
            {met ? <Check className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
            {rule.label}
            <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
