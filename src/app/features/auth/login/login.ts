import { Component, inject } from '@angular/core';
import { Router } from '@angular/router'

@Component({
    imports: [],
    selector: 'app-login',
    styleUrl: './login.scss',
    templateUrl: './login.html',
})
export class Login {
    private router: Router = inject(Router)
    
    login() {
        localStorage.setItem('auth_token', 'hello')
        this.router.navigate(['/world-map'])
        console.debug('klikam logowanko')
    }
}
