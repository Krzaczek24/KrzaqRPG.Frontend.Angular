import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AuthSessionService, formatDuration } from '../../../core/auth-session';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ThemeService } from '../../../core/theme';

@Component({
    imports: [RouterLink, RouterLinkActive, RouterOutlet],
    selector: 'app-main-layout',
    styleUrl: './main-layout.scss',
    templateUrl: './main-layout.html',
})
export class MainLayout {
    public router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    public readonly i18n = inject(I18nService);
    public readonly theme = inject(ThemeService);
    private readonly authSession = inject(AuthSessionService);
    public readonly clockTime = signal(this.formatTime(new Date()));
    public readonly sessionDuration = signal(
        formatDuration(this.authSession.getSessionDurationSeconds()),
    );
    public readonly totalPlaytime = signal(
        formatDuration(this.authSession.getTotalPlaytimeSeconds()),
    );

    constructor() {
        this.authSession.ensureStartedAt();

        interval(1000)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                const now = new Date();
                this.clockTime.set(this.formatTime(now));
                this.sessionDuration.set(
                    formatDuration(this.authSession.getSessionDurationSeconds(now.getTime())),
                );
                this.totalPlaytime.set(
                    formatDuration(this.authSession.getTotalPlaytimeSeconds(now.getTime())),
                );
            });
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        });
    }

    logout() {
        localStorage.removeItem('auth_token');
        this.authSession.finish();
        this.router.navigate(['/']);
    }
}
