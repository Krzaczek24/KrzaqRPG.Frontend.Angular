import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PALETTE_STORAGE_KEY, ThemeService } from '../../../core/theme';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Options } from './options';

describe('Options', () => {
    let component: Options;
    let fixture: ComponentFixture<Options>;

    beforeEach(async () => {
        localStorage.removeItem(PALETTE_STORAGE_KEY);
        localStorage.removeItem('krzaq-rpg:language');

        await TestBed.configureTestingModule({
            imports: [Options],
        }).compileComponents();

        fixture = TestBed.createComponent(Options);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render theme and language controls on the options page', () => {
        expect(
            fixture.nativeElement.querySelectorAll('.appearance-dropdown__trigger'),
        ).toHaveLength(2);
        expect(fixture.nativeElement.querySelectorAll('.palette-option')).toHaveLength(6);
    });

    it('should change and persist the selected theme', () => {
        fixture.nativeElement.querySelector('.palette-option--forest').click();
        fixture.detectChanges();

        expect(TestBed.inject(ThemeService).selectedPalette()).toBe('forest');
        expect(localStorage.getItem(PALETTE_STORAGE_KEY)).toBe('forest');
        expect(
            fixture.nativeElement
                .querySelector('.palette-option--forest')
                .getAttribute('aria-pressed'),
        ).toBe('true');
    });

    it('should change and persist the selected language', () => {
        fixture.nativeElement
            .querySelector('.language-picker .appearance-dropdown__trigger')
            .click();
        fixture.detectChanges();
        fixture.nativeElement
            .querySelector('#language-options [role="option"]:nth-child(2)')
            .click();
        fixture.detectChanges();

        expect(TestBed.inject(I18nService).language()).toBe('uk');
        expect(localStorage.getItem('krzaq-rpg:language')).toBe('uk');
        expect(
            fixture.nativeElement.querySelector('.appearance-control__label').textContent.trim(),
        ).toBe('Тема');
    });
});
