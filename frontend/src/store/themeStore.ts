import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
type Language = "en" | "ru";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  language: Language;
  setTheme: (theme: Theme) => void;
  updateResolvedTheme: () => void;
  setLanguage: (lang: Language) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",
      language: "en",
      setTheme: (theme) => {
        set({ theme });
        get().updateResolvedTheme();
      },
      updateResolvedTheme: () => {
        const { theme } = get();
        const isDark = theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches : theme === "dark";

        document.documentElement.classList.toggle("dark", isDark);
        document.documentElement.classList.toggle("light", !isDark);

        set({ resolvedTheme: isDark ? "dark" : "light" });
      },
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
