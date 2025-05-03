import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className="bg-gray-100 dark:bg-black dark:border-t-2 py-8 mt-10">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">Formora</h2>
        <p className="max-w-md mx-auto mb-6 text-sm">{t("common.footer.description")}</p>

        <div className="flex justify-center flex-wrap space-x-6 space-y-4 text-sm mb-6">
          <Link to="/feature-check-list" className="hover:underline">
            {t("common.footer.Features List")}
          </Link>
          <Link to="/about" className="hover:underline">
            {t("common.footer.about")}
          </Link>
          <Link to="/" className="hover:underline">
            {t("common.footer.templates")}
          </Link>
          <Link to="/contact" className="hover:underline">
            {t("common.footer.contact")}
          </Link>
          <Link to="/privacy" className="hover:underline">
            {t("common.footer.privacy")}
          </Link>
        </div>

        <p className="text-xs opacity-70">
          © {new Date().getFullYear()} {t("common.footer.rights")}
        </p>
      </div>
    </footer>
  );
}
