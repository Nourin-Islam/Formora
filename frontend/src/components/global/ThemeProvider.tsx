// components/ThemeProvider.tsx
import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { updateResolvedTheme } = useThemeStore();

  useEffect(() => {
    // Initial theme resolution
    updateResolvedTheme();

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      updateResolvedTheme();
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [updateResolvedTheme]);

  return <>{children}</>;
}
