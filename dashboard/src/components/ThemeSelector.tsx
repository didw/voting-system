"use client";

import { useState } from "react";

type Theme = "dark" | "light";

const THEME_KEY = "voting-system-theme";

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document !== "undefined") {
      const documentTheme = document.documentElement.dataset.theme ?? null;
      if (isTheme(documentTheme)) return documentTheme;
    }
    if (typeof window === "undefined") return "dark";
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    return isTheme(savedTheme) ? savedTheme : "dark";
  });

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <label
        htmlFor="theme-select"
        className="text-sm text-[var(--foreground)]/70"
      >
        테마
      </label>
      <select
        id="theme-select"
        suppressHydrationWarning
        value={theme}
        onChange={(e) => changeTheme(e.target.value as Theme)}
        className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]"
      >
        <option value="dark">다크</option>
        <option value="light">밝은</option>
      </select>
    </div>
  );
}
