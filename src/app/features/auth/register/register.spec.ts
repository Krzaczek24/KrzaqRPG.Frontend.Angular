import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';

describe('Register', () => {
    let component: Register;
    let fixture: ComponentFixture<Register>;

    beforeEach(async () => {
        localStorage.setItem('krzaq-rpg:language', 'pl');

        await TestBed.configureTestingModule({
            imports: [Register],
        }).compileComponents();

        fixture = TestBed.createComponent(Register);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render required username, password, and password confirmation fields', () => {
        const element = fixture.nativeElement as HTMLElement;

        expect(element.querySelector('input[name="username"][required]')).toBeTruthy();
        expect(
            element.querySelector('input[name="password"][type="password"][required]'),
        ).toBeTruthy();
        expect(
            element.querySelector('input[name="passwordConfirmation"][type="password"][required]'),
        ).toBeTruthy();
        expect(element.querySelector('button[type="submit"]')?.textContent?.trim()).toBe(
            'Utwórz konto',
        );
    });

    it('should show required field validation in the selected language', () => {
        const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        fixture.detectChanges();

        const errors = fixture.nativeElement.querySelectorAll('.form-field__error');
        expect(errors).toHaveLength(3);
        expect(Array.from(errors, (error: Element) => error.textContent.trim())).toEqual([
            'To pole jest wymagane',
            'To pole jest wymagane',
            'To pole jest wymagane',
        ]);

        component.i18n.setLanguage('en');
        fixture.detectChanges();

        expect(Array.from(errors, (error: Element) => error.textContent.trim())).toEqual([
            'This field is required',
            'This field is required',
            'This field is required',
        ]);
    });
});
