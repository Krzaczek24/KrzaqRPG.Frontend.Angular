import pl from './languages/pl.json';
import uk from './languages/uk.json';
import en from './languages/en.json';

export type Language = 'pl' | 'uk' | 'en';

export interface Translations {
    languageLabel: string;
    authNavigationLabel: string;
    brandTagline: string;
    welcome: string;
    heading: string;
    intro: string;
    loginTab: string;
    registerTab: string;
    worldMap: string;
    inventory: string;
    options: string;
    logout: string;
    sessionDuration: string;
    totalPlaytime: string;
    paletteLabel: string;
    paletteArcane: string;
    paletteForest: string;
    paletteEmber: string;
    paletteOcean: string;
    paletteRoyal: string;
    paletteTavern: string;
    footerTagline: string;
    loginLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    loginPasswordPlaceholder: string;
    rememberMe: string;
    rememberDescription: string;
    loginSubmit: string;
    registerUsernamePlaceholder: string;
    registerPasswordPlaceholder: string;
    passwordConfirmationLabel: string;
    passwordConfirmationPlaceholder: string;
    registerSubmit: string;
    requiredField: string;
}

export const TRANSLATIONS: Record<Language, Translations> = { pl, uk, en };

export const LANGUAGES: readonly Language[] = ['pl', 'uk', 'en'];

export function isLanguage(value: string): value is Language {
    return LANGUAGES.some((language) => language === value);
}
