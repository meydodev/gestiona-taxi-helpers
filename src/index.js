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

const helpers = {
  configureHelpers,
  getLanguage,
  setLanguage,
  getTheme,
  setTheme,
  applySystemBarsTheme,
  initPreferences,
  t,
  todayLabel,
  formatCurrency,
  navigation,
};

/** Makes every helper directly available on the provided global object. */
export const installGlobals = (target = globalThis) => {
  Object.assign(target, helpers);
  return helpers;
};

installGlobals();
