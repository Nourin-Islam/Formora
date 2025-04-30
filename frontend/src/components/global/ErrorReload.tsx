import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

function ErrorReload(error: any) {
  // console.log("Error in fetching: ", error);
  const { t } = useTranslation("common");
  return (
    <div className="text-red-500 min-h-[calc(100vh-400px)] flex items-center justify-center flex-col gap-4">
      <p>{t("common.tError.Error_loading_request")}</p>

      {/* {error?.message && <p>{error?.message}</p>} */}
      <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
        {t("common.tags.Retry")}
      </Button>
    </div>
  );
}

export default ErrorReload;

/*
Error in fetching:  
{error: Error: ["templates","326","preview"] data is undefined
    at Object.onSuccess (http://localhost:51…}
error
: 
Error: ["templates","326","preview"] data is undefined at Object.onSuccess (http://localhost:5173/node_modules/.vite/deps/@tanstack_react-query.js?v=355d493f:898:19) at resolve (http://localhost:5173/node_modules/.vite/deps/@tanstack_react-query.js?v=355d493f:456:57)
[[Prototype]]
: 
Object

*/
