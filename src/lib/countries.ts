import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import thLocale from "i18n-iso-countries/langs/th.json";

countries.registerLocale(enLocale);
countries.registerLocale(thLocale);

export type CountryOption = {
  code: string;
  nameTh: string;
  nameEn: string;
};

export function getCountryOptions(): CountryOption[] {
  const namesTh = countries.getNames("th");
  return Object.entries(namesTh)
    .map(([code, nameTh]) => ({
      code,
      nameTh,
      nameEn: countries.getName(code, "en") ?? nameTh,
    }))
    .sort((a, b) => a.nameTh.localeCompare(b.nameTh, "th"));
}

export function getCountryByCode(code?: string | null): CountryOption | null {
  if (!code) return null;
  const nameTh = countries.getName(code, "th");
  const nameEn = countries.getName(code, "en");
  if (!nameTh && !nameEn) return null;
  return { code: code.toUpperCase(), nameTh: nameTh ?? nameEn!, nameEn: nameEn ?? nameTh! };
}

// แปลงรหัส ISO 3166-1 alpha-2 เป็นอิโมจิธงชาติ (regional indicator symbols)
export function getFlagEmoji(code?: string | null): string | null {
  if (!code || code.length !== 2) return null;
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return String.fromCodePoint(...[...upper].map((c) => 127397 + c.charCodeAt(0)));
}
