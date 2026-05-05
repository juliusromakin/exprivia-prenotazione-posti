import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ElementRef,
  ViewChild,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Room, Workspace } from "@core/models";
import { TranslateModule } from "@ngx-translate/core";

interface MarkerPosition {
  id: string;
  label: string;
  tooltip: string;
  x: number;
  y: number;
  available: boolean;
  selected: boolean;
}

export interface PlanimetriaWorkspace {
  id?: number;
  name: string;
  roomId: number;
  roomName: string;
  isAvailable?: boolean;
}

@Component({
  selector: "app-planimetria-inline",
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: "./planimetria-inline.component.html",
  styleUrls: ["./planimetria-inline.component.css"],
})
export class PlanimetriaInlineComponent implements OnChanges {
  @Input() rooms: Room[] = [];
  @Input() availableWorkspaces: PlanimetriaWorkspace[] = [];
  @Input() selectedWorkspaceId: number | null = null;
  @Output() workspaceSelected = new EventEmitter<number>();

  @ViewChild("mapViewport") mapViewport!: ElementRef<HTMLDivElement>;

  markers: MarkerPosition[] = [];

  // Zoom & pan state
  scale = 1;
  readonly MIN_SCALE = 1;
  readonly MAX_SCALE = 4;
  readonly ZOOM_STEP = 0.4;
  translateX = 0;
  translateY = 0;

  // Drag state
  isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTranslateX = 0;
  private dragStartTranslateY = 0;

  get transformStyle(): string {
    return `scale(${this.scale}) translate(${this.translateX}px, ${this.translateY}px)`;
  }

  get isZoomed(): boolean {
    return this.scale > 1;
  }

  // ─── Zoom ───────────────────────────────────────────────────────────────────

  zoomIn(): void {
    const newScale = Math.min(this.scale + this.ZOOM_STEP, this.MAX_SCALE);
    this.applyZoom(newScale);
  }

  zoomOut(): void {
    const newScale = Math.max(this.scale - this.ZOOM_STEP, this.MIN_SCALE);
    this.applyZoom(newScale);
  }

  resetZoom(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? this.ZOOM_STEP : -this.ZOOM_STEP;
    const newScale = Math.min(Math.max(this.scale + delta, this.MIN_SCALE), this.MAX_SCALE);
    this.applyZoom(newScale, event);
  }

  private applyZoom(newScale: number, event?: WheelEvent): void {
    if (newScale === this.scale) return;

    if (event && this.mapViewport) {
      // Zoom dynamic based on cursor
      const rect = this.mapViewport.nativeElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - rect.width / 2;
      const mouseY = event.clientY - rect.top - rect.height / 2;

      const scaleFactor = newScale / this.scale;
      this.translateX = this.translateX + mouseX / newScale - mouseX / this.scale;
      this.translateY = this.translateY + mouseY / newScale - mouseY / this.scale;
    }

    this.scale = newScale;

    if (this.scale <= 1) {
      this.translateX = 0;
      this.translateY = 0;
    } else {
      this.clampTranslation();
    }
  }

  // ─── Pan (drag) ──────────────────────────────────────────────────────────────

  onMouseDown(event: MouseEvent): void {
    if (!this.isZoomed) return;
    if (event.button !== 0) return;
    event.preventDefault();
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartTranslateX = this.translateX;
    this.dragStartTranslateY = this.translateY;
  }

  @HostListener("document:mousemove", ["$event"])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const dx = (event.clientX - this.dragStartX) / this.scale;
    const dy = (event.clientY - this.dragStartY) / this.scale;
    this.translateX = this.dragStartTranslateX + dx;
    this.translateY = this.dragStartTranslateY + dy;
    this.clampTranslation();
  }

  @HostListener("document:mouseup")
  onMouseUp(): void {
    this.isDragging = false;
  }

  // Touch pan
  private lastTouchX = 0;
  private lastTouchY = 0;
  private lastTouchDist = 0;

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isZoomed) {
      this.isDragging = true;
      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;
      this.dragStartTranslateX = this.translateX;
      this.dragStartTranslateY = this.translateY;
    } else if (event.touches.length === 2) {
      this.lastTouchDist = this.getTouchDistance(event);
    }
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1 && this.isDragging) {
      const dx = (event.touches[0].clientX - this.lastTouchX) / this.scale;
      const dy = (event.touches[0].clientY - this.lastTouchY) / this.scale;
      this.translateX = this.dragStartTranslateX + dx;
      this.translateY = this.dragStartTranslateY + dy;
      this.clampTranslation();
    } else if (event.touches.length === 2) {
      const dist = this.getTouchDistance(event);
      const scaleDelta = (dist - this.lastTouchDist) / 200;
      const newScale = Math.min(Math.max(this.scale + scaleDelta, this.MIN_SCALE), this.MAX_SCALE);
      this.applyZoom(newScale);
      this.lastTouchDist = dist;
    }
  }

  onTouchEnd(): void {
    this.isDragging = false;
  }

  private getTouchDistance(event: TouchEvent): number {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private clampTranslation(): void {
    if (!this.mapViewport) return;
    const el = this.mapViewport.nativeElement;
    const maxX = (el.offsetWidth * (this.scale - 1)) / (2 * this.scale);
    const maxY = (el.offsetHeight * (this.scale - 1)) / (2 * this.scale);
    this.translateX = Math.max(-maxX, Math.min(maxX, this.translateX));
    this.translateY = Math.max(-maxY, Math.min(maxY, this.translateY));
  }

  // ─── Markers ─────────────────────────────────────────────────────────────────

  // Canvas dimensions used in administration for coordinate reference
  private readonly REF_WIDTH = 800;
  private readonly REF_HEIGHT = 450;

  ngOnChanges(changes: SimpleChanges): void {
    this.buildMarkers();
  }

  private buildMarkers(): void {
    this.markers = [];

    const availableMap = new Map<number, PlanimetriaWorkspace>();
    if (this.availableWorkspaces) {
      for (const w of this.availableWorkspaces) {
        if (w.id) availableMap.set(w.id, w);
      }
    }

    const workspacesToRender: any[] = [];
    if (this.rooms && this.rooms.length > 0) {
      for (const room of this.rooms) {
        if (room.workspaces) {
          for (const ws of room.workspaces) {
            workspacesToRender.push({
              ...ws,
              roomName: room.name
            });
          }
        }
      }
    } else if (this.availableWorkspaces) {
      workspacesToRender.push(...this.availableWorkspaces);
    }

    for (const ws of workspacesToRender) {
      if (ws.mapX !== undefined && ws.mapY !== undefined) {
        const w = availableMap.get(ws.id!);
        const isSelectable = !!w;

        // Offset adjusted to +5 for better alignment on the planimetria image (radius is 5 in admin)
        const centerX = ws.mapX + 5;
        const centerY = ws.mapY + 5;

        this.markers.push({
          id: String(ws.id),
          label: ws.name,
          tooltip: `${ws.name}\n${ws.roomName || ''}`,
          x: (centerX / this.REF_WIDTH) * 100,
          y: (centerY / this.REF_HEIGHT) * 100,
          available: isSelectable ? (w.isAvailable !== false) : true,
          selected: this.selectedWorkspaceId === ws.id,
        });
      }
    }
  }

  getRoomStyle(room: Room): any {
    if (room.mapX === undefined || room.mapY === undefined || room.mapWidth === undefined || room.mapHeight === undefined) {
      return { display: 'none' };
    }
    return {
      left: (room.mapX / this.REF_WIDTH * 100) + '%',
      top: (room.mapY / this.REF_HEIGHT * 100) + '%',
      width: (room.mapWidth / this.REF_WIDTH * 100) + '%',
      height: (room.mapHeight / this.REF_HEIGHT * 100) + '%',
    };
  }

  getAvailableCount(room: Room): number {
    if (!room.workspaces) return 0;
    
    // Check if availability has been calculated (isAvailable is not undefined for at least one workspace)
    const hasAvailabilityInfo = this.availableWorkspaces && this.availableWorkspaces.some(w => w.isAvailable !== undefined);
    
    if (hasAvailabilityInfo) {
      // If we have availability info, count only those that are explicitly available
      const availableIds = new Set(
        this.availableWorkspaces
          .filter(w => w.isAvailable === true)
          .map(w => w.id)
      );
      return room.workspaces.filter(ws => availableIds.has(ws.id)).length;
    }
    
    // If no availability info yet (e.g. time not selected), show total count
    return room.workspaces.length;
  }

  selectMarker(marker: MarkerPosition, event: MouseEvent): void {
    if (this.isDragging) return;
    if (!marker.available) return;
    this.markers.forEach((m) => (m.selected = false));
    marker.selected = true;
    this.workspaceSelected.emit(Number(marker.id));
  }

  getTooltipLine1(tooltip: string): string { return tooltip.split("\n")[0]; }
  getTooltipLine2(tooltip: string): string { return tooltip.split("\n")[1] || ""; }
}
