const THEME_KEY = "crm-theme";

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  // Default to dark (existing look)
  return "dark";
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function toggleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function initTheme() {
  setTheme(getTheme());
}
