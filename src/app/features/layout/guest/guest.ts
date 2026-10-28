import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { isLanguage } from '../../../core/i18n/translations';

const PALETTES = ['arcane', 'forest', 'ember', 'ocean', 'royal', 'tavern'] as const;
type Palette = (typeof PALETTES)[number];
const PALETTE_STORAGE_KEY = 'krzaq-rpg:guest-palette';

function isPalette(value: string | null): value is Palette {
    return PALETTES.some((palette) => palette === value);
}

@Component({
    imports: [RouterLink, RouterLinkActive, RouterOutlet],
    selector: 'app-guest',
    styleUrl: './guest.scss',
    templateUrl: './guest.html',
})
export class Guest {
    public readonly i18n = inject(I18nService);
    public readonly languageOptions = [
        { code: 'pl', label: 'Polski' },
        { code: 'uk', label: 'Українська' },
        { code: 'en', label: 'English' },
    ] as const;
    public openDropdown: 'theme' | 'language' | null = null;
    private palette: Palette = 'arcane';

    constructor() {
        const savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY);
        if (isPalette(savedPalette)) {
            this.palette = savedPalette;
        }
    }

    public get selectedPalette(): Palette {
        return this.palette;
    }

    public get currentLanguage() {
        return this.languageOptions.find(({ code }) => code === this.i18n.language()) ?? this.languageOptions[0];
    }

    public get paletteOptions() {
        return [
            { value: 'arcane', label: this.i18n.text.paletteArcane },
            { value: 'forest', label: this.i18n.text.paletteForest },
            { value: 'ember', label: this.i18n.text.paletteEmber },
            { value: 'ocean', label: this.i18n.text.paletteOcean },
            { value: 'royal', label: this.i18n.text.paletteRoyal },
            { value: 'tavern', label: this.i18n.text.paletteTavern },
        ] as const;
    }

    public get selectedPaletteLabel(): string {
        return this.paletteOptions.find(({ value }) => value === this.selectedPalette)?.label ?? '';
    }

    public set selectedPalette(palette: Palette) {
        this.palette = palette;
        localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    }

    public selectPalette(palette: string): void {
        if (isPalette(palette)) {
            this.selectedPalette = palette;
        }
    }

    public toggleDropdown(dropdown: 'theme' | 'language'): void {
        this.openDropdown = this.openDropdown === dropdown ? null : dropdown;
    }

    public selectLanguage(language: string): void {
        if (isLanguage(language)) {
            this.i18n.setLanguage(language);
        }
    }

    @HostListener('document:click')
    public closeDropdowns(): void {
        this.openDropdown = null;
    }

    @HostListener('document:keydown.escape')
    public closeDropdownsOnEscape(): void {
        this.openDropdown = null;
    }
}
