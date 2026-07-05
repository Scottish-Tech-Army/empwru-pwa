import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

/**
 * Montserrat - Regular weight only
 * 
 * Critical rule: Use Regular weight exclusively. Bold, semi-bold, and other
 * weights are not part of the U visual identity. This restraint is intentional—
 * it creates a softer, more inclusive tone and ensures visual consistency.
 */
const montserrat = Montserrat({
  weight: "400", // Regular only - no bold/semi-bold per brand guidelines
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "empwrU",
  description: "Step into your potential",
  // Private preview - no indexing
  robots: "noindex, nofollow",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased bg-gray-100`}>
        {/* Max-width container for responsive layout */}
        <div className="max-w-6xl mx-auto bg-brand-surface min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  );
}
