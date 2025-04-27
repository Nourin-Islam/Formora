import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";

import { useTranslation } from "react-i18next";

function InputSearch() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 700);
  const { t } = useTranslation("common");

  useEffect(() => {
    if (debouncedSearchTerm) {
      navigate(`/search?query=${encodeURIComponent(debouncedSearchTerm)}`);
      setSearchTerm("");
    }
  }, [debouncedSearchTerm, navigate]);

  return (
    <>
      <Search className="absolute left-2 md:left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground   dark:text-gray-500 " />
      <Input placeholder={t("common.header.Search templates...")} className="pl-7 md:pl-10 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-800 w-[120px] sm:w-auto" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
    </>
  );
}

export default InputSearch;
