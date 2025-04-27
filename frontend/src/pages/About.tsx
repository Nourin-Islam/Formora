import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation("about");

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{t("about.title")}</h1>

      <p className=" leading-relaxed mb-6">{t("about.intro")}</p>

      <h2 className="text-2xl font-semibold mb-4 mt-10">{t("about.missionTitle")}</h2>
      <p className=" leading-relaxed mb-6">{t("about.missionDescription")}</p>

      <h2 className="text-2xl font-semibold mb-4 mt-10">{t("about.whyTitle")}</h2>
      <ul className="  pl-5  leading-relaxed space-y-2">
        <li>{t("about.fastCreation")}</li>
        <li>{t("about.customDesigns")}</li>
        <li>{t("about.realtimeData")}</li>
        <li>{t("about.multilingualMobile")}</li>
        <li>{t("about.privacyFocused")}</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4 mt-10">{t("about.whoWeServeTitle")}</h2>
      <p className=" leading-relaxed mb-6">{t("about.whoWeServeDescription")}</p>

      <h2 className="text-2xl font-semibold mb-4 mt-10">{t("about.futureTitle")}</h2>
      <p className=" leading-relaxed mb-6">{t("about.futureDescription")}</p>

      <p className=" leading-relaxed mt-10 font-semibold">{t("about.thankYou")}</p>
    </div>
  );
}
