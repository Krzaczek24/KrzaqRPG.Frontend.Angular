import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router'

@Component({
    imports: [RouterOutlet],
    selector: 'app-main-layout',
    styleUrl: './main-layout.scss',
    templateUrl: './main-layout.html',
})
export class MainLayout {
    public router = inject(Router)
    
    logout() {
        localStorage.removeItem('auth_token')
        this.router.navigate(['/'])
    }
}
