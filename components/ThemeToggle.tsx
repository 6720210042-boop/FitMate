"use client";

import { useEffect, useState, useCallback } from "react";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export default function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);

  const syncThemeState = useCallback(() => {
    if (typeof document === "undefined") return;
    const hasDarkClass = document.documentElement.classList.contains("dark");
    setIsDark(hasDarkClass);
  }, []);

  useEffect(() => {
    queueMicrotask(() => syncThemeState());

    // เฝ้าตรวจการเปลี่ยนแปลง class บน <html> แบบ Real-time
    const root = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          syncThemeState();
        }
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    // รองรับ custom event ที่ส่งมาจาก global theme handler
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isDark === "boolean") {
        setIsDark(customEvent.detail.isDark);
      } else {
        syncThemeState();
      }
    };

    window.addEventListener("fitmate-theme-change", handleThemeChange);

    // รองรับการซิงค์ข้ามแท็บเบราว์เซอร์
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "fitmate_theme") {
        if (e.newValue === "dark") {
          root.classList.add("dark");
          root.style.colorScheme = "dark";
        } else {
          root.classList.remove("dark");
          root.style.colorScheme = "light";
        }
        syncThemeState();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("fitmate-theme-change", handleThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncThemeState]);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const win = typeof window !== "undefined" ? (window as unknown as { __toggleFitMateTheme?: () => boolean }) : null;
    if (win && typeof win.__toggleFitMateTheme === "function") {
      const nextDark = win.__toggleFitMateTheme();
      setIsDark(nextDark);
    } else if (typeof document !== "undefined") {
      const root = document.documentElement;
      const nextDark = !root.classList.contains("dark");
      if (nextDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
        try { localStorage.setItem("fitmate_theme", "dark"); } catch {}
      } else {
        root.classList.remove("dark");
        root.style.colorScheme = "light";
        try { localStorage.setItem("fitmate_theme", "light"); } catch {}
      }
      setIsDark(nextDark);
    }
  };

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      title={isDark ? "สลับเป็นโหมดสว่าง (Light Mode)" : "สลับเป็นโหมดมืด (Dark Mode)"}
      aria-label="Toggle theme"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-sm ${
        isDark
          ? "bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-amber-400 hover:text-amber-300 shadow-slate-950/40"
          : "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900 shadow-zinc-200/50"
      } ${className}`}
    >
      {isDark ? (
        // ไอคอนพระอาทิตย์ (กดเพื่อเปลี่ยนเป็นสว่าง)
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
        // ไอคอนพระจันทร์ (กดเพื่อเปลี่ยนเป็นมืด)
        <svg
          className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0 text-indigo-600"
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
