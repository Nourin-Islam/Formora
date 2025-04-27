import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation("contact");

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{t("contact.title")}</h1>
      <p className="leading-relaxed">{t("contact.description")}</p>
      <p className="mt-4 text-primary font-semibold">{t("contact.email")}</p>
      <p className="mt-2 text-sm">{t("contact.note")}</p>
    </div>
  );
}
