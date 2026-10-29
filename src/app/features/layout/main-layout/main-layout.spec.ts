import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
    AUTH_SESSION_STARTED_AT_KEY,
    TOTAL_PLAYTIME_SECONDS_KEY,
} from '../../../core/auth-session';
import { PALETTE_STORAGE_KEY, ThemeService } from '../../../core/theme';
import { I18nService } from '../../../core/i18n/i18n.service';
import { MainLayout } from './main-layout';
import { Options } from '../../main/options/options';

@Component({ template: '' })
class RouteStub {}

describe('MainLayout', () => {
    let component: MainLayout;
    let fixture: ComponentFixture<MainLayout>;

    beforeEach(async () => {
        localStorage.removeItem(PALETTE_STORAGE_KEY);
        localStorage.removeItem('krzaq-rpg:language');
        localStorage.removeItem(AUTH_SESSION_STARTED_AT_KEY);
        localStorage.removeItem(TOTAL_PLAYTIME_SECONDS_KEY);

        await TestBed.configureTestingModule({
            imports: [MainLayout],
            providers: [
                provideRouter([
                    { path: 'world-map', component: RouteStub },
                    { path: 'inventory', component: RouteStub },
                    { path: 'options', component: Options },
                ]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MainLayout);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should apply the saved palette', async () => {
        TestBed.inject(ThemeService).selectPalette('forest');
        const savedFixture = TestBed.createComponent(MainLayout);
        savedFixture.detectChanges();
        await savedFixture.whenStable();

        expect(savedFixture.nativeElement.querySelector('.main-layout').dataset.palette).toBe(
            'forest',
        );
        savedFixture.destroy();
    });

    it('should fall back to the default palette when the saved value is invalid', () => {
        localStorage.setItem(PALETTE_STORAGE_KEY, 'unknown');
        const defaultFixture = TestBed.createComponent(MainLayout);
        defaultFixture.detectChanges();

        expect(defaultFixture.nativeElement.querySelector('.main-layout').dataset.palette).toBe(
            'arcane',
        );
        defaultFixture.destroy();
    });

    it('should highlight the navigation link matching the current page', async () => {
        const router = TestBed.inject(Router);
        const links = fixture.nativeElement.querySelectorAll('.main-layout__nav-link');

        await router.navigateByUrl('/inventory');
        fixture.detectChanges();

        expect(links[1].classList.contains('main-layout__nav-link--active')).toBe(true);
        expect(links[1].getAttribute('aria-current')).toBe('page');
        expect(links[0].classList.contains('main-layout__nav-link--active')).toBe(false);

        await router.navigateByUrl('/options');
        fixture.detectChanges();

        expect(links[1].classList.contains('main-layout__nav-link--active')).toBe(false);
        expect(links[2].classList.contains('main-layout__nav-link--active')).toBe(true);
        expect(links[2].getAttribute('aria-current')).toBe('page');
        expect(links[5].classList.contains('main-layout__nav-link--active')).toBe(true);
    });

    it('should keep navigation controls in the header and side panels', () => {
        const controls = fixture.nativeElement.querySelectorAll(
            '.main-layout__top .main-layout__control, .main-layout__side .main-layout__control',
        );

        expect(controls).toHaveLength(10);
        expect(
            fixture.nativeElement.querySelectorAll('.main-layout__side .main-layout__control'),
        ).toHaveLength(6);
    });

    it('should keep theme and language controls out of the footer', () => {
        expect(
            fixture.nativeElement.querySelectorAll(
                '.main-layout__bottom .appearance-dropdown__trigger',
            ),
        ).toHaveLength(0);
        expect(
            fixture.nativeElement.querySelectorAll('.main-layout__bottom .palette-option'),
        ).toHaveLength(0);
    });

    it('should render the copyright, centered clock, and both elapsed timers', () => {
        expect(
            fixture.nativeElement.querySelector('.main-layout__copyright').textContent.trim(),
        ).toBe('© 2026 Krzaq RPG');
        expect(
            fixture.nativeElement.querySelector('.main-layout__clock').textContent.trim(),
        ).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        expect(fixture.nativeElement.querySelector('.main-layout__durations')).toBeTruthy();
        expect(fixture.nativeElement.querySelectorAll('.main-layout__duration time')).toHaveLength(
            2,
        );
    });

    it('should render both playtime measurements and the logout icon on the right', () => {
        const footerActions = fixture.nativeElement.querySelector('.main-layout__footer-actions');

        expect(footerActions.querySelectorAll('.main-layout__duration')).toHaveLength(2);
        expect(
            footerActions.querySelector('.main-layout__duration time').getAttribute('aria-label'),
        ).toBe('Czas od zalogowania');
        expect(fixture.nativeElement.querySelector('.main-layout__clock')).toBeTruthy();
        expect(fixture.nativeElement.querySelector('.main-layout__clock').parentElement).toBe(
            fixture.nativeElement.querySelector('.main-layout__bottom'),
        );
        expect(footerActions.querySelector('.main-layout__logout').getAttribute('aria-label')).toBe(
            'Wyloguj',
        );
        expect(
            footerActions.querySelector('.main-layout__logout').getAttribute('data-tooltip'),
        ).toBe('Wyloguj');
    });

    it('should translate both playtime labels when language changes', () => {
        TestBed.inject(I18nService).setLanguage('uk');
        fixture.detectChanges();

        const labels = fixture.nativeElement.querySelectorAll('.main-layout__duration span');
        expect(Array.from(labels, (label: Element) => label.textContent?.trim())).toEqual([
            'Час від входу',
            'Загальний час гри',
        ]);
    });

    it('should change and persist the selected theme', async () => {
        const router = TestBed.inject(Router);
        await router.navigateByUrl('/options');
        fixture.detectChanges();
        fixture.nativeElement.querySelector('.palette-option--forest').click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.main-layout').dataset.palette).toBe('forest');
        expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('forest');
        expect(
            fixture.nativeElement
                .querySelector('.palette-option--forest')
                .getAttribute('aria-pressed'),
        ).toBe('true');
    });

    it('should translate navigation links and logout when language changes', () => {
        TestBed.inject(I18nService).setLanguage('uk');
        fixture.detectChanges();

        const links = fixture.nativeElement.querySelectorAll('.main-layout__nav-link');
        expect(Array.from(links, (link: Element) => link.textContent?.trim())).toEqual([
            'Мапа світу',
            'Інвентар',
            'Налаштування',
            'Мапа світу',
            'Інвентар',
            'Налаштування',
            'Мапа світу',
            'Інвентар',
            'Налаштування',
        ]);
        expect(
            fixture.nativeElement.querySelector('.main-layout__top button').textContent.trim(),
        ).toBe('Вийти');
    });
});
