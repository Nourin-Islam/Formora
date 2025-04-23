import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className=" ">
      <h2 className="text-2xl font-bold mb-6 text-center border-red-500">{t("Welcome to Formora!")}</h2>
    </div>
  );
}

// Like below page I want to import useTranslation and add t() to proper places and then give a list of phrases where t() is added
// Find all translatable phrases. (sorted by appearance) Then give translation for English and Russian

// is t() added to all possible places?
