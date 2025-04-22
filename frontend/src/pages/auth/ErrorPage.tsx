import { useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (error instanceof Error) {
    // Handle specific error types if needed
    console.error("Error:", error.message);
  }

  return (
    <div className="container flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">{t("Oops!")}</h1>
      <p className="text-lg">{t("Sorry, an unexpected error has occurred.")}</p>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("Refresh Page")}
        </Button>
        {/* Go to home page */}
        <Button onClick={() => (window.location.href = "/")} variant="outline">
          {t("Go to Home")}
        </Button>
      </div>
    </div>
  );
}
