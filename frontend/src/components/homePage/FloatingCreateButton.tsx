import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export default function FloatingCreateButton() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const handleClick = () => {
    navigate("/create-template");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-7 right-7 z-50">
            <Button onClick={handleClick} className="relative flex items-center justify-center h-16 w-16 rounded-full bg-white text-amber-600 shadow-xl hover:shadow-2xl hover:scale-110 hover:ring-4 hover:ring-amber-400/50 transition-all dark:bg-neutral-800 dark:text-amber-400 border-4 border-amber-500" aria-label="Create Template" size="icon">
              <span className="text-5xl font-bold leading-none -mt-3">+</span>
            </Button>
          </div>
        </TooltipTrigger>

        <TooltipContent side="left" className="bg-background text-foreground border border-amber-500 shadow-md">
          {t("common.Create New Template")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
