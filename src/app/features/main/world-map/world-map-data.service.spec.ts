import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
    ApiClient,
    AreaDto,
    AvailablePathDto,
    GetCharacterDetailsQueryResult,
} from '../../../core/api/api-client';
import { WorldMapDataService } from './world-map-data.service';

describe('WorldMapDataService', () => {
    let service: WorldMapDataService;
    const estimateTravel = vi.fn((characterId: number, pathIds: number[]) => {
        const totalMinutes = String(pathIds.length).padStart(2, '0');
        return of({
            characterId,
            pathIds,
            paths: [],
            totalDistance: 0,
            totalTravelTime: `00:${totalMinutes}:00.0000000`,
        });
    });
    const areas = [
        AreaDto.fromJS({ id: 1, name: 'Starting area' }),
        AreaDto.fromJS({ id: 2, name: 'Second area' }),
        AreaDto.fromJS({ id: 3, name: 'Third area' }),
    ];
    const pathsByArea = new Map<number, AvailablePathDto[]>([
        [
            1,
            [
                AvailablePathDto.fromJS({
                    id: 12,
                    name: 'Starting -> Second',
                    targetArea: { id: 2, name: 'Second area' },
                }),
            ],
        ],
        [
            2,
            [
                AvailablePathDto.fromJS({
                    id: 23,
                    name: 'Second -> Third',
                    targetArea: { id: 3, name: 'Third area' },
                }),
                AvailablePathDto.fromJS({
                    id: 21,
                    name: 'Second -> Starting',
                    targetArea: { id: 1, name: 'Starting area' },
                }),
            ],
        ],
        [
            3,
            [
                AvailablePathDto.fromJS({
                    id: 31,
                    name: 'Third -> Starting',
                    targetArea: { id: 1, name: 'Starting area' },
                }),
                AvailablePathDto.fromJS({
                    id: 32,
                    name: 'Third -> Second',
                    targetArea: { id: 2, name: 'Second area' },
                }),
            ],
        ],
    ]);

    beforeEach(() => {
        estimateTravel.mockClear();
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: ApiClient,
                    useValue: {
                        getAreas: () => of({ areas }),
                        getCharacterDetails: () =>
                            of(
                                GetCharacterDetailsQueryResult.fromJS({
                                    id: 1,
                                    name: 'Hero',
                                    location: { type: 'Area', id: 1, name: 'Starting area' },
                                }),
                            ),
                        getAreaAvailablePaths: (areaId: number) =>
                            of({ availablePaths: pathsByArea.get(areaId) ?? [] }),
                        estimateTravel,
                    },
                },
            ],
        });
        service = TestBed.inject(WorldMapDataService);
        service.areas.set(areas);
        service.character.set(
            GetCharacterDetailsQueryResult.fromJS({
                id: 1,
                name: 'Hero',
                location: { type: 'Area', id: 1, name: 'Starting area' },
            }),
        );
        service.availablePaths.set(pathsByArea.get(1) ?? []);
    });

    it('prevents only an immediate return and allows revisiting older locations later', () => {
        service.load();
        expect(estimateTravel.mock.calls.map(([, pathIds]) => pathIds)).toEqual([[12]]);

        service.selectArea(areas[1]);
        expect(service.selectedPaths().map((area) => area.id)).toEqual([2]);
        expect(service.availableDestinations().map((path) => path.targetArea.id)).toEqual([3]);
        expect(estimateTravel).toHaveBeenCalledWith(1, [12]);
        expect(estimateTravel).toHaveBeenCalledWith(1, [23]);
        expect(estimateTravel.mock.calls.map(([, pathIds]) => pathIds)).toEqual([[12], [23]]);
        expect(service.travelTimeFor(3)).toBe('1m 00s');
        expect(service.selectedPathTravelTimeFor(0)).toBe('1m 00s');

        service.selectArea(areas[2]);
        expect(service.selectedPaths().map((area) => area.id)).toEqual([2, 3]);
        expect(service.availableDestinations().map((path) => path.targetArea.id)).toEqual([1]);
        expect(estimateTravel).toHaveBeenCalledWith(1, [31]);
        expect(estimateTravel.mock.calls.map(([, pathIds]) => pathIds)).toEqual([
            [12],
            [23],
            [31],
        ]);
        expect(estimateTravel.mock.calls.every(([, pathIds]) => pathIds.length === 1)).toBe(true);
        expect(service.travelTimeFor(1)).toBe('1m 00s');
        expect(service.selectedPathTravelTimeFor(0)).toBe('1m 00s');
        expect(service.selectedPathTravelTimeFor(1)).toBe('1m 00s');
        expect(service.selectedRouteTravelTime()).toBe('2m 00s');

        service.selectArea(areas[0]);
        expect(service.selectedPaths().map((area) => area.id)).toEqual([2, 3, 1]);
        expect(service.availableDestinations().map((path) => path.targetArea.id)).toEqual([2]);

        service.selectArea(areas[1]);
        expect(service.selectedPaths().map((area) => area.id)).toEqual([2, 3, 1, 2]);
        expect(service.availableDestinations().map((path) => path.targetArea.id)).toEqual([3]);
    });

    it('does not append the immediately previous location to the route', () => {
        service.selectArea(areas[1]);
        service.selectArea(areas[2]);

        service.selectArea(areas[1]);

        expect(service.selectedPaths().map((area) => area.id)).toEqual([2, 3]);
    });

    it('removes the last route segment when selecting the current planned area', () => {
        service.selectArea(areas[1]);
        service.selectArea(areas[2]);

        service.selectArea(areas[2]);

        expect(service.selectedPaths().map((area) => area.id)).toEqual([2]);
        expect(service.availablePaths().map((path) => path.targetArea.id)).toEqual([3, 1]);
    });

    it('keeps the route unchanged when clicking the starting area with no selected paths', () => {
        service.selectArea(areas[0]);

        expect(service.selectedPaths()).toEqual([]);
    });

    it('uses the full map area when selecting a destination with only its id and name', () => {
        const areasWithCoordinates = [
            AreaDto.fromJS({ id: 1, name: 'Starting area', coordinates: { x: 100, y: 200 } }),
            AreaDto.fromJS({ id: 2, name: 'Second area', coordinates: { x: 300, y: 400 } }),
            AreaDto.fromJS({ id: 3, name: 'Third area', coordinates: { x: 500, y: 600 } }),
        ];
        service.areas.set(areasWithCoordinates);

        service.selectArea(pathsByArea.get(1)![0].targetArea);

        expect(service.selectedPaths()[0].coordinates).toEqual({ x: 300, y: 400 });
    });

});
