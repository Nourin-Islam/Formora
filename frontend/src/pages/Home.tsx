import { useTranslation } from "react-i18next";

import LatestTemplatesSection from "@/components/homePage/LatestTemplates";
import TrendingTemplatesSection from "@/components/homePage/TrendingTemplates";
import TagCloudSection from "@/components/homePage/TagCloud";
import TopicsChart from "@/components/homePage/TopicsChart";

export default function Home() {
  const { t } = useTranslation("common");

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">{t("common.home.welcome")}</h2>
      <h3 className="text-xl text-center mb-2">{t("common.home.subtitle")}</h3>
      <p className="text-center mb-8">{t("common.home.description")}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-stretch">
        <div className="col-start-1 col-end-4 lg:col-end-3">
          <LatestTemplatesSection />
        </div>

        <div className="col-start-1 col-end-4 lg:col-start-3 lg:col-end-4">
          <TagCloudSection />
          <TopicsChart />
        </div>
      </div>

      <TrendingTemplatesSection />
    </div>
  );
}

// Like below page I want to import useTranslation and add t() to proper places and then give a list of phrases where t() is added
// Find all translatable phrases. (sorted by appearance) Then give translation for English and Russian

// add t()   to all possible places and provide english and russian translations for all phrases
