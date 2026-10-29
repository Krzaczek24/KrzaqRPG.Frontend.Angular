import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { isLanguage } from '../../../core/i18n/translations';
import { PALETTES, Palette, ThemeService } from '../../../core/theme';

@Component({
    imports: [RouterLink, RouterLinkActive, RouterOutlet],
    selector: 'app-guest-layout',
    styleUrl: './guest-layout.scss',
    templateUrl: './guest-layout.html',
})
export class GuestLayout {
    public readonly i18n = inject(I18nService);
    public readonly theme = inject(ThemeService);
    public readonly languageOptions = [
        { code: 'pl', label: 'Polski' },
        { code: 'uk', label: 'Українська' },
        { code: 'en', label: 'English' },
    ] as const;
    public openDropdown: 'theme' | 'language' | null = null;
    public get selectedPalette(): Palette {
        return this.theme.selectedPalette();
    }

    public get currentLanguage() {
        return (
            this.languageOptions.find(({ code }) => code === this.i18n.language()) ??
            this.languageOptions[0]
        );
    }

    public get paletteOptions() {
        const labels: Record<Palette, string> = {
            arcane: this.i18n.text.paletteArcane,
            forest: this.i18n.text.paletteForest,
            ember: this.i18n.text.paletteEmber,
            ocean: this.i18n.text.paletteOcean,
            royal: this.i18n.text.paletteRoyal,
            tavern: this.i18n.text.paletteTavern,
        };
        return PALETTES.map((value) => ({ value, label: labels[value] }));
    }

    public get selectedPaletteLabel(): string {
        return this.paletteOptions.find(({ value }) => value === this.selectedPalette)?.label ?? '';
    }

    public set selectedPalette(palette: Palette) {
        this.theme.selectPalette(palette);
    }

    public selectPalette(palette: string): void {
        this.theme.selectPalette(palette);
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
