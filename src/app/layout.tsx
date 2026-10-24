import type { Metadata, Viewport } from "next";
import { Lato, Raleway } from "next/font/google";
import { Analytics } from "@/components/analytics";
import "./globals.css";

// Lato carries body text; it ships no 500/600, so medium renders regular and semibold renders bold.
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato", display: "swap" });
// Raleway (variable) carries titles, headings, the points figure, the wordmark and stamps.
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap" });

export const metadata: Metadata = {
  title: { default: "BAP Community Service", template: "%s · BAP Community Service" },
  description: "Sign up for Beta Alpha Psi community service events at NYU, check in on site, and track your CS points.",
  appleWebApp: { capable: true, title: "BAP Service", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${lato.variable} ${raleway.variable}`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
