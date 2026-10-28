import { Component, inject } from '@angular/core';
import { Router } from '@angular/router'
import { I18nService } from '../../../core/i18n/i18n.service';

const REMEMBER_ME_STORAGE_KEY = 'krzaq-rpg:remember-me';

@Component({
    imports: [],
    selector: 'app-login',
    styleUrl: './login.scss',
    templateUrl: './login.html',
})
export class Login {
    private router: Router = inject(Router)
    public readonly i18n = inject(I18nService);
    public rememberMe = localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === 'true';

    updateRememberMe(event: Event): void {
        if (!(event.target instanceof HTMLInputElement)) {
            return;
        }

        this.rememberMe = event.target.checked;
        localStorage.setItem(REMEMBER_ME_STORAGE_KEY, String(this.rememberMe));
    }
    
    login(event: SubmitEvent) {
        event.preventDefault()
        localStorage.setItem('auth_token', 'hello')
        this.router.navigate(['/world-map'])
        console.debug('klikam logowanko')
    }
}
