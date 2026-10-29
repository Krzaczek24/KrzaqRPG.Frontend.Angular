import { Injectable } from '@angular/core';

export const AUTH_SESSION_STARTED_AT_KEY = 'krzaq-rpg:session-started-at';
export const TOTAL_PLAYTIME_SECONDS_KEY = 'krzaq-rpg:total-playtime-seconds';

function readTotalPlaytimeSeconds(): number {
    const savedSeconds = Number(localStorage.getItem(TOTAL_PLAYTIME_SECONDS_KEY));
    return Number.isFinite(savedSeconds) && savedSeconds >= 0 ? Math.floor(savedSeconds) : 0;
}

export function formatDuration(totalSeconds: number): string {
    const duration = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
        return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }

    if (minutes > 0) {
        return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    }

    return `${seconds}s`;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
    public start(): number {
        const startedAt = Date.now();
        localStorage.setItem(AUTH_SESSION_STARTED_AT_KEY, String(startedAt));
        return startedAt;
    }

    public ensureStartedAt(): number {
        const savedStartedAt = Number(localStorage.getItem(AUTH_SESSION_STARTED_AT_KEY));
        if (Number.isFinite(savedStartedAt) && savedStartedAt > 0) {
            return savedStartedAt;
        }

        return this.start();
    }

    public getSessionDurationSeconds(now = Date.now()): number {
        const startedAt = Number(localStorage.getItem(AUTH_SESSION_STARTED_AT_KEY));
        if (!Number.isFinite(startedAt) || startedAt <= 0) {
            return 0;
        }

        return Math.max(0, Math.floor((now - startedAt) / 1000));
    }

    public getTotalPlaytimeSeconds(now = Date.now()): number {
        return readTotalPlaytimeSeconds() + this.getSessionDurationSeconds(now);
    }

    public finish(): void {
        const totalPlaytimeSeconds = readTotalPlaytimeSeconds() + this.getSessionDurationSeconds();
        localStorage.setItem(TOTAL_PLAYTIME_SECONDS_KEY, String(totalPlaytimeSeconds));
        localStorage.removeItem(AUTH_SESSION_STARTED_AT_KEY);
    }
}
