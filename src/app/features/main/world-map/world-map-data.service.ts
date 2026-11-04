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
        if (!this.canSelectArea(area.id)) {
            return;
        }

        const path = this.availablePaths().find(({ targetArea }) => targetArea.id === area.id);
        if (!path) {
            return;
        }

        this.selectedPaths.update((selectedAreas) => [...selectedAreas, AreaDto.fromJS(area)]);
        this.selectedPathIds.update((pathIds) => [...pathIds, path.id]);
        this.selectedPathTravelTimes.update((times) => [
            ...times,
            this.travelTimeFor(area.id),
        ]);
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
        this.selectedPathTravelTimes.update((times) => times.slice(0, index));
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
        this.selectedRouteTravelTime.set(undefined);
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
        const selectedPathIds = this.selectedPathIds();
        const estimatedTimes = new Map<number, number | null>();
        const selectedRoutePrefixTimes = new Map<number, number | null>([[0, 0]]);
        let selectedRouteTime: number | null | undefined =
            selectedPathIds.length === 0 ? 0 : undefined;

        const updateSelectedPathTravelTimes = (): void => {
            if (requestId !== this.estimatesRequestId) {
                return;
            }

            const times = selectedPathIds.map((_, index) => {
                const previousTime = selectedRoutePrefixTimes.get(index);
                const currentTime = selectedRoutePrefixTimes.get(index + 1);
                if (previousTime === undefined || currentTime === undefined) {
                    return undefined;
                }
                if (previousTime === null || currentTime === null) {
                    return null;
                }

                const increment = currentTime - previousTime;
                if (increment < 0) {
                    console.error(
                        `Estimated travel time for selected path ${index} is negative.`,
                    );
                    return null;
                }
                return this.formatTravelTime(increment);
            });
            this.selectedPathTravelTimes.set(times);
        };

        const updateTravelTimes = (): void => {
            if (requestId !== this.estimatesRequestId || selectedRouteTime === undefined) {
                return;
            }

            const selectedRouteTimeSnapshot = selectedRouteTime;
            this.travelTimes.update((times) => {
                const updatedTimes = { ...times };
                for (const [areaId, totalTime] of estimatedTimes) {
                    if (totalTime === null || selectedRouteTimeSnapshot === null) {
                        updatedTimes[areaId] = null;
                    } else {
                        const travelTime = totalTime - selectedRouteTimeSnapshot;
                        if (travelTime < 0) {
                            console.error(
                                `Estimated travel time to area ${areaId} is shorter than the selected route.`,
                            );
                            updatedTimes[areaId] = null;
                        } else {
                            updatedTimes[areaId] = this.formatTravelTime(travelTime);
                        }
                    }
                }
                return updatedTimes;
            });
        };

        if (selectedPathIds.length > 0) {
            this.apiClient
                .estimateTravel(characterId, selectedPathIds)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: ({ totalTravelTime }) => {
                        if (requestId === this.estimatesRequestId) {
                            selectedRouteTime = this.parseTravelTime(totalTravelTime);
                            this.selectedRouteTravelTime.set(
                                selectedRouteTime === null
                                    ? null
                                    : this.formatTravelTime(selectedRouteTime),
                            );
                            selectedRoutePrefixTimes.set(selectedPathIds.length, selectedRouteTime);
                            updateSelectedPathTravelTimes();
                            updateTravelTimes();
                        }
                    },
                    error: (error: unknown) => {
                        console.error('Failed to estimate the selected route travel time.', error);
                        if (requestId === this.estimatesRequestId) {
                            selectedRouteTime = null;
                            this.selectedRouteTravelTime.set(null);
                            selectedRoutePrefixTimes.set(selectedPathIds.length, null);
                            updateSelectedPathTravelTimes();
                            for (const path of paths) {
                                estimatedTimes.set(path.targetArea.id, null);
                            }
                            updateTravelTimes();
                        }
                    },
                });
        }

        for (let prefixLength = 1; prefixLength < selectedPathIds.length; prefixLength++) {
            const prefixPathIds = selectedPathIds.slice(0, prefixLength);
            this.apiClient
                .estimateTravel(characterId, prefixPathIds)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: ({ totalTravelTime }) => {
                        if (requestId === this.estimatesRequestId) {
                            selectedRoutePrefixTimes.set(
                                prefixLength,
                                this.parseTravelTime(totalTravelTime),
                            );
                            updateSelectedPathTravelTimes();
                        }
                    },
                    error: (error: unknown) => {
                        console.error(
                            `Failed to estimate the selected route after ${prefixLength} paths.`,
                            error,
                        );
                        if (requestId === this.estimatesRequestId) {
                            selectedRoutePrefixTimes.set(prefixLength, null);
                            updateSelectedPathTravelTimes();
                        }
                    },
                });
        }

        for (const path of paths) {
            const routePathIds = [...selectedPathIds, path.id];
            this.apiClient
                .estimateTravel(characterId, routePathIds)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: ({ totalTravelTime }) => {
                        if (requestId === this.estimatesRequestId) {
                            estimatedTimes.set(
                                path.targetArea.id,
                                this.parseTravelTime(totalTravelTime),
                            );
                            updateTravelTimes();
                        }
                    },
                    error: (error: unknown) => {
                        console.error(
                            `Failed to estimate travel time to area ${path.targetArea.id}.`,
                            error,
                        );
                        if (requestId === this.estimatesRequestId) {
                            estimatedTimes.set(path.targetArea.id, null);
                            updateTravelTimes();
                        }
                    },
                });
        }
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
