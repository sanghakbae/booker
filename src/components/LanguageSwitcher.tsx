"use client";

import { useState } from "react";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("footer.language")}
        className="flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 hover:bg-surface"
      >
        <GlobeIcon />
        {LOCALE_NAMES[locale]}
      </button>

      {open && (
        <>
          <button
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <ul className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-md border border-border bg-background shadow-lg">
            {LOCALES.map((option) => (
              <li key={option}>
                <button
                  onClick={() => {
                    setLocale(option);
                    setOpen(false);
                  }}
                  lang={option}
                  className={`block w-full px-3 py-2.5 text-left text-sm hover:bg-surface ${
                    locale === option ? "text-accent" : ""
                  }`}
                >
                  {LOCALE_NAMES[option]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </svg>
  );
}
