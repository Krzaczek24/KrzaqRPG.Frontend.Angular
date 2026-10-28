import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

const REMEMBER_ME_STORAGE_KEY = 'krzaq-rpg:remember-me';

describe('Login', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;

    beforeEach(async () => {
        localStorage.setItem('krzaq-rpg:language', 'pl');
        localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);

        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render required login and password fields, remember card, and submit button', () => {
        const element = fixture.nativeElement as HTMLElement;

        expect(element.querySelector('input[name="username"][required]')).toBeTruthy();
        expect(element.querySelector('input[name="password"][type="password"][required]')).toBeTruthy();
        expect(element.querySelector('.remember-card input[name="remember"][type="checkbox"]')).toBeTruthy();
        expect(element.querySelector('.remember-card__description')?.textContent?.trim())
            .toBe('Pozostań zalogowany na tym urządzeniu');
        expect(element.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Zaloguj się');
    });

    it('should save and restore the remember-me selection', () => {
        const checkbox = fixture.nativeElement.querySelector('input[name="remember"]') as HTMLInputElement;

        expect(checkbox.checked).toBe(false);

        checkbox.click();
        fixture.detectChanges();

        expect(localStorage.getItem(REMEMBER_ME_STORAGE_KEY)).toBe('true');

        const restoredFixture = TestBed.createComponent(Login);
        restoredFixture.detectChanges();
        const restoredCheckbox = restoredFixture.nativeElement.querySelector('input[name="remember"]') as HTMLInputElement;

        expect(restoredCheckbox.checked).toBe(true);

        restoredCheckbox.click();
        restoredFixture.detectChanges();
        expect(localStorage.getItem(REMEMBER_ME_STORAGE_KEY)).toBe('false');
        restoredFixture.destroy();
    });
});
