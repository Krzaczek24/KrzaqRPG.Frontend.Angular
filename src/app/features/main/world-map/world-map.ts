import { Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

@Component({
    imports: [],
    selector: 'app-world-map',
    styleUrl: './world-map.scss',
    templateUrl: './world-map.html',
})
export class WorldMap {
    public readonly i18n = inject(I18nService);
    public zoom = MIN_ZOOM;
    public offsetX = 0;
    public offsetY = 0;
    public isDragging = false;
    private pointerX = 0;
    private pointerY = 0;
    private viewportWidth = 0;
    private viewportHeight = 0;

    public get mapTransform(): string {
        return `translate3d(${this.offsetX}px, ${this.offsetY}px, 0) scale(${this.zoom})`;
    }

    public zoomIn(): void {
        this.setZoom(this.zoom + ZOOM_STEP);
    }

    public zoomOut(): void {
        this.setZoom(this.zoom - ZOOM_STEP);
    }

    public resetView(): void {
        this.zoom = MIN_ZOOM;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    public onWheel(event: WheelEvent): void {
        event.preventDefault();
        this.setZoom(this.zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    }

    public startDragging(event: PointerEvent): void {
        if (event.button !== 0 || this.zoom === MIN_ZOOM) {
            return;
        }

        this.isDragging = true;
        this.pointerX = event.clientX;
        this.pointerY = event.clientY;
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    public drag(event: PointerEvent): void {
        if (!this.isDragging) {
            return;
        }

        const viewport = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.viewportWidth = viewport.width;
        this.viewportHeight = viewport.height;
        this.offsetX += event.clientX - this.pointerX;
        this.offsetY += event.clientY - this.pointerY;
        this.pointerX = event.clientX;
        this.pointerY = event.clientY;
        this.clampOffsets(viewport.width, viewport.height);
    }

    public stopDragging(): void {
        this.isDragging = false;
    }

    private setZoom(zoom: number): void {
        this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
        if (this.zoom === MIN_ZOOM) {
            this.offsetX = 0;
            this.offsetY = 0;
        } else if (this.viewportWidth > 0 && this.viewportHeight > 0) {
            this.clampOffsets(this.viewportWidth, this.viewportHeight);
        }
    }

    private clampOffsets(width: number, height: number): void {
        const maxX = (width * (this.zoom - MIN_ZOOM)) / 2;
        const maxY = (height * (this.zoom - MIN_ZOOM)) / 2;
        this.offsetX = Math.min(maxX, Math.max(-maxX, this.offsetX));
        this.offsetY = Math.min(maxY, Math.max(-maxY, this.offsetY));
    }
}
