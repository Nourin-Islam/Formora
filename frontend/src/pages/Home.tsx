import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className=" ">
      <h2 className="text-2xl font-bold mb-6 text-center border-red-500">{t("Welcome to Formora!")}</h2>
    </div>
  );
}
