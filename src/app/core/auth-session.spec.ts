import {
    AUTH_SESSION_STARTED_AT_KEY,
    AuthSessionService,
    formatDuration,
    TOTAL_PLAYTIME_SECONDS_KEY,
} from './auth-session';

describe('formatDuration', () => {
    it.each([
        [0, '0s'],
        [9, '9s'],
        [10, '10s'],
        [60, '1m 00s'],
        [65, '1m 05s'],
        [3600, '1h 00m 00s'],
        [3601, '1h 00m 01s'],
        [5025, '1h 23m 45s'],
    ])('formats %i seconds as %s', (seconds, expected) => {
        expect(formatDuration(seconds)).toBe(expected);
    });
});

describe('AuthSessionService', () => {
    let service: AuthSessionService;

    beforeEach(() => {
        localStorage.removeItem(AUTH_SESSION_STARTED_AT_KEY);
        localStorage.removeItem(TOTAL_PLAYTIME_SECONDS_KEY);
        service = new AuthSessionService();
    });

    it('should add the finished session to total playtime', () => {
        localStorage.setItem(TOTAL_PLAYTIME_SECONDS_KEY, '120');
        localStorage.setItem(AUTH_SESSION_STARTED_AT_KEY, String(Date.now() - 5000));

        service.finish();

        expect(Number(localStorage.getItem(TOTAL_PLAYTIME_SECONDS_KEY))).toBeGreaterThanOrEqual(
            125,
        );
        expect(localStorage.getItem(AUTH_SESSION_STARTED_AT_KEY)).toBeNull();
    });
});
