import { useNavigate } from "react-router-dom";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { CirclePlus } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

export default function FloatingCreateButton() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const { theme } = useThemeStore();
  const handleClick = () => {
    navigate("/create-template");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild className="fixed bottom-7 right-7 z-50 ">
          <CirclePlus className="border-2 bg-white dark:bg-black rounded-full border-[#9b0808] dark:border-white " onClick={handleClick} size={64} color={theme === "dark" ? "#fff" : "#9b0808"} strokeWidth={2} />
        </TooltipTrigger>

        <TooltipContent side="left" className="bg-background text-foreground border border-[#9b0808] dark:border-white shadow-md">
          {t("common.Create New Template")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
