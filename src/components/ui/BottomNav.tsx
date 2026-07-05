"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { Home, Target, BarChart3, Lightbulb, RotateCcw, Sparkles } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: <Home className="w-6 h-6" />,
  },
  {
    href: "/discovery",
    label: "Discovery",
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: <Target className="w-6 h-6" />,
  },
  {
    href: "/progress",
    label: "Progress",
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    href: "/aicoach",
    label: "Coach",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    href: "/reset",
    label: "Reset",
    icon: <RotateCcw className="w-6 h-6" />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? "text-brand-primary"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
