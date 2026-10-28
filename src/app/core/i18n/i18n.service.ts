import { Injectable, signal } from '@angular/core';
import { isLanguage, Language, TRANSLATIONS, Translations } from './translations';

const LANGUAGE_STORAGE_KEY = 'krzaq-rpg:language';

@Injectable({ providedIn: 'root' })
export class I18nService {
    public readonly language = signal<Language>('pl');

    constructor() {
        const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage !== null && isLanguage(savedLanguage)) {
            this.language.set(savedLanguage);
        }
        document.documentElement.lang = this.language();
    }

    public get text(): Translations {
        return TRANSLATIONS[this.language()];
    }

    public setLanguage(language: Language): void {
        this.language.set(language);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        document.documentElement.lang = language;
    }
}
