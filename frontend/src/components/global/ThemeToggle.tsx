// components/ThemeToggle.tsx
import { useThemeStore } from "@/store/themeStore";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center justify-end space-x-4">
      <Button className="ml-3" variant="outline" size="icon" onClick={toggleTheme}>
        {/* Show sun in dark mode, moon in light mode */}
        <Sun className="h-5 w-5 rotate-0 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <Moon className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <ToggleGroup type="single" value={currentLang} onValueChange={(val) => val && changeLanguage(val)} className="gap-1">
        <ToggleGroupItem value="en" aria-label="Set language to English">
          EN
        </ToggleGroupItem>
        <ToggleGroupItem value="ru" aria-label="Set language to Russian">
          RU
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
