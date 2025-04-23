// components/AuthProvider.tsx
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "react-i18next";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useUser();
  const setUser = useAuthStore((s) => s.setUser);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (user && isSignedIn) {
      setUser(user);

      const metadata = user.unsafeMetadata || {};
      const savedTheme = metadata.theme as "dark" | "light" | "system" | undefined;
      const savedLang = metadata.language as string | undefined;

      if (savedTheme) setTheme(savedTheme);
      if (savedLang) i18n.changeLanguage(savedLang);
    }
  }, [user, isSignedIn, setUser, setTheme, i18n]);

  return <>{children}</>;
}
