import { Fraunces, Inter, Outfit } from "next/font/google";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

import "./globals.css";
import { I18nProvider } from "@/i18n";
import AuroraBackground from "@/components/AuroraBackground";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata = {
  title: "AURA | Personal Mental Health Companion",
  description: "A premium, AI-powered companion for your mental health journey. Experience calm, clarity, and growth.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${inter.variable} ${outfit.variable}`}>
        <ThemeProvider>
          <AuroraBackground />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <I18nProvider>
              {children}
            </I18nProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
