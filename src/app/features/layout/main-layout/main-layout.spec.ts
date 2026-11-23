import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import {
    ApiClient,
    AreaDto,
    AvailablePathDto,
    GetCharacterDetailsQueryResult,
} from '../../../core/api/api-client';
import {
    AUTH_SESSION_STARTED_AT_KEY,
    TOTAL_PLAYTIME_SECONDS_KEY,
} from '../../../core/auth-session';
import { PALETTE_STORAGE_KEY, ThemeService } from '../../../core/theme';
import { I18nService } from '../../../core/i18n/i18n.service';
import { MainLayout } from './main-layout';
import { Options } from '../../main/options/options';
import { WorldMapDataService } from '../../main/world-map/world-map-data.service';

@Component({ template: '' })
class RouteStub {}

describe('MainLayout', () => {
    let component: MainLayout;
    let fixture: ComponentFixture<MainLayout>;
    const areas = [
        AreaDto.fromJS({ id: 12, name: 'Faramh', coordinates: { x: 840, y: 580 } }),
        AreaDto.fromJS({ id: 13, name: 'Faramh Canals', coordinates: { x: 900, y: 700 } }),
        AreaDto.fromJS({ id: 14, name: 'Faramh Grassland', coordinates: { x: 950, y: 800 } }),
    ];
    const getAreaAvailablePaths = vi.fn(() =>
        of({
            availablePaths: [
                AvailablePathDto.fromJS({
                    id: 411,
                    name: 'Faramh -> Faramh Canals',
                    targetArea: { id: 13, name: 'Faramh Canals' },
                }),
                AvailablePathDto.fromJS({
                    id: 511,
                    name: 'Faramh -> Faramh Grassland',
                    targetArea: { id: 14, name: 'Faramh Grassland' },
                }),
            ],
        }),
    );
    const estimateTravel = vi.fn((characterId: number, pathIds: number[]) =>
        of({
            characterId,
            pathIds,
            paths: [],
            totalDistance: 0,
            totalTravelTime:
                pathIds.length === 1 ? '00:12:03.6000000' : '00:24:07.2000000',
        }),
    );
    const beginTravel = vi.fn(() => of({ id: 501 }));

    beforeEach(async () => {
        getAreaAvailablePaths.mockClear();
        estimateTravel.mockClear();
        beginTravel.mockClear();
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
                {
                    provide: ApiClient,
                    useValue: {
                        getAreas: () => of({ areas }),
                        getCharacterDetails: () =>
                            of(
                                GetCharacterDetailsQueryResult.fromJS({
                                    id: 1,
                                    name: 'Krzaq',
                                    location: { type: 'Area', id: 12, name: 'Faramh' },
                                }),
                            ),
                        getAreaAvailablePaths,
                        estimateTravel,
                        beginTravel,
                    },
                },
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

    it('should show the travel panel only on the world map and use the shared area action', async () => {
        const router = TestBed.inject(Router);
        await router.navigateByUrl('/inventory');
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.main-layout__side--right')).toBeNull();
        const leftPanel = fixture.nativeElement.querySelector(
            '.main-layout__side:not(.main-layout__side--right)',
        );
        expect(leftPanel.querySelectorAll('.main-layout__nav-link')).toHaveLength(3);
        expect(leftPanel.classList.contains('main-layout__side--right')).toBe(false);

        await router.navigateByUrl('/options');
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.main-layout__side--right')).toBeNull();
        expect(leftPanel.querySelectorAll('.main-layout__nav-link')).toHaveLength(3);

        await router.navigateByUrl('/world-map');
        fixture.detectChanges();
        const rightPanel = fixture.nativeElement.querySelector('.main-layout__side--right');
        expect(leftPanel.querySelectorAll('.main-layout__nav-link')).toHaveLength(3);
        let destinations = rightPanel.querySelectorAll('.main-layout__travel-button');
        const selectArea = vi.spyOn(TestBed.inject(WorldMapDataService), 'selectArea');

        expect(rightPanel.querySelectorAll('.main-layout__nav-link')).toHaveLength(0);
        expect(
            (rightPanel.querySelector('.main-layout__begin-travel') as HTMLButtonElement).disabled,
        ).toBe(true);
        expect(rightPanel.querySelector('#current-area-heading').textContent.trim()).toBe(
            'Obecny obszar',
        );
        expect(rightPanel.querySelector('.main-layout__area-name').textContent.trim()).toBe(
            'Faramh',
        );
        expect(
            Array.from(
                destinations,
                (button: Element) =>
                    button.querySelector('.main-layout__travel-name')?.textContent?.trim(),
            ),
        ).toEqual(['Faramh Canals', 'Faramh Grassland']);
        expect(getAreaAvailablePaths).toHaveBeenCalledWith(12);
        expect(estimateTravel).toHaveBeenCalledWith(1, [411]);
        expect(estimateTravel).toHaveBeenCalledWith(1, [511]);
        expect(destinations[0].querySelector('.main-layout__travel-time').textContent.trim()).toBe(
            '+ 12m 03s',
        );

        destinations[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
        expect(selectArea).toHaveBeenCalledWith(
            expect.objectContaining({ id: 13, name: 'Faramh Canals' }),
        );
        expect(getAreaAvailablePaths).toHaveBeenLastCalledWith(13);
        expect(
            Array.from(
                rightPanel.querySelectorAll('.main-layout__selected-name'),
                (name: Element) => name.textContent?.trim(),
            ),
        ).toEqual(['Faramh Canals']);
        expect(
            rightPanel
                .querySelector('.main-layout__selected .main-layout__travel-time')
                .textContent.trim(),
        ).toBe('+ 12m 03s');
        expect(rightPanel.querySelectorAll('.main-layout__selected .main-layout__travel-button'))
            .toHaveLength(0);

        destinations = rightPanel.querySelectorAll('.main-layout__travel-button');
        expect(
            Array.from(
                destinations,
                (button: Element) =>
                    button.querySelector('.main-layout__travel-name')?.textContent?.trim(),
            ),
        ).toEqual(['Faramh Grassland']);
        expect(destinations[0].querySelector('.main-layout__travel-time').textContent.trim()).toBe(
            '+ 12m 03s',
        );
        destinations[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
        expect(
            Array.from(
                rightPanel.querySelectorAll('.main-layout__selected-name'),
                (name: Element) => name.textContent?.trim(),
            ),
        ).toEqual(['Faramh Canals', 'Faramh Grassland']);
        expect(
            Array.from(
                rightPanel.querySelectorAll('.main-layout__selected .main-layout__travel-time'),
                (time: Element) => time.textContent?.trim(),
            ),
        ).toEqual(['+ 12m 03s', '+ 12m 03s']);
        const beginTravelButton = rightPanel.querySelector(
            '.main-layout__begin-travel',
        ) as HTMLButtonElement;
        expect(beginTravelButton.textContent).toContain('Wyrusz w drogę');
        expect(
            rightPanel.querySelector('.main-layout__begin-travel-time').textContent.trim(),
        ).toBe('24m 07s');
        beginTravelButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
        expect(beginTravel).toHaveBeenCalledWith(
            expect.objectContaining({ characterId: 1, pathIds: [411, 511] }),
        );
        expect(beginTravelButton.disabled).toBe(true);
        expect(beginTravelButton.textContent).toContain('Podróż rozpoczęta');

        rightPanel
            .querySelectorAll('.main-layout__remove-path')[1]
            .dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();
        expect(
            Array.from(
                rightPanel.querySelectorAll('.main-layout__selected-name'),
                (name: Element) => name.textContent?.trim(),
            ),
        ).toEqual(['Faramh Canals']);
        expect(getAreaAvailablePaths).toHaveBeenLastCalledWith(13);

        destinations = rightPanel.querySelectorAll('.main-layout__travel-button');
        expect(
            Array.from(
                destinations,
                (button: Element) =>
                    button.querySelector('.main-layout__travel-name')?.textContent?.trim(),
            ),
        ).toEqual(['Faramh Grassland']);
        destinations[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        rightPanel
            .querySelector('.main-layout__remove-path')
            .dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(rightPanel.querySelectorAll('.main-layout__selected-name')).toHaveLength(0);
        expect(getAreaAvailablePaths).toHaveBeenLastCalledWith(12);
        expect(
            Array.from(
                rightPanel.querySelectorAll('.main-layout__travel-button'),
                (button: Element) =>
                    button.querySelector('.main-layout__travel-name')?.textContent?.trim(),
            ),
        ).toEqual(['Faramh Canals', 'Faramh Grassland']);
    });

    it('should keep navigation controls in the header and left side panel', () => {
        const controls = fixture.nativeElement.querySelectorAll(
            '.main-layout__top .main-layout__control, .main-layout__side .main-layout__control',
        );

        expect(controls).toHaveLength(6);
        expect(
            fixture.nativeElement.querySelectorAll('.main-layout__side .main-layout__control'),
        ).toHaveLength(3);
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
        ]);
        expect(
            fixture.nativeElement.querySelector('.main-layout__logout').getAttribute('aria-label'),
        ).toBe('Вийти');
    });
});
