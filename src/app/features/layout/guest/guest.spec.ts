import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Guest } from './guest';

const PALETTE_STORAGE_KEY = 'krzaq-rpg:guest-palette';
const LANGUAGE_STORAGE_KEY = 'krzaq-rpg:language';

@Component({ template: '' })
class RouteStub {}

describe('Guest', () => {
    let component: Guest;
    let fixture: ComponentFixture<Guest>;

    beforeEach(async () => {
        localStorage.removeItem(PALETTE_STORAGE_KEY);
        localStorage.removeItem(LANGUAGE_STORAGE_KEY);

        await TestBed.configureTestingModule({
            imports: [Guest],
            providers: [provideRouter([
                { path: 'login', component: RouteStub },
                { path: 'register', component: RouteStub },
            ])],
        }).compileComponents();

        fixture = TestBed.createComponent(Guest);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render login and registration navigation', () => {
        const links = fixture.nativeElement.querySelectorAll('.auth-tabs a');

        expect(links).toHaveLength(2);
        expect(links[0].getAttribute('href')).toBe('/login');
        expect(links[1].getAttribute('href')).toBe('/register');
    });

    it('should highlight the navigation link matching the current page', async () => {
        const router = TestBed.inject(Router);
        const links = fixture.nativeElement.querySelectorAll('.auth-tabs a');

        await router.navigateByUrl('/login');
        fixture.detectChanges();

        expect(links[0].classList.contains('auth-tabs__link--active')).toBe(true);
        expect(links[0].getAttribute('aria-current')).toBe('page');
        expect(links[1].classList.contains('auth-tabs__link--active')).toBe(false);

        await router.navigateByUrl('/register');
        fixture.detectChanges();

        expect(links[0].classList.contains('auth-tabs__link--active')).toBe(false);
        expect(links[1].classList.contains('auth-tabs__link--active')).toBe(true);
        expect(links[1].getAttribute('aria-current')).toBe('page');
    });

    it('should provide a styled tooltip label for each color palette', () => {
        const paletteButtons = fixture.nativeElement.querySelectorAll('.palette-option');

        expect(Array.from(paletteButtons, (button: Element) => button.getAttribute('data-tooltip'))).toEqual([
            'Arkana',
            'Szmaragdowy las',
            'Smoczy żar',
            'Głębia oceanu',
            'Królewski granat',
            'Ciemny brąz i złoto',
        ]);
    });

    it('should display a theme label and provide a styled dropdown fallback for narrow layouts', () => {
        expect(fixture.nativeElement.querySelector('.palette-picker .appearance-control__label')?.textContent?.trim())
            .toBe('Motyw');
        expect(fixture.nativeElement.querySelector('.theme-dropdown .appearance-dropdown__trigger')).toBeTruthy();
        expect(fixture.nativeElement.querySelectorAll('.palette-option')).toHaveLength(6);
    });

    it('should show theme and language controls in the same appearance row', () => {
        const appearanceControls = fixture.nativeElement.querySelector('.appearance-controls');
        expect(appearanceControls.querySelector('.theme-dropdown .appearance-dropdown__trigger')).toBeTruthy();
        expect(appearanceControls.querySelector('.language-picker .appearance-dropdown__trigger')).toBeTruthy();
    });

    it('should change the interface language and save the selection', () => {
        fixture.nativeElement.querySelector('.language-picker .appearance-dropdown__trigger').click();
        fixture.detectChanges();
        fixture.nativeElement.querySelector('#language-options [role="option"]:nth-child(2)').click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Увійди у світ пригод');
        expect(fixture.nativeElement.querySelector('.palette-option--forest').getAttribute('data-tooltip'))
            .toBe('Смарагдовий ліс');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('uk');
        expect(document.documentElement.lang).toBe('uk');
    });

    it('should render a themed dropdown menu with rounded theme-colored borders', () => {
        fixture.nativeElement.querySelector('.language-picker .appearance-dropdown__trigger').click();
        fixture.detectChanges();

        const menu = fixture.nativeElement.querySelector('#language-options') as HTMLElement;
        expect(menu).toBeTruthy();
        expect(menu.classList.contains('appearance-dropdown__menu')).toBe(true);
        expect(menu.getAttribute('role')).toBe('listbox');
        expect(menu.querySelectorAll('.appearance-dropdown__option')).toHaveLength(3);
        expect(fixture.nativeElement.querySelector('.language-picker .appearance-control__label')?.textContent?.trim())
            .toBe('Język');
    });

    it('should allow selecting a theme from the dots and dropdown', () => {
        const paletteButtons = fixture.nativeElement.querySelectorAll('.palette-option');

        expect(paletteButtons).toHaveLength(6);
        expect(fixture.nativeElement.querySelector('.guest-shell').dataset.palette).toBe('arcane');

        paletteButtons[5].click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.guest-shell').dataset.palette).toBe('tavern');
        expect(paletteButtons[5].getAttribute('aria-pressed')).toBe('true');
        expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('tavern');

        fixture.nativeElement.querySelector('.theme-dropdown .appearance-dropdown__trigger').click();
        fixture.detectChanges();
        fixture.nativeElement.querySelector('#theme-options [role="option"]:nth-child(2)').click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.guest-shell').dataset.palette).toBe('forest');
        expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('forest');
    });

    it('should restore a saved palette when the component is created', async () => {
        localStorage.setItem(PALETTE_STORAGE_KEY, 'royal');
        const restoredFixture = TestBed.createComponent(Guest);
        await restoredFixture.whenStable();

        expect(restoredFixture.nativeElement.querySelector('.guest-shell').dataset.palette).toBe('royal');
        restoredFixture.destroy();
    });

    it('should use the default palette when the stored value is invalid', () => {
        localStorage.setItem(PALETTE_STORAGE_KEY, 'unknown');
        const freshFixture = TestBed.createComponent(Guest);

        expect(freshFixture.componentInstance.selectedPalette).toBe('arcane');
        freshFixture.destroy();
    });
});
