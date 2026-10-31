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

    it('zooms in and out within the supported range', () => {
        for (let step = 0; step < 10; step++) {
            component.zoomIn();
        }
        expect(component.zoom).toBe(3);

        for (let step = 0; step < 12; step++) {
            component.zoomOut();
        }
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
});
