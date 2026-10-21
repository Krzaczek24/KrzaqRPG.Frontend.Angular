import { Routes } from '@angular/router';
import { Guest } from './features/layout/guest/guest'
import { MainLayout } from './features/layout/main-layout/main-layout'
import { authGuard } from './core/guards/auth/auth-guard'
import { anonymousGuard } from './core/guards/anonymous/anonymous-guard'

export const routes: Routes = [
    // Anonymous user zone
    {
        path: '',
        component: Guest,
        canActivate: [anonymousGuard],
        children: [
            { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
            { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.Register) },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    // Logged user zone
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            { path: 'world-map', loadComponent: () => import('./features/main/world-map/world-map').then(m => m.WorldMap) },
            { path: 'inventory', loadComponent: () => import('./features/main/inventory/inventory').then(m => m.Inventory) },
            { path: 'options', loadComponent: () => import('./features/main/options/options').then(m => m.Options) },
            { path: '', redirectTo: 'world-map', pathMatch: 'full' }
        ]
    },
    // ---
    { path: '**', redirectTo: '' },
];
