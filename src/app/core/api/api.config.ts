import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ApiClient, API_BASE_URL } from './api-client';

export function provideApiClient(baseUrl: string): EnvironmentProviders {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

    return makeEnvironmentProviders([
        { provide: API_BASE_URL, useValue: normalizedBaseUrl },
        ApiClient,
    ]);
}
