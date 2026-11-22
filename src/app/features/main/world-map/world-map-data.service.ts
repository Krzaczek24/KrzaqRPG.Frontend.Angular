import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatDuration } from '../../../core/auth-session';
import {
    ApiClient,
    AreaDto,
    AvailablePathDto,
    BeginTravelCommand,
    GetCharacterDetailsQueryResult,
} from '../../../core/api/api-client';

@Injectable({ providedIn: 'root' })
export class WorldMapDataService {
    private readonly apiClient = inject(ApiClient);
    private readonly destroyRef = inject(DestroyRef);
    private loadStarted = false;
    private pathsRequestId = 0;
    private readonly travelTimeEstimates = new Map<number, number | null>();
    private selectedPathDurations: (number | null | undefined)[] = [];

    public readonly areas = signal<AreaDto[]>([]);
    public readonly character = signal<GetCharacterDetailsQueryResult | null>(null);
    public readonly availablePaths = signal<AvailablePathDto[]>([]);
    public readonly selectedPaths = signal<AreaDto[]>([]);
    public readonly selectedPathIds = signal<number[]>([]);
    public readonly selectedPathTravelTimes = signal<(string | null | undefined)[]>([]);
    public readonly selectedRouteTravelTime = signal<string | null | undefined>(undefined);
    public readonly isBeginningTravel = signal(false);
    public readonly travelStarted = signal(false);
    public readonly travelTimes = signal<Record<number, string | null>>({});
    public readonly currentArea = computed(() => {
        const location = this.character()?.location;
        if (!location || location.type !== 'Area') {
            return null;
        }

        return this.areas().find((area) => area.id === location.id) ?? null;
    });
    public readonly routeCurrentAreaId = computed(
        () => this.selectedPaths().at(-1)?.id ?? this.currentArea()?.id,
    );
    public readonly routePreviousAreaId = computed(() => {
        const selectedAreas = this.selectedPaths();
        if (selectedAreas.length > 1) {
            return selectedAreas.at(-2)?.id;
        }
        return selectedAreas.length === 1 ? this.currentArea()?.id : undefined;
    });
    public readonly availableDestinations = computed(() => {
        const currentAreaId = this.routeCurrentAreaId();
        const previousAreaId = this.routePreviousAreaId();

        return this.availablePaths().filter(
            ({ targetArea }) =>
                targetArea.id !== currentAreaId && targetArea.id !== previousAreaId,
        );
    });
    private estimatesRequestId = 0;

    public load(): void {
        if (this.loadStarted) {
            return;
        }
        this.loadStarted = true;

        this.apiClient
            .getAreas()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ areas }) => this.areas.set(areas),
                error: (error: unknown) => console.error('Failed to load map areas.', error),
            });

        this.apiClient
            .getCharacterDetails(1)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (character) => {
                    this.character.set(character);
                    const location = character.location;
                    if (location?.type !== 'Area') {
                        this.availablePaths.set([]);
                        return;
                    }

                    this.loadAvailablePaths(location.id);
                },
                error: (error: unknown) =>
                    console.error('Failed to load character details.', error),
            });
    }

    public isAreaReachable(areaId: number): boolean {
        return this.availableDestinations().some((path) => path.targetArea.id === areaId);
    }

    public selectArea(area: Pick<AreaDto, 'id' | 'name'>): void {
        const selectedAreas = this.selectedPaths();
        if (selectedAreas.at(-1)?.id === area.id) {
            this.removeSelectedPath(selectedAreas.length - 1);
            return;
        }

        if (!this.canSelectArea(area.id)) {
            return;
        }

        const path = this.availablePaths().find(({ targetArea }) => targetArea.id === area.id);
        if (!path) {
            return;
        }

        const selectedArea = this.areas().find(({ id }) => id === area.id) ?? area;
        const pathDuration = this.travelTimeEstimates.get(path.id);
        this.selectedPaths.update((selectedAreas) => [
            ...selectedAreas,
            AreaDto.fromJS(selectedArea),
        ]);
        this.selectedPathIds.update((pathIds) => [...pathIds, path.id]);
        this.selectedPathDurations = [...this.selectedPathDurations, pathDuration];
        this.selectedPathTravelTimes.update((times) => [
            ...times,
            pathDuration === undefined
                ? undefined
                : pathDuration === null
                  ? null
                  : this.formatTravelTime(pathDuration),
        ]);
        this.updateSelectedRouteTravelTime();
        this.travelStarted.set(false);
        this.loadAvailablePaths(area.id);
    }

    public canSelectArea(areaId: number): boolean {
        return (
            areaId !== this.routeCurrentAreaId() &&
            areaId !== this.routePreviousAreaId() &&
            this.availableDestinations().some((path) => path.targetArea.id === areaId)
        );
    }

    public removeSelectedPath(index: number): void {
        const selectedAreas = this.selectedPaths();
        if (!Number.isInteger(index) || index < 0 || index >= selectedAreas.length) {
            return;
        }

        this.selectedPaths.set(selectedAreas.slice(0, index));
        this.selectedPathIds.update((pathIds) => pathIds.slice(0, index));
        this.selectedPathDurations = this.selectedPathDurations.slice(0, index);
        this.selectedPathTravelTimes.update((times) => times.slice(0, index));
        this.updateSelectedRouteTravelTime();
        this.travelStarted.set(false);
        const remainingArea = this.selectedPaths().at(-1) ?? this.currentArea();
        if (remainingArea) {
            this.loadAvailablePaths(remainingArea.id);
        } else {
            this.pathsRequestId++;
            this.availablePaths.set([]);
        }
    }

    private loadAvailablePaths(areaId: number): void {
        const requestId = ++this.pathsRequestId;
        this.estimatesRequestId++;
        this.availablePaths.set([]);
        this.travelTimes.set({});
        this.apiClient
            .getAreaAvailablePaths(areaId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ availablePaths }) => {
                    if (requestId === this.pathsRequestId) {
                        this.availablePaths.set(availablePaths);
                        this.loadTravelEstimates(this.availableDestinations());
                    }
                },
                error: (error: unknown) =>
                    console.error('Failed to load available travel paths.', error),
            });
    }

    public travelTimeFor(areaId: number): string | null | undefined {
        return this.travelTimes()[areaId];
    }

    public selectedPathTravelTimeFor(index: number): string | null | undefined {
        return this.selectedPathTravelTimes()[index];
    }

    public beginTravel(): void {
        const characterId = this.character()?.id;
        const pathIds = this.selectedPathIds();
        if (
            characterId === undefined ||
            pathIds.length === 0 ||
            this.isBeginningTravel() ||
            this.travelStarted()
        ) {
            return;
        }

        this.isBeginningTravel.set(true);
        this.apiClient
            .beginTravel(new BeginTravelCommand({ characterId, pathIds }))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isBeginningTravel.set(false);
                    if (pathIds.length === this.selectedPathIds().length &&
                        pathIds.every((pathId, index) => pathId === this.selectedPathIds()[index])) {
                        this.travelStarted.set(true);
                    }
                },
                error: (error: unknown) => {
                    console.error('Failed to begin travel.', error);
                    this.isBeginningTravel.set(false);
                },
            });
    }

    private loadTravelEstimates(paths: AvailablePathDto[]): void {
        const characterId = this.character()?.id;
        if (characterId === undefined) {
            return;
        }

        const requestId = ++this.estimatesRequestId;
        const estimatedTimes = new Map<number, number | null>();

        const updateTravelTimes = (): void => {
            if (requestId !== this.estimatesRequestId) {
                return;
            }

            this.travelTimes.update((times) => {
                const updatedTimes = { ...times };
                for (const [areaId, travelTime] of estimatedTimes) {
                    if (travelTime === null) {
                        updatedTimes[areaId] = null;
                    } else {
                        updatedTimes[areaId] = this.formatTravelTime(travelTime);
                    }
                }
                return updatedTimes;
            });
        };

        for (const path of paths) {
            this.apiClient
                .estimateTravel(characterId, [path.id])
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: ({ totalTravelTime }) => {
                        const duration = this.parseTravelTime(totalTravelTime);
                        this.travelTimeEstimates.set(path.id, duration);
                        this.updateSelectedPathDuration(path.id, duration);
                        if (requestId === this.estimatesRequestId) {
                            estimatedTimes.set(path.targetArea.id, duration);
                            updateTravelTimes();
                        }
                    },
                    error: (error: unknown) => {
                        console.error(
                            `Failed to estimate travel time to area ${path.targetArea.id}.`,
                            error,
                        );
                        this.travelTimeEstimates.set(path.id, null);
                        this.updateSelectedPathDuration(path.id, null);
                        if (requestId === this.estimatesRequestId) {
                            estimatedTimes.set(path.targetArea.id, null);
                            updateTravelTimes();
                        }
                    },
                });
        }
    }

    private updateSelectedPathDuration(pathId: number, duration: number | null): void {
        const index = this.selectedPathIds().indexOf(pathId);
        if (index < 0) {
            return;
        }

        this.selectedPathDurations[index] = duration;
        this.selectedPathTravelTimes.update((times) =>
            times.map((time, pathIndex) =>
                pathIndex !== index
                    ? time
                    : duration === null
                      ? null
                      : this.formatTravelTime(duration),
            ),
        );
        this.updateSelectedRouteTravelTime();
    }

    private updateSelectedRouteTravelTime(): void {
        if (
            this.selectedPathDurations.length === 0 ||
            this.selectedPathDurations.some((duration) => duration === undefined)
        ) {
            this.selectedRouteTravelTime.set(undefined);
            return;
        }

        if (this.selectedPathDurations.some((duration) => duration === null)) {
            this.selectedRouteTravelTime.set(null);
            return;
        }

        const totalTime = this.selectedPathDurations.reduce<number>(
            (total, duration) => total + (duration ?? 0),
            0,
        );
        this.selectedRouteTravelTime.set(this.formatTravelTime(totalTime));
    }

    private parseTravelTime(value: string): number | null {
        const match = /^(?:(\d+)\.)?(\d{1,2}):([0-5]\d):([0-5]\d)(?:\.(\d+))?$/.exec(value);
        if (!match) {
            console.error(`Invalid travel time returned by API: ${value}`);
            return null;
        }

        const [, days = '0', hours, minutes, seconds, fractionalSeconds = ''] = match;
        const milliseconds = Number(`0.${fractionalSeconds}`) * 1000;
        return (
            (Number(days) * 24 * 60 * 60 +
                Number(hours) * 60 * 60 +
                Number(minutes) * 60 +
                Number(seconds)) *
                1000 +
            Math.round(milliseconds)
        );
    }

    private formatTravelTime(milliseconds: number): string {
        return formatDuration(Math.floor(milliseconds / 1000));
    }
}
