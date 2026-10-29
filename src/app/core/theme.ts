import { Injectable, signal } from '@angular/core';

export const PALETTES = ['arcane', 'forest', 'ember', 'ocean', 'royal', 'tavern'] as const;
export type Palette = (typeof PALETTES)[number];
export const PALETTE_STORAGE_KEY = 'krzaq-rpg:guest-palette';

export function isPalette(value: string | null): value is Palette {
    return PALETTES.some((palette) => palette === value);
}

export function readSavedPalette(): Palette {
    const savedPalette = localStorage.getItem(PALETTE_STORAGE_KEY);
    return isPalette(savedPalette) ? savedPalette : 'arcane';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
    public readonly selectedPalette = signal(readSavedPalette());

    public selectPalette(palette: string): void {
        if (isPalette(palette)) {
            this.selectedPalette.set(palette);
            localStorage.setItem(PALETTE_STORAGE_KEY, palette);
        }
    }
}
