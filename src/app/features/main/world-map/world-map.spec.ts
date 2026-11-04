import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { AreaDto, AvailablePathDto, GetCharacterDetailsQueryResult } from '../../../core/api/api-client';
import { WorldMap } from './world-map';
import { WorldMapDataService } from './world-map-data.service';

describe('WorldMap', () => {
    let component: WorldMap;
    let fixture: ComponentFixture<WorldMap>;
    const areas = [
        AreaDto.fromJS({ id: 1, name: 'Abandoned Mines', coordinates: { x: 280, y: 140 } }),
        AreaDto.fromJS({ id: 2, name: 'Invalid position', coordinates: { x: 2001, y: 20 } }),
        AreaDto.fromJS({ id: 3, name: 'Reachable place', coordinates: { x: 500, y: 600 } }),
    ];
    const character = signal(
        GetCharacterDetailsQueryResult.fromJS({
                id: 1,
                name: 'Krzaq',
                location: { type: 'Area', id: 1, name: 'Abandoned Mines' },
        }),
    );
    const currentArea = computed(
        () => areas.find((area) => area.id === character()?.location?.id) ?? null,
    );
    const paths = [
        AvailablePathDto.fromJS({
            id: 12,
            name: 'Abandoned Mines -> Reachable place',
            targetArea: { id: 3, name: 'Reachable place' },
        }),
    ];
    const selectedPaths = signal<AreaDto[]>([]);
    const availablePaths = signal(paths);
    const availableDestinations = computed(() => {
        const selectedAreas = selectedPaths();
        const previousAreaId =
            selectedAreas.length > 1
                ? selectedAreas.at(-2)?.id
                : selectedAreas.length === 1
                  ? currentArea()?.id
                  : undefined;
        const currentAreaId = selectedAreas.at(-1)?.id ?? currentArea()?.id;
        return availablePaths().filter(
            (path) =>
                path.targetArea.id !== currentAreaId && path.targetArea.id !== previousAreaId,
        );
    });

    beforeEach(async () => {
        character.set(
            GetCharacterDetailsQueryResult.fromJS({
                id: 1,
                name: 'Krzaq',
                location: { type: 'Area', id: 1, name: 'Abandoned Mines' },
            }),
        );
        selectedPaths.set([]);
        availablePaths.set(paths);
        await TestBed.configureTestingModule({
            imports: [WorldMap],
            providers: [
                {
                    provide: WorldMapDataService,
                    useValue: {
                        areas: signal(areas),
                        character,
                        currentArea,
                        availablePaths,
                        availableDestinations,
                        selectedPaths,
                        isAreaReachable: (areaId: number) =>
                            availableDestinations().some((path) => path.targetArea.id === areaId),
                        canSelectArea: (areaId: number) =>
                            availableDestinations().some((path) => path.targetArea.id === areaId),
                        selectArea: vi.fn(),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WorldMap);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows zoom and reset buttons without a percentage indicator', () => {
        expect(fixture.nativeElement.querySelectorAll('.world-map__button')).toHaveLength(3);
        expect(fixture.nativeElement.querySelector('.world-map__zoom')).toBeNull();
        const zoomOut = fixture.nativeElement.querySelector('.world-map__button');
        expect(zoomOut.getAttribute('data-tooltip')).toBe(component.i18n.text.zoomOut);
        expect(zoomOut.hasAttribute('title')).toBe(false);
    });

    it('renders only valid API locations at their map coordinates', () => {
        const markers = fixture.nativeElement.querySelectorAll('.world-map__area');
        const abandonedMines = fixture.nativeElement.querySelector(
            '.world-map__area[aria-label="Abandoned Mines"]',
        );

        expect(markers).toHaveLength(2);
        expect(abandonedMines.classList.contains('world-map__area--small')).toBe(true);
        expect(abandonedMines.style.left).toBe('14%');
        expect(abandonedMines.style.top).toBe('7%');
    });

    it('loads character 1 and renders the player marker at their area location', () => {
        const marker = fixture.nativeElement.querySelector('.world-map__player');

        expect(component.worldMapData.character()?.id).toBe(1);
        expect(marker).toBeTruthy();
        expect(marker.getAttribute('aria-label')).toBe('Krzaq');
        expect(marker.style.left).toBe('14%');
        expect(marker.style.top).toBe('7%');
    });

    it('highlights areas that are available through a travel path', () => {
        const reachableMarker = fixture.nativeElement.querySelector(
            '.world-map__area[aria-label="Reachable place"]',
        );

        expect(reachableMarker.classList.contains('world-map__area--available')).toBe(true);
    });

    it('does not highlight the current or already selected areas', () => {
        selectedPaths.set([areas[2]]);
        fixture.detectChanges();

        const currentMarker = fixture.nativeElement.querySelector(
            '.world-map__area[aria-label="Abandoned Mines"]',
        );
        const selectedMarker = fixture.nativeElement.querySelector(
            '.world-map__area[aria-label="Reachable place"]',
        );

        expect(currentMarker.classList.contains('world-map__area--available')).toBe(false);
        expect(selectedMarker.classList.contains('world-map__area--available')).toBe(false);
        expect(availableDestinations()).toHaveLength(0);
    });

    it('sizes marker hit areas according to their area type', () => {
        expect(component.getAreaMarkerClass(AreaDto.fromJS({ id: 3, name: 'Capital', type: 'CITY' })))
            .toBe('world-map__area--city');
        expect(component.getAreaMarkerClass(AreaDto.fromJS({ id: 4, name: 'Town', type: 'TOWN' })))
            .toBe('world-map__area--medium');
        expect(component.getAreaMarkerClass(AreaDto.fromJS({ id: 5, name: 'Tavern', type: 'TAVERN' })))
            .toBe('world-map__area--medium');
        expect(component.getAreaMarkerClass(AreaDto.fromJS({ id: 6, name: 'Cave', type: 'CAVE' })))
            .toBe('world-map__area--small');
    });

    it('passes a clicked area to the action handler', () => {
        const handleAreaClick = vi.spyOn(component, 'onAreaClick');
        const selectArea = vi.spyOn(component.worldMapData, 'selectArea');

        fixture.nativeElement
            .querySelector('.world-map__area[aria-label="Abandoned Mines"]')
            .click();

        expect(handleAreaClick).toHaveBeenCalledWith(areas[0]);
        expect(selectArea).toHaveBeenCalledWith(areas[0]);
    });

    it('zooms in and out within the supported range', () => {
        for (let step = 0; step < 10; step++) {
            component.zoomIn();
        }
        expect(component.zoom).toBe(3);

        for (let step = 0; step < 12; step++) {
            component.zoomOut();
        }
        expect(component.zoom).toBe(0.75);
    });

    it('allows zooming out to 75% and resets to the default view', () => {
        for (let step = 0; step < 10; step++) {
            component.zoomOut();
        }

        expect(component.zoom).toBe(0.75);

        component.resetView();

        expect(component.zoom).toBe(1);
    });

    it('resets the zoom and pan offsets', () => {
        component.zoomIn();
        component.offsetX = 80;
        component.offsetY = -40;

        component.resetView();

        expect(component.zoom).toBe(1);
        expect(component.offsetX).toBe(0);
        expect(component.offsetY).toBe(0);
    });

    it('allows panning the map at base zoom when it overflows the viewport', () => {
        const viewport = fixture.nativeElement.querySelector('.world-map__viewport');
        Object.defineProperty(viewport, 'getBoundingClientRect', {
            value: () => ({ width: 300, height: 600 }),
        });
        Object.defineProperty(viewport, 'setPointerCapture', { value: () => {} });

        component.startDragging({
            button: 0,
            clientX: 100,
            clientY: 100,
            currentTarget: viewport,
            pointerId: 1,
        } as PointerEvent);
        component.drag({
            clientX: 0,
            clientY: 100,
            currentTarget: viewport,
        } as PointerEvent);

        expect(component.canPan).toBe(true);
        expect(component.offsetX).toBe(-100);
        expect(component.offsetY).toBe(0);
    });
});
