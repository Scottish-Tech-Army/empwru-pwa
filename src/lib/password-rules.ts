/**
 * Password rules shown and checked before an account is created. They must
 * match the Supabase project's settings (Authentication → Sign In /
 * Providers → Email → Minimum password length and Password requirements),
 * which are what's actually enforced — these only let people see the rules
 * up front instead of finding out from an error.
 */

// The symbols Supabase's "lowercase, uppercase, digits and symbols"
// requirement accepts.
const SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export const MIN_PASSWORD_LENGTH = 8;

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (p) => p.length >= MIN_PASSWORD_LENGTH },
  { label: "A lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "An uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "A number (0–9)", test: (p) => /[0-9]/.test(p) },
  { label: "A symbol, such as ! @ # $ % & * ?", test: (p) => [...p].some((c) => SYMBOLS.includes(c)) },
];

export function meetsPasswordRules(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
