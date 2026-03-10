import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "AURA | Personal Mental Health Companion",
  description: "A premium, AI-powered companion for your mental health journey. Experience calm, clarity, and growth.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`}>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
