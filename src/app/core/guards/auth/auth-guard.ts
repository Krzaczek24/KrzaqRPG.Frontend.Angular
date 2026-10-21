import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router)

    const isAuthenticated = localStorage.getItem('auth_token')?.length ?? 0 > 0

    if (isAuthenticated)
        return true;

    return router.parseUrl('/login')
};
