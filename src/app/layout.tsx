import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ThemeProvider, themeInitScript } from "@/lib/theme/ThemeContext";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DietGreen — meal plans built around your body and your diet",
  description:
    "Generate a personalized meal plan for your dietary profile (vegetarian, omnivore, and more) and physical goal, based on real nutritional data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      lang="pt-BR"
      className={`${fraunces.variable} ${workSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink font-body">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
