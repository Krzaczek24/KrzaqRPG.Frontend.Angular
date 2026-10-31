import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorldMap } from './world-map';

describe('WorldMap', () => {
    let component: WorldMap;
    let fixture: ComponentFixture<WorldMap>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorldMap],
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
