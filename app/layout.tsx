import type { Metadata } from "next";
import { Prompt, Geist_Mono } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitMate - วางแผนการออกกำลังกายและโภชนาการอย่างยั่งยืน",
  description: "ระบบวางแผนการออกกำลังกาย คำนวณ TDEE/BMR และจับเวลาพักเซ็ตสำหรับผู้รักสุขภาพ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${promptFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-200">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('fitmate_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved === 'dark' || (!saved && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch(e) {}

                // Global theme toggle function (Single Source of Truth)
                window.__toggleFitMateTheme = function() {
                  var root = document.documentElement;
                  var willBeDark = !root.classList.contains('dark');
                  if (willBeDark) {
                    root.classList.add('dark');
                    root.style.colorScheme = 'dark';
                    try { localStorage.setItem('fitmate_theme', 'dark'); } catch(err) {}
                  } else {
                    root.classList.remove('dark');
                    root.style.colorScheme = 'light';
                    try { localStorage.setItem('fitmate_theme', 'light'); } catch(err) {}
                  }
                  window.dispatchEvent(new CustomEvent('fitmate-theme-change', { detail: { isDark: willBeDark } }));
                  return willBeDark;
                };
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
