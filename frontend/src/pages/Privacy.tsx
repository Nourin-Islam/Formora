import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation("privacy");

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{t("privacy.title")}</h1>
      <p className="leading-relaxed">{t("privacy.intro")}</p>

      <h2 className="text-xl font-semibold mt-8 mb-4">{t("privacy.informationTitle")}</h2>
      <p className="leading-relaxed">{t("privacy.informationDescription")}</p>

      <h2 className="text-xl font-semibold mt-8 mb-4">{t("privacy.usageTitle")}</h2>
      <p className="leading-relaxed">{t("privacy.usageDescription")}</p>

      <h2 className="text-xl font-semibold mt-8 mb-4">{t("privacy.contactTitle")}</h2>
      <p className="leading-relaxed">
        {t("privacy.contactDescription")}
        <span className="text-primary font-semibold ml-1">{t("privacy.contactEmail")}</span>.
      </p>
    </div>
  );
}
