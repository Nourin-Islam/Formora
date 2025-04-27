import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// Import existing translation files

import enAbout from "@/locales/en/about.json";
import enContact from "@/locales/en/contact.json";
import enPrivacy from "@/locales/en/privacy.json";

// Import Russian translation files

import ruAbout from "@/locales/ru/about.json";
import ruContact from "@/locales/ru/contact.json";
import ruPrivacy from "@/locales/ru/privacy.json";

// Import the common translation files (you provided)
import enCommon from "@/locales/en/common.json";
import ruCommon from "@/locales/ru/common.json";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        about: enAbout,
        contact: enContact,
        privacy: enPrivacy,

        common: enCommon, // Added the common translations
      },
      ru: {
        about: ruAbout,
        contact: ruContact,
        privacy: ruPrivacy,

        common: ruCommon, // Added the common translations
      },
    },
    lng: "en", // Set the default language to English
    fallbackLng: "en", // Fallback language if the selected language's key is not found
    interpolation: {
      escapeValue: false, // React already escapes values, so we don't need to escape them again
    },
  });

export default i18n;
