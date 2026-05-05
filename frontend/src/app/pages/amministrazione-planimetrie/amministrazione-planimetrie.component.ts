import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { ButtonComponent } from '../../shared/components/buttons/button.component';
import * as fabric from 'fabric';
import { lastValueFrom } from 'rxjs';
import { RoomService } from '../../core/services/room.service';
import { WorkspaceService } from '../../core/services/workspace.service';

import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export type EditorMode = 'SELECT' | 'ROOM' | 'DESK';

@Component({
    selector: 'app-amministrazione-planimetrie',
    standalone: true,
    imports: [CommonModule, RouterModule, HeaderComponent, ButtonComponent, FormsModule, TranslateModule],
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

    isSaving = false;

    showRoomModal = false;
    newRoomName = '';
    newRoomType = 'MEETING_ROOM';
    private pendingRoomRect: { left: number, top: number, width: number, height: number } | null = null;

    constructor(
        private cdr: ChangeDetectorRef,
        private roomService: RoomService,
        private workspaceService: WorkspaceService,
        private translate: TranslateService
    ) { }

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

        // --- VINCOLO SPOSTAMENTO POSTAZIONI ---
        // Quando una postazione finisce il drag:
        //  - se è dentro una stanza → aggiorna tempRoomId (supporta cambio stanza)
        //  - se è fuori da tutte le stanze → ripristina la posizione precedente
        this.canvas.on('object:modified', (opt: any) => {
            const target = opt.target;
            if (!target || (target as any).data?.tipo !== 'postazione') return;

            const center = target.getCenterPoint();
            const stanze = this.canvas!.getObjects().filter(
                (o: any) => o.data?.tipo === 'stanza'
            );

            const stanzaContenitrice = stanze.find((s: any) =>
                s.containsPoint(center)
            ) as any;

            if (stanzaContenitrice) {
                // Postazione spostata in una stanza (stessa o diversa): aggiorna il riferimento
                (target as any).data.tempRoomId = stanzaContenitrice.data?.tempId;
                console.log('[MOVE] Postazione assegnata a stanza tempId:', stanzaContenitrice.data?.tempId);
            } else {
                // Postazione fuori da qualsiasi stanza: annulla lo spostamento
                console.warn('[MOVE] Postazione fuori dalle stanze, ripristino posizione.');
                target.set({
                    left: (target as any)._lastLeft,
                    top:  (target as any)._lastTop
                });
                target.setCoords();
                this.canvas!.renderAll();
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

                    const idPrompt = this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.DESK_ID_PROMPT');
                    const id = prompt(idPrompt, "1") || "1";

                    const radius = 5;
                    const circle = new fabric.Circle({ radius, fill: 'rgba(59, 130, 246, 0.75)', stroke: '#1d4ed8', strokeWidth: 2, originX: 'center', originY: 'center' });
                    const text = new fabric.Text(id, { fontSize: 7, fill: '#fff', fontWeight: 'bold', originX: 'center', originY: 'center' });
                    const group = new fabric.Group([circle, text], { left: x - radius, top: y - radius, selectable: true });
                    (group as any).data = { tipo: 'postazione', label: id, tempRoomId: (stanza as any).data?.tempId };
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
                    this.pendingRoomRect = { left: left!, top: top!, width: width!, height: height! };
                    this.newRoomName = 'Stanza ' + (this.canvas!.getObjects().filter(o => (o as any).data?.tipo === 'stanza').length + 1);
                    this.newRoomType = 'MEETING_ROOM';
                    this.showRoomModal = true;
                    this.cdr.detectChanges();
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
                    active.forEach(obj => {
                        this.canvas?.remove(obj);

                        // Eliminazione a cascata: se l'oggetto è una stanza,
                        // rimuovi anche tutte le postazioni che vi appartengono
                        if ((obj as any).data?.tipo === 'stanza') {
                            const tempId = (obj as any).data?.tempId;
                            const postazioniDaRimuovere = this.canvas!.getObjects().filter(
                                (o: any) => o.data?.tipo === 'postazione' && o.data?.tempRoomId === tempId
                            );
                            postazioniDaRimuovere.forEach(p => this.canvas?.remove(p));
                            console.log(`[DELETE] Stanza tempId=${tempId}: rimosse ${postazioniDaRimuovere.length} postazioni.`);
                        }
                    });
                    this.canvas.discardActiveObject();
                    this.canvas.renderAll();
                }
            }
        });
    }

    confirmRoomCreation() {
        if (!this.pendingRoomRect || !this.canvas) return;

        const { left, top, width, height } = this.pendingRoomRect;
        const name = this.newRoomName || "Stanza";
        const type = this.newRoomType;

        const rect = new fabric.Rect({
            width, height, fill: 'rgba(255, 165, 0, 0.35)',
            stroke: 'rgba(255, 140, 0, 0.9)', strokeWidth: 2,
            originX: 'center', originY: 'center'
        });
        const text = new fabric.Text(name, {
            fontSize: 14, fill: '#fff', backgroundColor: 'rgba(0,0,0,0.6)',
            originX: 'center', originY: 'center', opacity: 0
        });
        const tempId = Date.now();
        const group = new fabric.Group([rect, text], { left, top, selectable: true });
        (group as any).data = { tipo: 'stanza', label: name, roomType: type, tempId };
        this.canvas.add(group);

        this.showRoomModal = false;
        this.pendingRoomRect = null;
        this.canvas.renderAll();
        this.cdr.detectChanges();
    }

    cancelRoomCreation() {
        this.showRoomModal = false;
        this.pendingRoomRect = null;
        this.cdr.detectChanges();
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

    async salvaDati(): Promise<void> {
        if (!this.canvas || this.isSaving) return;

        const allObjects = this.canvas.getObjects() as any[];

        // ── Separa stanze e postazioni ─────────────────────────────────────
        const stanzeCanvas = allObjects.filter(o => o.data?.tipo === 'stanza');
        const postazioniCanvas = allObjects.filter(o => o.data?.tipo === 'postazione');

        if (stanzeCanvas.length === 0 && postazioniCanvas.length === 0) {
            alert(this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.NO_ELEMENTS'));
            return;
        }

        // ── Calcolo dinamico capacity per ogni stanza ──────────────────────
        // Conta quante postazioni (pallini) sono contenute geometricamente in ogni stanza
        const capacityMap = new Map<number, number>(); // tempId → count
        for (const stanza of stanzeCanvas) {
            const tempId: number = stanza.data?.tempId;
            const count = postazioniCanvas.filter((postazione: any) => {
                const center = postazione.getCenterPoint();
                return stanza.containsPoint(center);
            }).length;
            capacityMap.set(tempId, count);
        }

        // ── FASE 0: Validazione pre-salvataggio ────────────────────────────
        // Blocca se una o più stanze non hanno alcuna postazione
        const stanzeVuote = stanzeCanvas.filter((s: any) => (capacityMap.get(s.data?.tempId) ?? 0) === 0);
        if (stanzeVuote.length > 0) {
            const nomi = stanzeVuote.map((s: any) => `"${s.data?.label ?? 'Senza nome'}"`).join(', ');
            alert(this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.EMPTY_ROOMS_WARNING', { rooms: nomi }));
            return;
        }

        this.isSaving = true;
        this.cdr.detectChanges();

        try {
            // ── FASE A: Salvataggio Stanze ─────────────────────────────────
            // Mappa: tempId → real backend ID
            const tempIdToRealId = new Map<number, number>();

            for (const stanza of stanzeCanvas) {
                const tempId: number = stanza.data?.tempId;
                const capacityCalcolata = capacityMap.get(tempId) ?? 1;

                const payload = {
                    name: stanza.data?.label ?? 'Stanza',
                    roomType: stanza.data?.roomType ?? 'MEETING_ROOM',
                    capacity: capacityCalcolata,    // ← calcolata dinamicamente
                    floorId: 1,                     // ← unico piano disponibile nel DB
                    enabled: true,
                    mapX: Math.round(stanza.left ?? 0),
                    mapY: Math.round(stanza.top ?? 0),
                    mapWidth: Math.round((stanza.width ?? 0) * (stanza.scaleX ?? 1)),
                    mapHeight: Math.round((stanza.height ?? 0) * (stanza.scaleY ?? 1))
                };

                console.log('[FASE A] Salvataggio stanza:', payload);
                const savedRoom = await lastValueFrom(this.roomService.createRoom(payload));
                console.log('[FASE A] Stanza salvata con id:', savedRoom.id);

                // Associa tempId → real id: garantisce la sincronizzazione nella FASE B
                if (tempId !== undefined && savedRoom.id !== undefined) {
                    tempIdToRealId.set(tempId, savedRoom.id);
                }
            }

            // ── FASE B: Salvataggio Postazioni ────────────────────────────
            for (const postazione of postazioniCanvas) {
                const tempRoomId: number | undefined = postazione.data?.tempRoomId;
                const realRoomId = tempRoomId !== undefined ? tempIdToRealId.get(tempRoomId) : undefined;

                if (realRoomId === undefined) {
                    console.warn('[FASE B] Postazione senza stanza associata, skip:', postazione.data);
                    continue;
                }

                const payload = {
                    name: postazione.data?.label ?? 'Postazione',
                    roomId: realRoomId,
                    capacity: 1,
                    enabled: true,
                    mapX: Math.round(postazione.left ?? 0),
                    mapY: Math.round(postazione.top ?? 0)
                };

                console.log('[FASE B] Salvataggio postazione:', payload);
                const savedWorkspace = await lastValueFrom(this.workspaceService.createWorkspace(payload as any));
                console.log('[FASE B] Postazione salvata con id:', savedWorkspace.id);
            }

            alert(this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.SAVE_SUCCESS', {
                roomsCount: stanzeCanvas.length,
                desksCount: postazioniCanvas.length
            }));

        } catch (error: any) {
            console.error('[SALVATAGGIO] Errore durante il salvataggio:', error);
            alert(this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.SAVE_ERROR', {
                error: error?.message ?? 'Unknown error'
            }));
        } finally {
            this.isSaving = false;
            this.cdr.detectChanges();
        }
    }
}