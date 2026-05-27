import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { ar } from "./locales/ar";
import { en } from "./locales/en";

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

// Get saved language from localStorage or default to Arabic
const savedLanguage = localStorage.getItem("language") || "ar";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

// Function to change language and update document direction
export const changeLanguage = (lang: "ar" | "en") => {
  i18n.changeLanguage(lang);
  localStorage.setItem("language", lang);

  // Update document direction
  const html = document.documentElement;
  if (lang === "en") {
    html.setAttribute("dir", "ltr");
    html.classList.add("ltr");
    html.classList.remove("rtl");
  } else {
    html.setAttribute("dir", "rtl");
    html.classList.add("rtl");
    html.classList.remove("ltr");
  }
};

// Initialize direction based on saved language
const initDirection = () => {
  const lang = i18n.language || savedLanguage;
  const html = document.documentElement;
  if (lang === "en") {
    html.setAttribute("dir", "ltr");
    html.classList.add("ltr");
    html.classList.remove("rtl");
  } else {
    html.setAttribute("dir", "rtl");
    html.classList.add("rtl");
    html.classList.remove("ltr");
  }
};

// Call on init
initDirection();

export default i18n;
