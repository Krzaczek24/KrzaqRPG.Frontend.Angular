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
        service.selectArea(areas[1]);
        expect(service.selectedPaths().map((area) => area.id)).toEqual([2]);
        expect(service.availableDestinations().map((path) => path.targetArea.id)).toEqual([3]);
        expect(estimateTravel).toHaveBeenCalledWith(1, [12]);
        expect(estimateTravel).toHaveBeenLastCalledWith(1, [12, 23]);
        expect(service.travelTimeFor(3)).toBe('1m 00s');
        expect(service.selectedPathTravelTimeFor(0)).toBe('1m 00s');

        service.selectArea(areas[2]);
        expect(service.selectedPaths().map((area) => area.id)).toEqual([2, 3]);
        expect(service.availableDestinations().map((path) => path.targetArea.id)).toEqual([1]);
        expect(estimateTravel).toHaveBeenCalledWith(1, [12, 23]);
        expect(estimateTravel).toHaveBeenLastCalledWith(1, [12, 23, 31]);
        expect(service.travelTimeFor(1)).toBe('1m 00s');
        expect(service.selectedPathTravelTimeFor(0)).toBe('1m 00s');
        expect(service.selectedPathTravelTimeFor(1)).toBe('1m 00s');

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

});
