"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  getResolvedTheme,
  getStoredTheme,
  setTheme,
  type Theme,
} from "@/system/theme/theme";

type ThemeToggleProps = {
  collapsed?: boolean;
  className?: string;
};

function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

function themeLabel(theme: Theme): string {
  return theme === "dark" ? "Light mode" : "Dark mode";
}

function themeToggleClassName(className: string | undefined, collapsed: boolean): string {
  return ["button", "is-small", collapsed ? "" : "is-fullwidth", className].filter(Boolean).join(" ");
}

function themeToggleLabel(theme: Theme, collapsed: boolean): string {
  if (!collapsed) {
    return themeLabel(theme);
  }

  return theme === "dark" ? "☀" : "☾";
}

export function ThemeToggle({ collapsed = false, className }: ThemeToggleProps) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    const resolved = getResolvedTheme();
    setThemeState(resolved);
    if (stored) {
      applyTheme(stored);
    }
  }, []);

  function toggleTheme() {
    const updated = nextTheme(theme);
    setTheme(updated);
    setThemeState(updated);
  }

  return (
    <button
      type="button"
      className={themeToggleClassName(className, collapsed)}
      onClick={toggleTheme}
      aria-label={themeLabel(theme)}
      title={themeLabel(theme)}
    >
      {themeToggleLabel(theme, collapsed)}
    </button>
  );
}
