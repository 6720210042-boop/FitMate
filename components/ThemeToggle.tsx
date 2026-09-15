"use client";

import { useEffect, useState } from "react";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export default function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !isDark;
    setIsDark(nextDark);

    if (nextDark) {
      root.classList.add("dark");
      localStorage.setItem("fitmate_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("fitmate_theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-zinc-200 dark:border-slate-700 bg-zinc-100 dark:bg-slate-800 animate-pulse ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "สลับเป็นโหมดสว่าง (Switch to Light Mode)" : "สลับเป็นโหมดมืด (Switch to Dark Mode)"}
      aria-label="Toggle theme"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-200 shadow-sm ${
        isDark
          ? "bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-amber-400 hover:text-amber-300 shadow-slate-900/40"
          : "bg-white hover:bg-zinc-100 border-zinc-200/90 text-indigo-600 hover:text-indigo-700 shadow-zinc-200/50"
      } ${className}`}
    >
      {isDark ? (
        // ไอคอนพระอาทิตย์ (สำหรับกดเพื่อเปลี่ยนเป็นสว่าง)
        <svg
          className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // ไอคอนพระจันทร์ (สำหรับกดเพื่อเปลี่ยนเป็นมืด)
        <svg
          className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}

      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? "โหมดสว่าง" : "โหมดมืด"}
        </span>
      )}
    </button>
  );
}
