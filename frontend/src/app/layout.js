import "./globals.css";
import { I18nProvider } from "@/i18n";
import AuroraBackground from "@/components/AuroraBackground";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import LegalLinks from '@/components/LegalLinks';

export const metadata = {
  title: "AURA | Awareness Understanding & Recovery Assistant",
  description: "A digital wellbeing companion for reflection, breathing practices and personal progress.",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuroraBackground />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <I18nProvider>
              <AuthProvider>
                {children}
                <LegalLinks />
              </AuthProvider>
            </I18nProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
