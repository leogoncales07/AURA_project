import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "AURA - Cuida da tua saúde mental",
  description: "A premium companion for your mental health journey.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body className={`${outfit.variable}`}>
        {children}
      </body>
    </html>
  );
}
