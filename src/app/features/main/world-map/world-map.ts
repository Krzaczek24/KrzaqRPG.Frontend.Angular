import { Component, HostListener, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';

const MIN_ZOOM = 0.75;
const INITIAL_ZOOM = 1;
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
    public readonly minZoom = MIN_ZOOM;
    public zoom = INITIAL_ZOOM;
    public offsetX = 0;
    public offsetY = 0;
    public isDragging = false;
    private pointerX = 0;
    private pointerY = 0;
    private viewportWidth = 0;
    private viewportHeight = 0;
    private viewportElement: HTMLElement | null = null;

    public get canPan(): boolean {
        const { width, height } = this.getMapSize();
        return width * this.zoom > this.viewportWidth || height * this.zoom > this.viewportHeight;
    }

    public get mapTransform(): string {
        return `translate3d(${this.offsetX}px, ${this.offsetY}px, 0) translate(-50%, -50%) scale(${this.zoom})`;
    }

    public zoomIn(): void {
        this.setZoom(this.zoom + ZOOM_STEP);
    }

    public zoomOut(): void {
        this.setZoom(this.zoom - ZOOM_STEP);
    }

    public resetView(): void {
        this.zoom = INITIAL_ZOOM;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    public onWheel(event: WheelEvent): void {
        event.preventDefault();
        this.updateViewport(event.currentTarget as HTMLElement);
        this.setZoom(this.zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    }

    public startDragging(event: PointerEvent): void {
        if (event.button !== 0) {
            return;
        }

        this.updateViewport(event.currentTarget as HTMLElement);
        if (!this.canPan) {
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

        this.updateViewport(event.currentTarget as HTMLElement);
        this.offsetX += event.clientX - this.pointerX;
        this.offsetY += event.clientY - this.pointerY;
        this.pointerX = event.clientX;
        this.pointerY = event.clientY;
        this.clampOffsets();
    }

    public stopDragging(): void {
        this.isDragging = false;
    }

    @HostListener('window:resize')
    public onWindowResize(): void {
        if (this.viewportElement) {
            this.updateViewport(this.viewportElement);
        }
        if (this.viewportWidth > 0 && this.viewportHeight > 0) {
            this.clampOffsets();
        }
    }

    private setZoom(zoom: number): void {
        this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
        if (this.viewportWidth > 0 && this.viewportHeight > 0) {
            this.clampOffsets();
        }
    }

    private updateViewport(viewport: HTMLElement): void {
        this.viewportElement = viewport;
        const bounds = viewport.getBoundingClientRect();
        this.viewportWidth = bounds.width;
        this.viewportHeight = bounds.height;
    }

    private getMapSize(): { width: number; height: number } {
        const width = Math.max(this.viewportWidth, this.viewportHeight * (4 / 3));
        const height = Math.max(this.viewportHeight, this.viewportWidth * (3 / 4));
        return { width, height };
    }

    private clampOffsets(): void {
        const mapSize = this.getMapSize();
        const maxX = Math.max(0, (mapSize.width * this.zoom - this.viewportWidth) / 2);
        const maxY = Math.max(0, (mapSize.height * this.zoom - this.viewportHeight) / 2);
        this.offsetX = Math.min(maxX, Math.max(-maxX, this.offsetX));
        this.offsetY = Math.min(maxY, Math.max(-maxY, this.offsetY));
    }
}
