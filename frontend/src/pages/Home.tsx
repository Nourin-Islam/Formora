import { useTranslation } from "react-i18next";

import LatestTemplatesSection from "@/components/homePage/LatestTemplates";
import PopularTemplatesSection from "@/components/homePage/PopularTemplates";
import TagCloudSection from "@/components/homePage/TagCloud";
import TopicsChart from "@/components/homePage/TopicsChart";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className=" ">
      <h2 className="text-2xl font-bold mb-4 text-center border-red-500">{t("Welcome to Formora!")}</h2>
      <h3 className="text-xl text-center  mb-2 ">{t("Create, Explore, and Share Templates Effortlessly!")}</h3>
      <p className="text-center mb-8 ">{t("Our platform lets you build customizable forms, quizzes, and surveys in minutes. Discover trending templates, search by tags, explore topics, and stay updated with the latest creations — all in one intuitive, multilingual experience.")}</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="col-start-1 col-end-4 lg:col-end-3">
          <LatestTemplatesSection />
        </div>

        <div className="col-start-1 col-end-4 lg:col-start-3 lg:col-end-4">
          <TagCloudSection />
          <TopicsChart />
        </div>
      </div>

      <PopularTemplatesSection />
    </div>
  );
}

// Like below page I want to import useTranslation and add t() to proper places and then give a list of phrases where t() is added
// Find all translatable phrases. (sorted by appearance) Then give translation for English and Russian

// is t() added to all possible places?
