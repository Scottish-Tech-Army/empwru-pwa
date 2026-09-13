'use client'

// Google OAuth isn't wired up yet — this is an inert placeholder (like the
// Facebook button next to it) until real Supabase OAuth is implemented.
// It must NOT navigate into onboarding without an actual session, or the
// app guard bounces straight back out to /welcome.
export function LoginButton({ type }: { type: "signup" | "signin" }) {
  return (<button
    onClick={() => {}}
    className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-md py-3 px-4 text-sm font-medium hover:bg-gray-100 transition"
  >
    <img
      src="/google.svg"
      alt="Google"
      className="w-5 h-5"
      loading="lazy"
    />
    {type === "signup" ? "Sign up with Google" : "Sign in with Google"}
  </button>)
}
