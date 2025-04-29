import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

function ErrorReload(error: any) {
  console.log("Error in fetching: ", error);
  const { t } = useTranslation("common");
  return (
    <div className="text-red-500 min-h-[calc(100vh-400px)] flex items-center justify-center flex-col gap-4">
      <p>{t("common.tError.Error_loading_request")}</p>

      {/* {error?.error && <p>{ error.error}</p>} */}
      <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
        {t("common.tags.Retry")}
      </Button>
    </div>
  );
}

export default ErrorReload;
