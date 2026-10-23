"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, UserPlus, Users, CalendarCheck, FolderKanban } from "lucide-react";

interface FacilitatorSidebarProps {
  email: string;
}

const NAV_ITEMS: {
  label: string;
  href?: string;
  icon: typeof LayoutDashboard;
}[] = [
  { label: "Overview", href: "/facilitator", icon: LayoutDashboard },
  { label: "Invite participant", href: "/facilitator/invite", icon: UserPlus },
  { label: "Alumni roster", icon: Users },
  { label: "Check-ins", icon: CalendarCheck },
  { label: "Cohorts", icon: FolderKanban },
];

/**
 * The mockup's always-visible desktop sidebar doesn't fit a single real
 * page yet (Alumni roster/Check-ins/Cohorts aren't separate routes) — this
 * renders it as an on-demand drawer instead, with only "Overview" and
 * "Invite participant" wired to real links. The rest are visibly inert
 * rather than pretending to work.
 */
export default function FacilitatorSidebar({ email }: FacilitatorSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-warm-ivory hover:text-deep-violet"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <nav className="flex w-64 flex-col gap-1 bg-gradient-to-br from-[var(--color-deep-violet)] to-[var(--color-magenta)] p-4 shadow-md animate-in slide-in-from-left duration-200">
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-sm text-white">empwrU</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {NAV_ITEMS.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white ${
                    pathname === item.href ? "bg-white/15" : "hover:bg-white/10"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/40"
                  title="Coming soon"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-white/30">
                    Soon
                  </span>
                </div>
              )
            )}

            <div className="mt-auto truncate border-t border-white/15 pt-3 text-xs text-white/60">
              {email}
            </div>
          </nav>

          <button
            type="button"
            aria-label="Close menu"
            className="flex-1 bg-black/30"
            onClick={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}
