import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { ButtonComponent } from '../../shared/components/buttons/button.component';
import * as fabric from 'fabric';

export type EditorMode = 'SELECT' | 'ROOM' | 'DESK';

@Component({
    selector: 'app-amministrazione-planimetrie',
    standalone: true,
    imports: [CommonModule, RouterModule, HeaderComponent, ButtonComponent],
    templateUrl: './amministrazione-planimetrie.component.html',
    animations: [
        authAnimations.fadeIn,
        authAnimations.slideUp,
        authAnimations.scaleIn
    ]
})
export class AmministrazionePlanimetrieComponent implements OnInit {
    sedi = ['Roma', 'Milano', 'Molfetta'];
    selectedSede = '';
    isConfirmed = false;
    imageUrl: string | null = null;
    canvas: fabric.Canvas | null = null;

    currentMode: EditorMode = 'SELECT';

    private drawingRect: fabric.Rect | null = null;
    private drawOriginX = 0;
    private drawOriginY = 0;
    private isDrawing = false;
    private isDragging = false;
    private lastPosX = 0;
    private lastPosY = 0;
    private readonly GRID = 2;
    private readonly ZOOM_THRESHOLD = 1.5;

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit(): void { }

    private snap(value: number): number {
        return Math.round(value / this.GRID) * this.GRID;
    }

    setMode(mode: EditorMode): void {
        this.currentMode = mode;
        if (!this.canvas) return;
        this.canvas.selection = mode === 'SELECT';
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
    }

    onSedeChange(event: any) {
        this.selectedSede = event.target.value;
        this.isConfirmed = false;
        this.imageUrl = null;
        if (this.canvas) { this.canvas.dispose(); this.canvas = null; }
    }

    resetSede() {
        this.isConfirmed = false;
        this.imageUrl = null;
        this.selectedSede = '';
        if (this.canvas) { this.canvas.dispose(); this.canvas = null; }
    }

    onConfirm() {
        if (this.selectedSede) {
            this.isConfirmed = true;
            this.imageUrl = 'Planimetria.png';
            this.cdr.detectChanges();
            setTimeout(() => this.initCanvas(this.imageUrl!), 0);
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imageUrl = e.target.result;
                this.cdr.detectChanges();
                setTimeout(() => this.initCanvas(this.imageUrl!), 0);
            };
            reader.readAsDataURL(file);
        }
    }

    initCanvas(imageSrc: string) {
        if (this.canvas) this.canvas.dispose();

        this.canvas = new fabric.Canvas('planimetriaCanvas', {
            width: 800,
            height: 450,
            selection: true
        });

        fabric.Image.fromURL(imageSrc).then((img) => {
            if (!this.canvas) return;
            const scale = Math.min(this.canvas.width! / img.width!, this.canvas.height! / img.height!);
            img.set({
                scaleX: scale, scaleY: scale,
                originX: 'center', originY: 'center',
                left: this.canvas.width! / 2, top: this.canvas.height! / 2,
                selectable: false, evented: false
            });
            this.canvas.backgroundImage = img;
            this.canvas.renderAll();
        });

        // --- LOGICA ZOOM ---
        this.canvas.on('mouse:wheel', (opt: any) => {
            const delta = opt.e.deltaY;
            let zoom = this.canvas!.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 10) zoom = 10;
            if (zoom < 0.1) zoom = 0.1;

            this.canvas!.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
            this.updateClusteringView(zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // --- LOGICA SELEZIONE ---
        this.canvas.on('selection:created', (e) => this.handleRoomLabelVisibility(e, 1));
        this.canvas.on('selection:updated', (e) => this.handleRoomLabelVisibility(e, 1));
        this.canvas.on('selection:cleared', (e) => {
            e.deselected?.forEach((obj: any) => {
                if (obj.data?.tipo === 'stanza' && obj instanceof fabric.Group) {
                    const objects = obj.getObjects();
                    if (objects[1]) objects[1].set('opacity', 0);
                }
            });
            this.canvas?.renderAll();
        });

        // --- LOGICA MOVIMENTO ---
        this.canvas.on('mouse:down:before', (opt: any) => {
            if (opt.target) {
                (opt.target as any)._lastLeft = opt.target.left;
                (opt.target as any)._lastTop = opt.target.top;
            }
        });

        this.canvas.on('object:moving', (opt: any) => {
            const target = opt.target;
            if (!target || this.isDrawing || this.isDragging) return; // Protezione aggiuntiva

            target.set({ left: this.snap(target.left!), top: this.snap(target.top!) });

            if ((target as any).data?.tipo === 'stanza') {
                const deltaX = target.left! - (target as any)._lastLeft;
                const deltaY = target.top! - (target as any)._lastTop;

                this.canvas?.getObjects().forEach(obj => {
                    if ((obj as any).data?.tipo === 'postazione') {
                        if (target.containsPoint(new fabric.Point(obj.left!, obj.top!))) {
                            obj.set({ left: obj.left! + deltaX, top: obj.top! + deltaY });
                            obj.setCoords();
                        }
                    }
                });
                (target as any)._lastLeft = target.left;
                (target as any)._lastTop = target.top;
            }
        });

        // --- MOUSE EVENTS ---
        this.canvas.on('mouse:down', (opt: any) => {
            const pointer = this.canvas!.getPointer(opt.e);
            const x = this.snap(pointer.x);
            const y = this.snap(pointer.y);

            if (this.currentMode === 'ROOM') {
                this.isDrawing = true;
                this.drawOriginX = x;
                this.drawOriginY = y;
                this.drawingRect = new fabric.Rect({
                    left: x, top: y, width: 2, height: 2,
                    fill: 'rgba(255, 165, 0, 0.35)', stroke: 'rgba(255, 140, 0, 0.9)',
                    strokeWidth: 2, selectable: false, evented: false
                });
                this.canvas!.add(this.drawingRect);
            }
            else if (this.currentMode === 'DESK') {
                const stanza = this.canvas!.getObjects().find(obj =>
                    (obj as any).data?.tipo === 'stanza' && obj.containsPoint(new fabric.Point(x, y))
                );

                if (stanza) {
                    // Reset stati prima del prompt per evitare che fabric interpreti movimenti durante il blocco
                    this.isDragging = false;
                    this.isDrawing = false;

                    const id = prompt("ID Postazione:", "1") || "1";

                    const radius = 5;
                    const circle = new fabric.Circle({ radius, fill: 'rgba(59, 130, 246, 0.75)', stroke: '#1d4ed8', strokeWidth: 2, originX: 'center', originY: 'center' });
                    const text = new fabric.Text(id, { fontSize: 7, fill: '#fff', fontWeight: 'bold', originX: 'center', originY: 'center' });
                    const group = new fabric.Group([circle, text], { left: x - radius, top: y - radius, selectable: true });
                    (group as any).data = { tipo: 'postazione', label: id };
                    this.canvas!.add(group);

                    // Reset dopo il prompt
                    this.canvas!.discardActiveObject();
                    this.canvas!.renderAll();
                }
            }
            else if (this.currentMode === 'SELECT' && !opt.target) {
                this.isDragging = true;
                this.canvas!.selection = false;
                this.lastPosX = opt.e.clientX;
                this.lastPosY = opt.e.clientY;
            }
        });

        this.canvas.on('mouse:move', (opt: any) => {
            if (this.isDrawing && this.drawingRect) {
                const pointer = this.canvas!.getPointer(opt.e);
                const curX = this.snap(pointer.x);
                const curY = this.snap(pointer.y);
                this.drawingRect.set({
                    left: Math.min(curX, this.drawOriginX),
                    top: Math.min(curY, this.drawOriginY),
                    width: Math.abs(curX - this.drawOriginX),
                    height: Math.abs(curY - this.drawOriginY)
                });
                this.canvas!.renderAll();
            } else if (this.isDragging) {
                this.canvas!.relativePan(new fabric.Point(opt.e.clientX - this.lastPosX, opt.e.clientY - this.lastPosY));
                this.lastPosX = opt.e.clientX;
                this.lastPosY = opt.e.clientY;
            }
        });

        this.canvas.on('mouse:up', () => {
            if (this.currentMode === 'ROOM' && this.drawingRect) {
                this.isDrawing = false;
                const { left, top, width, height } = this.drawingRect;
                this.canvas!.remove(this.drawingRect);

                if (width! > 5 && height! > 5) {
                    const name = prompt("Nome Stanza:", "Stanza") || "Stanza";
                    const rect = new fabric.Rect({
                        width, height, fill: 'rgba(255, 165, 0, 0.35)',
                        stroke: 'rgba(255, 140, 0, 0.9)', strokeWidth: 2,
                        originX: 'center', originY: 'center'
                    });
                    const text = new fabric.Text(name, {
                        fontSize: 14, fill: '#fff', backgroundColor: 'rgba(0,0,0,0.6)',
                        originX: 'center', originY: 'center', opacity: 0
                    });
                    const group = new fabric.Group([rect, text], { left, top, selectable: true });
                    (group as any).data = { tipo: 'stanza', label: name };
                    this.canvas!.add(group);
                }
                this.drawingRect = null;
            }
            this.isDragging = false;
            if (this.currentMode === 'SELECT') this.canvas!.selection = true;
            this.canvas!.renderAll();
        });

        // Elimina con tasto Canc
        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.canvas) {
                const active = this.canvas.getActiveObjects();
                if (active.length) {
                    active.forEach(obj => this.canvas?.remove(obj));
                    this.canvas.discardActiveObject();
                    this.canvas.renderAll();
                }
            }
        });
    }

    private handleRoomLabelVisibility(e: any, opacity: number) {
        e.selected?.forEach((obj: any) => {
            if (obj.data?.tipo === 'stanza' && obj instanceof fabric.Group) {
                const objects = obj.getObjects();
                if (objects[1]) objects[1].set('opacity', opacity);
            }
        });
        this.canvas?.renderAll();
    }

    /**
     * Mostra/nasconde le postazioni in base al livello di zoom.
     * Zoom Out (zoom < ZOOM_THRESHOLD): le postazioni scompaiono e le stanze
     * mostrano un contatore verde con il numero di postazioni al loro interno.
     * Zoom In  (zoom >= ZOOM_THRESHOLD): le postazioni tornano visibili e il testo
     * della stanza torna allo stato originale (nome, opacity 0).
     */
    updateClusteringView(zoom: number): void {
        if (!this.canvas) return;

        const allObjects = this.canvas.getObjects();

        const stanze = allObjects.filter(
            (obj: any) => obj.data?.tipo === 'stanza' && obj instanceof fabric.Group
        ) as fabric.Group[];

        const postazioni = allObjects.filter(
            (obj: any) => obj.data?.tipo === 'postazione' && obj instanceof fabric.Group
        ) as fabric.Group[];

        const isZoomedOut = zoom < this.ZOOM_THRESHOLD;

        // ── Aggiorna visibilità postazioni ───────────────────────────────────
        postazioni.forEach((desk) => {
            desk.set({ opacity: isZoomedOut ? 0 : 1, evented: !isZoomedOut });
        });

        // ── Aggiorna label di ogni stanza ────────────────────────────────────
        stanze.forEach((room) => {
            const children = room.getObjects();
            const labelText = children[1] as fabric.Text | undefined;
            if (!labelText) return;

            if (isZoomedOut) {
                // Conta le postazioni che appartengono a questa stanza
                const count = postazioni.filter((desk) => {
                    const center = desk.getCenterPoint();
                    return room.containsPoint(center);
                }).length;

                labelText.set({
                    text: String(count),
                    fill: '#22c55e',          // verde Tailwind green-500
                    fontSize: 24,
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    opacity: 1
                });
            } else {
                // Ripristina il nome originale della stanza, tenendolo nascosto
                labelText.set({
                    text: (room as any).data?.label ?? '',
                    fill: '#ffffff',
                    fontSize: 14,
                    fontWeight: 'normal',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    opacity: 0
                });
            }
        });

        this.canvas.renderAll();
    }

    salvaDati() {
        if (!this.canvas) return;
        const data = this.canvas.getObjects().map((obj: any) => ({
            tipo: obj.data?.tipo,
            identificativo: obj.data?.label,
            x: obj.left,
            y: obj.top,
            larghezza: obj.width ? obj.width * (obj.scaleX || 1) : 0,
            altezza: obj.height ? obj.height * (obj.scaleY || 1) : 0
        }));
        console.log('Salvataggio:', data);
        alert("Dati salvati correttamente. Controlla la console.");
    }
}