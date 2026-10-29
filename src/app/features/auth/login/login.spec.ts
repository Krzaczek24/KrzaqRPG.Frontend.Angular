import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AUTH_SESSION_STARTED_AT_KEY } from '../../../core/auth-session';
import { Login } from './login';

const REMEMBER_ME_STORAGE_KEY = 'krzaq-rpg:remember-me';

@Component({ template: '' })
class RouteStub {}

describe('Login', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;

    beforeEach(async () => {
        localStorage.setItem('krzaq-rpg:language', 'pl');
        localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
        localStorage.removeItem('auth_token');
        localStorage.removeItem(AUTH_SESSION_STARTED_AT_KEY);

        await TestBed.configureTestingModule({
            imports: [Login],
            providers: [provideRouter([{ path: 'world-map', component: RouteStub }])],
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
        expect(
            element.querySelector('input[name="password"][type="password"][required]'),
        ).toBeTruthy();
        expect(
            element.querySelector('.remember-card input[name="remember"][type="checkbox"]'),
        ).toBeTruthy();
        expect(element.querySelector('.remember-card__description')?.textContent?.trim()).toBe(
            'Pozostań zalogowany na tym urządzeniu',
        );
        expect(element.querySelector('button[type="submit"]')?.textContent?.trim()).toBe(
            'Zaloguj się',
        );
    });

    it('should show required field validation in the selected language', () => {
        const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        fixture.detectChanges();

        const errors = fixture.nativeElement.querySelectorAll('.form-field__error');
        expect(errors).toHaveLength(2);
        expect(Array.from(errors, (error: Element) => error.textContent.trim())).toEqual([
            'To pole jest wymagane',
            'To pole jest wymagane',
        ]);
        expect(localStorage.getItem('auth_token')).toBeNull();

        component.i18n.setLanguage('uk');
        fixture.detectChanges();

        expect(Array.from(errors, (error: Element) => error.textContent.trim())).toEqual([
            'Це поле обов’язкове',
            'Це поле обов’язкове',
        ]);
    });

    it('should save the session start time after successful login', () => {
        const inputs = fixture.nativeElement.querySelectorAll(
            '.login-form input[name="username"], .login-form input[name="password"]',
        ) as NodeListOf<HTMLInputElement>;
        inputs[0].value = 'player';
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].value = 'password';
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        fixture.detectChanges();

        fixture.nativeElement
            .querySelector('.login-form')
            .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        expect(localStorage.getItem('auth_token')).toBe('hello');
        expect(Number(localStorage.getItem(AUTH_SESSION_STARTED_AT_KEY))).toBeGreaterThan(0);
    });

    it('should save and restore the remember-me selection', () => {
        const checkbox = fixture.nativeElement.querySelector(
            'input[name="remember"]',
        ) as HTMLInputElement;

        expect(checkbox.checked).toBe(false);

        checkbox.click();
        fixture.detectChanges();

        expect(localStorage.getItem(REMEMBER_ME_STORAGE_KEY)).toBe('true');

        const restoredFixture = TestBed.createComponent(Login);
        restoredFixture.detectChanges();
        const restoredCheckbox = restoredFixture.nativeElement.querySelector(
            'input[name="remember"]',
        ) as HTMLInputElement;

        expect(restoredCheckbox.checked).toBe(true);

        restoredCheckbox.click();
        restoredFixture.detectChanges();
        expect(localStorage.getItem(REMEMBER_ME_STORAGE_KEY)).toBe('false');
        restoredFixture.destroy();
    });
});
