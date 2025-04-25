import { useThemeStore } from "@/store/themeStore";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useUser } from "@clerk/clerk-react";

export function ThemeToggle() {
  const { user } = useUser();
  const { resolvedTheme, setTheme, language, setLanguage } = useThemeStore();
  const { i18n } = useTranslation();

  const toggleTheme = async () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    // updateMetadata({ theme: newTheme });
    if (!user) return;
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        theme: newTheme,
      },
    });
  };

  const changeLanguage = async (lang: string) => {
    if (lang !== language) {
      setLanguage(lang as any);
      i18n.changeLanguage(lang);
      if (!user) return;
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          language: lang,
        },
      });
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Button className="ml-2 md:ml0" variant="outline" size="icon" onClick={toggleTheme}>
        <Sun className="h-5 w-5 hidden dark:inline" />
        <Moon className="h-5 w-5 inline dark:hidden" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <ToggleGroup type="single" value={language} onValueChange={changeLanguage}>
        <ToggleGroupItem value="en">EN</ToggleGroupItem>
        <ToggleGroupItem value="ru">RU</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
