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

interface MarkerPosition {
  id: string;
  label: string;
  tooltip: string;
  x: number;
  y: number;
  available: boolean;
  selected: boolean;
}

@Component({
  selector: "app-planimetria-inline",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./planimetria-inline.component.html",
  styleUrls: ["./planimetria-inline.component.css"],
})
export class PlanimetriaInlineComponent implements OnChanges {
  @Input() postazioniDisponibili: { id_postazione: number; nomePostazione: string; stanza_id: number; stanza_nome: string; isAvailable?: boolean }[] = [];
  @Input() selectedPostazioneId: number | null = null;
  @Output() postazioneSelected = new EventEmitter<number>();

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
      // Zoom centrato sul cursore del mouse
      const rect = this.mapViewport.nativeElement.getBoundingClientRect();
      const mouseX = event.clientX - rect.left - rect.width / 2;
      const mouseY = event.clientY - rect.top - rect.height / 2;

      const scaleFactor = newScale / this.scale;
      this.translateX = mouseX / this.scale + this.translateX - mouseX / newScale;
      this.translateY = mouseY / this.scale + this.translateY - mouseY / newScale;
    }

    this.scale = newScale;

    // Quando si torna a scale=1 resetta la traslazione
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
    // Solo tasto sinistro
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
      // Pinch start
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

  private coordinatePostazioni: { id: number; x: number; y: number; label: string }[] = [
    { id: 1,  x: 33.1,  y: 26.2, label: "Gastone" },
    { id: 2,  x: 14.25, y: 30.7, label: "Leonardo" },
    { id: 3,  x: 43.8,  y: 24.6, label: "3" },
    { id: 4,  x: 46.4,  y: 21.5, label: "4" },
    { id: 5,  x: 46.4,  y: 28.5, label: "5" },
    { id: 11, x: 40.2,  y: 62.6, label: "11" },
    { id: 12, x: 40.3,  y: 58.4, label: "12" },
    { id: 13, x: 42,    y: 58.7, label: "13" },
    { id: 14, x: 41.8,  y: 62.5, label: "14" },
    { id: 20, x: 31.3,  y: 65.8, label: "20" },
    { id: 21, x: 31.3,  y: 59.8, label: "21" },
    { id: 22, x: 34.7,  y: 60.4, label: "22" },
    { id: 23, x: 34.3,  y: 64.0, label: "23" },
    { id: 36, x: 2.25,  y: 56.3, label: "36" },
    { id: 43, x: 2.25,  y: 29.6, label: "43" },
    { id: 44, x: 2.25,  y: 32.9, label: "44" },
    { id: 45, x: 5.25,  y: 34.7, label: "45" },
    { id: 49, x: 2.25,  y: 12.5, label: "49" },
    { id: 50, x: 2.25,  y: 15.5, label: "50" },
    { id: 51, x: 5.25,  y: 13.0, label: "51" },
    { id: 52, x: 2.25,  y: 4.6,  label: "52" },
    { id: 53, x: 6.26,  y: 3.9,  label: "53" },
    { id: 54, x: 6.25,  y: 7.4,  label: "54" },
    { id: 55, x: 2.25,  y: 7.6,  label: "55" },
    { id: 56, x: 11.3,  y: 5,    label: "56" },
    { id: 57, x: 13.40, y: 5,    label: "57" },
    { id: 58, x: 11.3,  y: 11,   label: "58" },
    { id: 61, x: 19.9,  y: 80.9, label: "Keplero" },
    { id: 66, x: 20.8,  y: 37.5, label: "66" },
    { id: 67, x: 22.3,  y: 43.2, label: "67" },
    { id: 68, x: 22.2,  y: 48.8, label: "68" },
    { id: 24, x: 11.8,  y: 62.7, label: "24" },
    { id: 25, x: 14.2,  y: 62.7, label: "25" },
    { id: 26, x: 16.7,  y: 62.7, label: "26" },
    { id: 27, x: 16.5,  y: 68.7, label: "27" },
    { id: 28, x: 14.14, y: 68.7, label: "28" },
    { id: 29, x: 11.6,  y: 68.7, label: "29" },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    this.buildMarkers();
  }

  private buildMarkers(): void {
    this.markers = [];
    const disponibiliMap = new Map<number, { nomePostazione: string; stanza_nome: string; isAvailable?: boolean }>();
    for (const p of this.postazioniDisponibili) {
      disponibiliMap.set(p.id_postazione, p);
    }
    for (const coord of this.coordinatePostazioni) {
      if (!disponibiliMap.has(coord.id)) continue;
      const p = disponibiliMap.get(coord.id)!;
      this.markers.push({
        id: String(coord.id),
        label: coord.label,
        tooltip: `${p.nomePostazione}\n${p.stanza_nome}`,
        x: coord.x,
        y: coord.y,
        available: p.isAvailable !== false,
        selected: this.selectedPostazioneId === coord.id,
      });
    }
  }

  selezionaMarker(marker: MarkerPosition, event: MouseEvent): void {
    // Ignora il click se era un drag
    if (this.isDragging) return;
    if (!marker.available) return;
    this.markers.forEach((m) => (m.selected = false));
    marker.selected = true;
    this.postazioneSelected.emit(Number(marker.id));
  }

  getTooltipLine1(tooltip: string): string { return tooltip.split("\n")[0]; }
  getTooltipLine2(tooltip: string): string { return tooltip.split("\n")[1] || ""; }
}
