const DEFAULT_STATUS_BAR_COLORS = {
  light: { background: '#02aff0', style: 'DARK' },
  dark: { background: '#08141a', style: 'LIGHT' },
};

let translations = {};
let statusBarAdapter;
let statusBarColors = DEFAULT_STATUS_BAR_COLORS;

const hasDocument = () => typeof document !== 'undefined';
const hasWindow = () => typeof window !== 'undefined';
const storage = () => (typeof localStorage !== 'undefined' ? localStorage : undefined);

/** Configures integrations that belong to the consuming application. */
export const configureHelpers = ({
  locales,
  statusBar,
  systemBarColors,
} = {}) => {
  if (locales) translations = locales;
  if (statusBar) statusBarAdapter = statusBar;
  if (systemBarColors) {
    statusBarColors = { ...DEFAULT_STATUS_BAR_COLORS, ...systemBarColors };
  }
};

export const getLanguage = () => {
  const language = storage()?.getItem('language')
    || (hasDocument() ? document.documentElement.lang : '')
    || (typeof navigator !== 'undefined' ? navigator.language : '')
    || 'es';

  return language.split('-')[0].toLowerCase();
};



export const setLanguage = (language) => {
  storage()?.setItem('language', language);

  if (hasDocument()) document.documentElement.lang = language;
  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent('app-language-change', {
      detail: { language },
    }));
  }
};

export const getTheme = () => {
  const savedTheme = storage()?.getItem('theme')
    || (hasDocument() ? document.documentElement.dataset.theme : '');

  if (savedTheme) return savedTheme;

  return hasWindow() && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const updateThemeColorMeta = (theme) => {
  if (!hasDocument()) return;

  const themeColor = document.querySelector('meta[name="theme-color"]:not([media])');
  const color = statusBarColors[theme]?.background;
  if (themeColor && color) themeColor.setAttribute('content', color);
};

export const applySystemBarsTheme = async (theme = getTheme()) => {
  const selectedTheme = statusBarColors[theme] || statusBarColors.light;
  updateThemeColorMeta(theme);

  if (!statusBarAdapter) return;

  try {
    await statusBarAdapter.setOverlaysWebView({ overlay: true });
    await statusBarAdapter.setBackgroundColor({ color: '#00000000' });
    await statusBarAdapter.setStyle({ style: selectedTheme.style });
  } catch (error) {
    console.debug('Status bar theme could not be applied', error);
  }
};

export const setTheme = (theme) => {
  storage()?.setItem('theme', theme);
  if (hasDocument()) document.documentElement.dataset.theme = theme;

  void applySystemBarsTheme(theme);

  if (hasWindow()) {
    window.dispatchEvent(new CustomEvent('app-theme-change', {
      detail: { theme },
    }));
  }
};

export const initPreferences = () => {
  const language = storage()?.getItem('language');
  const theme = storage()?.getItem('theme');

  if (hasDocument() && language) document.documentElement.lang = language;
  if (hasDocument() && theme) document.documentElement.dataset.theme = theme;

  void applySystemBarsTheme(theme || getTheme());
};

export const t = (key, defaultText = key) => (
  translations[getLanguage()]?.[key] ?? defaultText
);

export const todayLabel = (date = new Date()) => {
  const locale = getLanguage() === 'en' ? 'en-US' : 'es-ES';

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
};

export const formatCurrency = (value) => {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const locale = getLanguage() === 'en' ? 'en-US' : 'es-ES';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

export const navigation = (route) => {
  if (!hasWindow()) return;

  const path = route.startsWith('/') ? route : `/${route}`;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

/** Makes every helper directly available on the provided global object. */
export const installGlobals = (target = globalThis) => {
  Object.assign(target, helpers);
  return helpers;
};

export function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

export function base64ToPdfBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

const DATE_TOKEN = "(?:\\d{4}[-/]\\d{2}[-/]\\d{2}|\\d{2}[-/]\\d{2}[-/]\\d{4})";
const ISO_DATE_TOKEN = "\\d{4}-\\d{2}-\\d{2}";

function normalizeDate(value, order = "dmy") {
  const parts = value.split(/[/-]/).map(Number);
  const [year, month, day] = parts[0] > 999
    ? parts
    : order === "mdy"
      ? [parts[2], parts[0], parts[1]]
      : [parts[2], parts[1], parts[0]];
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateRange(firstValue, secondValue, order = "dmy") {
  const first = normalizeDate(firstValue, order);
  const second = normalizeDate(secondValue, order);

  if (!first || !second) {
    return null;
  }

  return first <= second
    ? { startDate: first, endDate: second }
    : { startDate: second, endDate: first };
}

export function extractPdfDateRange(text) {
  const generatedTitle = new RegExp(
    `(?:Resumen|Summary)\\s+(${ISO_DATE_TOKEN})\\s*(?:-|–|—)\\s*(${ISO_DATE_TOKEN})`,
    "i"
  ).exec(text);

  if (generatedTitle) {
    return dateRange(generatedTitle[1], generatedTitle[2]);
  }

  const spanishHeader = new RegExp(
    `Resumen\\s+entre\\s+(${DATE_TOKEN})\\s+y\\s+(${DATE_TOKEN})`,
    "i"
  ).exec(text);

  if (spanishHeader) {
    return dateRange(spanishHeader[1], spanishHeader[2], "dmy");
  }

  const englishHeader = new RegExp(
    `Summary\\s+from\\s+(${DATE_TOKEN})\\s+to\\s+(${DATE_TOKEN})`,
    "i"
  ).exec(text);

  if (englishHeader) {
    return dateRange(englishHeader[1], englishHeader[2], "mdy");
  }

  const explicitRange = new RegExp(
    `(${DATE_TOKEN})\\s*(?:-|–|—|a|al|y|to)\\s*(${DATE_TOKEN})`,
    "i"
  ).exec(text);

  if (explicitRange) {
    const range = dateRange(explicitRange[1], explicitRange[2]);

    if (range) {
      return range;
    }
  }

  const dates = [...text.matchAll(new RegExp(DATE_TOKEN, "g"))]
    .map((match) => normalizeDate(match[0]))
    .filter(Boolean)
    .sort();

  if (!dates.length) {
    return null;
  }

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  };
}

function parseMoney(value) {
  let normalized = value.replace(/\s*(?:EUR|€)\s*/gi, "").replace(/\s/g, "");
  const commaIndex = normalized.lastIndexOf(",");
  const dotIndex = normalized.lastIndexOf(".");

  if (commaIndex >= 0 && dotIndex >= 0) {
    normalized = commaIndex > dotIndex
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  } else if (commaIndex >= 0) {
    normalized = normalized.replace(",", ".");
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function extractPdfDailyTotals(text) {
  const english = /Summary\s+from|\bDate\b|\bCash\b/i.test(text)
    && !/Resumen\s+entre|\bFecha\b|\bEfectivo\b/i.test(text);
  const matches = [...text.matchAll(new RegExp(DATE_TOKEN, "g"))];
  const rows = new Map();

  matches.forEach((match, index) => {
    const date = normalizeDate(match[0], english ? "mdy" : "dmy");

    if (!date) {
      return;
    }

    const segmentEnd = matches[index + 1]?.index ?? text.length;
    const segment = text.slice(match.index + match[0].length, segmentEnd);
    const amounts = [...segment.matchAll(/-?\d[\d.,]*\s*(?:EUR|€)/gi)]
      .map((amountMatch) => parseMoney(amountMatch[0]))
      .filter((amount) => amount !== null);

    if (amounts.length < 4) {
      return;
    }

    const [cash, card, total, expenses] = amounts;

    if (Math.abs(cash + card - total) > 0.05) {
      return;
    }

    rows.set(date, { date, cash, card, expenses });
  });

  return [...rows.values()].sort((first, second) => first.date.localeCompare(second.date));
}

export function extractPdfDeduction(text, dailyTotals = []) {
  const amounts = [...text.matchAll(/-?\d[\d.,]*\s*(?:EUR|€)/gi)]
    .map((match) => parseMoney(match[0]))
    .filter((amount) => amount !== null);
  const grossTotal = dailyTotals.reduce((sum, item) => sum + item.cash + item.card, 0);
  const expenses = dailyTotals.reduce((sum, item) => sum + item.expenses, 0);
  const companyCommission = grossTotal * 0.5;
  const includesAmount = (expected) => amounts.some((amount) => Math.abs(amount - expected) <= 0.06);

  if (grossTotal > 0) {
    const candidates = amounts
      .filter((amount) => amount >= 0 && amount <= grossTotal)
      .filter((amount) => includesAmount(companyCommission + amount))
      .filter((amount) => includesAmount(companyCommission + amount - expenses))
      .sort((first, second) => first - second);

    if (candidates.length) {
      return candidates[0];
    }
  }

  const match = /(?:Deducci\s*[oó]\s*n|Deduction)\s*:?\s*(-?\d[\d.,]*\s*(?:EUR|€))/i.exec(text);
  return match ? parseMoney(match[1]) ?? 0 : 0;
}

export async function pdfContentHash(bytes) {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

