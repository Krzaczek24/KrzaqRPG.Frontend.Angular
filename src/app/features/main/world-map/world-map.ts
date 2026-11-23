import { Component, HostListener, inject } from '@angular/core';
import { AreaDto } from '../../../core/api/api-client';
import { I18nService } from '../../../core/i18n/i18n.service';
import { WorldMapDataService } from './world-map-data.service';
import { getWorldMapRouteWaypoints } from './world-map-routes';

const MIN_ZOOM = 0.75;
const INITIAL_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const MAX_MAP_COORDINATE = 2000;
const ROUTE_START_COLOR = [118, 80, 51] as const;
const ROUTE_END_COLOR = [223, 183, 131] as const;

@Component({
    imports: [],
    selector: 'app-world-map',
    styleUrl: './world-map.scss',
    templateUrl: './world-map.html',
})
export class WorldMap {
    public readonly i18n = inject(I18nService);
    public readonly worldMapData = inject(WorldMapDataService);
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

    public get positionedAreas(): { area: AreaDto; x: number; y: number }[] {
        return this.worldMapData.areas().flatMap((area) => {
            const position = this.getAreaPosition(area);
            return position ? [{ area, ...position }] : [];
        });
    }

    public get playerPosition(): { x: number; y: number; name: string } | null {
        const character = this.worldMapData.character();
        const area = this.worldMapData.currentArea();
        const position = area ? this.getAreaPosition(area) : null;
        if (!position || !character) {
            return null;
        }

        return {
            ...position,
            name: character.name,
        };
    }

    public get destinationPosition(): { x: number; y: number; name: string } | null {
        const area = this.worldMapData.selectedPaths().at(-1);
        const position = area ? this.getAreaPosition(area) : null;
        if (!position || !area) {
            return null;
        }

        return {
            ...position,
            name: area.name,
        };
    }

    public get routePath(): {
        d: string;
        segments: {
            id: number;
            d: string;
            start: { x: number; y: number };
            end: { x: number; y: number };
            startColor: string;
            endColor: string;
        }[];
    } | null {
        const areas = [this.worldMapData.currentArea(), ...this.worldMapData.selectedPaths()];
        const route = areas
            .flatMap((area, index) => {
                const position = area ? this.getAreaPosition(area) : null;
                if (!position || !area) {
                    return [];
                }

                const previousArea = areas[index - 1];
                const waypoints =
                    previousArea && this.getAreaPosition(previousArea)
                        ? getWorldMapRouteWaypoints(previousArea.id, area.id).map((point) => ({
                              x: (point.x * 100) / MAX_MAP_COORDINATE,
                              y: (point.y * 100) / MAX_MAP_COORDINATE,
                          }))
                        : [];

                return [...waypoints, position];
            })
            .filter(
                (point, index, points) =>
                    index === 0 ||
                    point.x !== points[index - 1].x ||
                    point.y !== points[index - 1].y,
            );

        if (route.length < 2) {
            return null;
        }

        const corners = route.slice(1, -1).map((corner, index) => {
            const previous = route[index];
            const next = route[index + 2];
            const incomingLength = Math.hypot(corner.x - previous.x, corner.y - previous.y);
            const outgoingLength = Math.hypot(next.x - corner.x, next.y - corner.y);
            const radius = Math.min(3.5, incomingLength / 2, outgoingLength / 2);
            const before = {
                x: corner.x + ((previous.x - corner.x) * radius) / incomingLength,
                y: corner.y + ((previous.y - corner.y) * radius) / incomingLength,
            };
            const after = {
                x: corner.x + ((next.x - corner.x) * radius) / outgoingLength,
                y: corner.y + ((next.y - corner.y) * radius) / outgoingLength,
            };

            return {
                before,
                after,
                middle: {
                    x: (before.x + 2 * corner.x + after.x) / 4,
                    y: (before.y + 2 * corner.y + after.y) / 4,
                },
                leftControl: {
                    x: (before.x + corner.x) / 2,
                    y: (before.y + corner.y) / 2,
                },
                rightControl: {
                    x: (corner.x + after.x) / 2,
                    y: (corner.y + after.y) / 2,
                },
            };
        });

        let path = `M ${route[0].x},${route[0].y}`;
        for (const [index, corner] of corners.entries()) {
            const point = route[index + 1];
            path += ` L ${corner.before.x},${corner.before.y} Q ${point.x},${point.y} ${corner.after.x},${corner.after.y}`;
        }

        const last = route.at(-1)!;
        const segments = route.slice(1).map((_, index) => {
            const previousCorner = index > 0 ? corners[index - 1] : null;
            const nextCorner = index < corners.length ? corners[index] : null;
            const start = previousCorner?.middle ?? route[index];
            const end = nextCorner?.middle ?? last;
            let segmentPath = `M ${start.x},${start.y}`;
            let length = 0;

            if (previousCorner) {
                segmentPath += ` Q ${previousCorner.rightControl.x},${previousCorner.rightControl.y} ${previousCorner.after.x},${previousCorner.after.y}`;
                length += this.quadraticLength(
                    previousCorner.middle,
                    previousCorner.rightControl,
                    previousCorner.after,
                );
            }

            const lineStart = previousCorner?.after ?? route[index];
            const lineEnd = nextCorner?.before ?? route[index + 1];
            segmentPath += ` L ${lineEnd.x},${lineEnd.y}`;
            length += this.routeDistance(lineStart, lineEnd);

            if (nextCorner) {
                segmentPath += ` Q ${nextCorner.leftControl.x},${nextCorner.leftControl.y} ${nextCorner.middle.x},${nextCorner.middle.y}`;
                length += this.quadraticLength(
                    nextCorner.before,
                    nextCorner.leftControl,
                    nextCorner.middle,
                );
            }

            return { id: index, d: segmentPath, start, end, length };
        });
        const totalLength = segments.reduce((total, segment) => total + segment.length, 0);
        if (totalLength === 0) {
            return null;
        }
        let traveledLength = 0;
        const coloredSegments = segments.map((segment) => {
            const startColor = this.routeColor(traveledLength / totalLength);
            traveledLength += segment.length;
            const endColor = this.routeColor(traveledLength / totalLength);
            return {
                id: segment.id,
                d: segment.d,
                start: segment.start,
                end: segment.end,
                startColor,
                endColor,
            };
        });

        return {
            d: `${path} L ${last.x},${last.y}`,
            segments: coloredSegments,
        };
    }

    public getAreaMarkerClass(area: AreaDto): string {
        switch (area.type?.toUpperCase()) {
            case 'CITY':
                return 'world-map__area--extra-large';
            case 'TOWN':
            case 'TAVERN':
            case 'VILLAGE':
                return 'world-map__area--large';
            case 'ENCAMPMENT':
            case 'RUINS':
            case 'MINES':
                return 'world-map__area--medium';
            default:
                return 'world-map__area--small';
        }
    }

    public onAreaClick(_area: AreaDto): void {
        this.worldMapData.selectArea(_area);
    }

    private getAreaPosition(area: AreaDto): { x: number; y: number } | null {
        const x = area.coordinates?.x;
        const y = area.coordinates?.y;
        if (
            typeof x !== 'number' ||
            !Number.isFinite(x) ||
            x < 0 ||
            x > MAX_MAP_COORDINATE ||
            typeof y !== 'number' ||
            !Number.isFinite(y) ||
            y < 0 ||
            y > MAX_MAP_COORDINATE
        ) {
            return null;
        }

        return {
            x: (x * 100) / MAX_MAP_COORDINATE,
            y: (y * 100) / MAX_MAP_COORDINATE,
        };
    }

    private routeColor(progress: number): string {
        const channels = ROUTE_START_COLOR.map((start, index) =>
            Math.round(start + (ROUTE_END_COLOR[index] - start) * progress)
                .toString(16)
                .padStart(2, '0'),
        );
        return `#${channels.join('')}`;
    }

    private routeDistance(start: { x: number; y: number }, end: { x: number; y: number }): number {
        return Math.hypot(((end.x - start.x) * 4) / 3, end.y - start.y);
    }

    private quadraticLength(
        start: { x: number; y: number },
        control: { x: number; y: number },
        end: { x: number; y: number },
    ): number {
        const steps = 12;
        let length = 0;
        let previous = start;

        for (let step = 1; step <= steps; step++) {
            const t = step / steps;
            const point = {
                x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
                y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
            };
            length += this.routeDistance(previous, point);
            previous = point;
        }

        return length;
    }

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
