// stores/themeStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  updateResolvedTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",
      setTheme: (theme) => {
        set({ theme });
        get().updateResolvedTheme();
      },
      updateResolvedTheme: () => {
        const { theme } = get();
        const isDark = theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : theme === "dark";

        const resolvedTheme = isDark ? "dark" : "light";
        set({ resolvedTheme });

        // Update DOM
        document.documentElement.classList.toggle("dark", isDark);
        document.documentElement.classList.toggle("light", !isDark);
      },
    }),
    {
      name: "theme-storage",
      // Only store the theme preference, not the resolved theme
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
