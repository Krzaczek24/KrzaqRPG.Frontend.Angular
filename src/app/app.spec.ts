import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { provideApiClient } from './core/api/api.config';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideHttpClient(), provideApiClient(''), provideRouter(routes)],
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
