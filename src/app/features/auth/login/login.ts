import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AuthSessionService } from '../../../core/auth-session';

const REMEMBER_ME_STORAGE_KEY = 'krzaq-rpg:remember-me';

@Component({
    imports: [FormsModule],
    selector: 'app-login',
    styleUrl: './login.scss',
    templateUrl: './login.html',
})
export class Login {
    private router: Router = inject(Router);
    private readonly authSession = inject(AuthSessionService);
    public readonly i18n = inject(I18nService);
    public rememberMe = localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';
    public submitted = false;

    updateRememberMe(event: Event): void {
        if (!(event.target instanceof HTMLInputElement)) {
            return;
        }

        this.rememberMe = event.target.checked;
        localStorage.setItem(REMEMBER_ME_STORAGE_KEY, String(this.rememberMe));
    }

    login(form: NgForm): void {
        this.submitted = true;
        if (form.invalid) {
            return;
        }

        localStorage.setItem('auth_token', 'hello');
        this.authSession.start();
        this.router.navigate(['/world-map']);
    }
}
