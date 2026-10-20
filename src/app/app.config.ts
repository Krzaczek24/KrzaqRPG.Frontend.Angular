import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideApiClient } from './core/api/api.config';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideHttpClient(),
        provideApiClient(environment.apiBaseUrl),
        provideRouter(routes),
    ],
};
