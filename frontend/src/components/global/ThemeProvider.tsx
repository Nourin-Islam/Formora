import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import { useTranslation } from "react-i18next";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { updateResolvedTheme, language } = useThemeStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    updateResolvedTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => updateResolvedTheme();

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [updateResolvedTheme]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return <>{children}</>;
}
