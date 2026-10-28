export type Theme = 'light' | 'dark' | (string & {});

export interface StatusBarAdapter {
  setOverlaysWebView(options: { overlay: boolean }): Promise<void>;
  setBackgroundColor(options: { color: string }): Promise<void>;
  setStyle(options: { style: string }): Promise<void>;
}

export interface HelperConfiguration {
  locales?: Record<string, Record<string, string>>;
  statusBar?: StatusBarAdapter;
  systemBarColors?: Record<string, { background: string; style: string }>;
}

export function configureHelpers(configuration?: HelperConfiguration): void;
export function getLanguage(): string;
export function setLanguage(language: string): void;
export function getTheme(): Theme;
export function setTheme(theme: Theme): void;
export function applySystemBarsTheme(theme?: Theme): Promise<void>;
export function initPreferences(): void;
export function t(key: string, defaultText?: string): string;
export function todayLabel(date?: Date): string;
export function formatCurrency(value: unknown): string;
export function navigation(route: string): void;
export function installGlobals(target?: typeof globalThis): GestionaTaxiHelpers;

export interface GestionaTaxiHelpers {
  configureHelpers: typeof configureHelpers;
  getLanguage: typeof getLanguage;
  setLanguage: typeof setLanguage;
  getTheme: typeof getTheme;
  setTheme: typeof setTheme;
  applySystemBarsTheme: typeof applySystemBarsTheme;
  initPreferences: typeof initPreferences;
  t: typeof t;
  todayLabel: typeof todayLabel;
  formatCurrency: typeof formatCurrency;
  navigation: typeof navigation;
}

declare global {
  var configureHelpers: GestionaTaxiHelpers['configureHelpers'];
  var getLanguage: GestionaTaxiHelpers['getLanguage'];
  var setLanguage: GestionaTaxiHelpers['setLanguage'];
  var getTheme: GestionaTaxiHelpers['getTheme'];
  var setTheme: GestionaTaxiHelpers['setTheme'];
  var applySystemBarsTheme: GestionaTaxiHelpers['applySystemBarsTheme'];
  var initPreferences: GestionaTaxiHelpers['initPreferences'];
  var t: GestionaTaxiHelpers['t'];
  var todayLabel: GestionaTaxiHelpers['todayLabel'];
  var formatCurrency: GestionaTaxiHelpers['formatCurrency'];
  var navigation: GestionaTaxiHelpers['navigation'];
}
