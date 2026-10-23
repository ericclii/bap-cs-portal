import type { Metadata, Viewport } from "next";
import { Cinzel, Hanken_Grotesk } from "next/font/google";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
// Only the stamps use it, so only the weight they need.
const cinzel = Cinzel({ subsets: ["latin"], weight: "700", variable: "--font-cinzel", display: "swap" });

export const metadata: Metadata = {
  title: { default: "BAP Community Service", template: "%s · BAP Community Service" },
  description: "Sign up for Beta Alpha Psi community service events at NYU, check in on site, and track your CS points.",
  appleWebApp: { capable: true, title: "BAP Service", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fdfcf8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${hanken.variable} ${cinzel.variable}`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
