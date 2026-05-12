import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { ButtonComponent } from '../../shared/components/buttons/button.component';
import * as fabric from 'fabric';
import { lastValueFrom } from 'rxjs';
import { RoomService } from '../../core/services/room.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { PlanimetriaService, Planimetria, FloorDTO } from '../../core/services/planimetria.service';

import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

export type EditorMode = 'SELECT' | 'ROOM' | 'DESK';

@Component({
    selector: 'app-amministrazione-planimetrie',
    standalone: true,
    imports: [
        CommonModule, RouterModule, HeaderComponent, ButtonComponent, FormsModule, LucideAngularModule, TranslateModule,
        MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule, MatCheckboxModule
    ],
    templateUrl: './amministrazione-planimetrie.component.html',
    styleUrl: './amministrazione-planimetrie.component.css',
    animations: [
        authAnimations.fadeIn,
        authAnimations.slideUp,
        authAnimations.scaleIn
    ]
})
export class AmministrazionePlanimetrieComponent implements OnInit {
    imageUrl: string | null = null;
    canvas: fabric.Canvas | null = null;

    currentMode: EditorMode = 'SELECT';

    // Date validità planimetria
    validFrom: Date | null = null;
    validTo: Date | null = null;
    fineIndeterminata = false;

    // Modale validità (mostrato al click su Salva)
    showValiditaModal = false;
    validitaError = false;

    // Modale selezione planimetria esistente
    showPlanimetriaModal = false;
    listaPiani: Planimetria[] = [];
    isLoadingPlanimetrie = false;
    selectedFloorId: number | null = null;
    selectedFloorPlanId: number | null = null;

    // Contesto passato da Gestione Sedi
    contextProvided = false;
    locationId: number | null = null;
    buildingId: number | null = null;
    selectedFloor: number | null = null;
    locationName = '';
    buildingName = '';

    // Dettagli stanza selezionata per il pannello laterale
    stanzaSelezionata: any = null;

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
    equipmentOptions = ['Proiettore', 'Monitor', 'Mouse', 'Tastiera', 'Altro'];
    newRoomEquipment: { type: string, quantity: number, customName?: string }[] = [];
    private pendingRoomRect: { left: number, top: number, width: number, height: number } | null = null;

    // Modale per ID Postazione
    showDeskPromptModal = false;
    newDeskId = '1';
    pendingDeskParams: { x: number, y: number, tempRoomId: number } | null = null;

    // Custom Alert Modal
    alertModal = {
        show: false,
        title: '',
        message: '',
        type: 'error' as 'error' | 'success' | 'warning'
    };

    showAlert(title: string, message: string, type: 'error' | 'success' | 'warning' = 'error'): void {
        this.alertModal = { show: true, title, message, type };
        this.cdr.detectChanges();
    }

    closeAlert(): void {
        this.alertModal.show = false;
        this.cdr.detectChanges();
    }

    constructor(
        private cdr: ChangeDetectorRef,
        private roomService: RoomService,
        private workspaceService: WorkspaceService,
        private planimetriaService: PlanimetriaService,
        private translate: TranslateService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['locationId'] && params['buildingId'] && params['floor']) {
                this.contextProvided = true;
                this.locationId = +params['locationId'];
                this.buildingId = +params['buildingId'];
                this.selectedFloor = +params['floor'];
                this.locationName = params['locationName'] || '';
                this.buildingName = params['buildingName'] || '';

                // Inizializza il canvas con l'immagine di default
                this.imageUrl = 'Planimetria.png';
                this.cdr.detectChanges();
                setTimeout(() => this.initCanvas(this.imageUrl!), 0);
            }
        });
    }

    // ── Utilità date ───────────────────────────────────────────────────────
    parseTypedDate(value: any): Date | null {
        if (!value) return null;

        // Se è già un oggetto Date, verifichiamo che sia valido
        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : value;
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return null;

            // Formato italiano: dd/MM/yyyy o dd-MM-yyyy
            const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
            const matchDmy = trimmed.match(dmyRegex);
            if (matchDmy) {
                const day = parseInt(matchDmy[1], 10);
                const month = parseInt(matchDmy[2], 10) - 1; // Mese 0-index in JS
                const year = parseInt(matchDmy[3], 10);
                const parsedDate = new Date(year, month, day);
                if (parsedDate.getFullYear() === year && parsedDate.getMonth() === month && parsedDate.getDate() === day) {
                    return parsedDate;
                }
            }

            // Formato ISO: yyyy-MM-dd
            const ymdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
            const matchYmd = trimmed.match(ymdRegex);
            if (matchYmd) {
                const year = parseInt(matchYmd[1], 10);
                const month = parseInt(matchYmd[2], 10) - 1;
                const day = parseInt(matchYmd[3], 10);
                const parsedDate = new Date(year, month, day);
                if (parsedDate.getFullYear() === year && parsedDate.getMonth() === month && parsedDate.getDate() === day) {
                    return parsedDate;
                }
            }

            // Fallback: parsing nativo Date
            const timestamp = Date.parse(trimmed);
            if (!isNaN(timestamp)) {
                return new Date(timestamp);
            }
        }

        return null;
    }

    private formatDateYMD(date: any): string | null {
        const parsed = this.parseTypedDate(date);
        if (!parsed) return null;
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    formattaPianimetria(p: Planimetria): string {
        const piano = p.floorName || 'Piano';
        const daObj = this.parseTypedDate(p.validFrom);
        const aObj = this.parseTypedDate(p.validTo);
        const da = daObj ? daObj.toLocaleDateString('it-IT') : '?';
        const a = aObj ? aObj.toLocaleDateString('it-IT') : 'Indeterminata';
        return `${piano}  ·  ${da} → ${a}`;
    }

    formattaPlanimetria(p: any): string {
        return this.formattaPianimetria(p);
    }

    onFineIndeterminataChange(): void {
        if (this.fineIndeterminata) {
            this.validTo = null;
        }
    }

    // ── Modale validità ────────────────────────────────────────────────────
    apriModaleValidita(): void {
        this.validitaError = false;
        this.showValiditaModal = true;
        this.cdr.detectChanges();
    }

    annullaValidita(): void {
        this.showValiditaModal = false;
        this.cdr.detectChanges();
    }

    async confermaSalvataggio(): Promise<void> {
        const fromDate = this.parseTypedDate(this.validFrom);
        if (!fromDate) {
            this.validitaError = true;
            this.cdr.detectChanges();
            return;
        }

        // Aggiorna il modello con l'oggetto Date corretto in locale
        this.validFrom = fromDate;

        if (!this.fineIndeterminata) {
            const toDate = this.parseTypedDate(this.validTo);
            if (!toDate) {
                this.showAlert('Data Fine Non Valida', 'La Data Fine inserita non è valida o è vuota. Seleziona "Fine indeterminata" se non c\'è una data di fine.');
                return;
            }
            if (toDate < fromDate) {
                this.showAlert('Periodo Non Valido', 'La Data Fine deve essere successiva o uguale alla Data Inizio.');
                return;
            }
            this.validTo = toDate;
        } else {
            this.validTo = null;
        }

        this.validitaError = false;
        this.showValiditaModal = false;
        this.cdr.detectChanges();
        await this.eseguiSalvataggio();
    }

    // ── Modale selezione planimetria ───────────────────────────────────────
    apriModalePlanimetria(): void {
        if (this.buildingId === null) {
            this.showAlert('Contesto Mancante', 'Impossibile caricare le planimetrie: ID edificio non disponibile.');
            return;
        }

        this.isLoadingPlanimetrie = true;
        this.showPlanimetriaModal = true;
        this.cdr.detectChanges();

        // Usa il nuovo endpoint che restituisce direttamente tutti i FloorPlan con nome piano e date
        this.planimetriaService.getAllPlansByBuilding(this.buildingId).subscribe({
            next: (lista) => {
                this.listaPiani = lista;
                this.isLoadingPlanimetrie = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoadingPlanimetrie = false;
                this.cdr.detectChanges();
            }
        });
    }

    chiudiModalePlanimetria(): void {
        this.showPlanimetriaModal = false;
        this.cdr.detectChanges();
    }

    selezionaPlanimetria(piano: Planimetria): void {
        this.showPlanimetriaModal = false;
        this.selectedFloorId = piano.floorId ?? null;
        this.selectedFloorPlanId = piano.id ?? null;

        if (!piano.id) return;

        // Il FloorPlan è già completo (rooms + workspaces inclusi), lo usiamo direttamente
        console.log('[Planimetria] Caricamento diretto FloorPlan:', piano);

        if (piano.validFrom) {
            this.validFrom = this.parseTypedDate(piano.validFrom);
        } else {
            this.validFrom = null;
        }
        if (piano.validTo) {
            this.validTo = this.parseTypedDate(piano.validTo);
            this.fineIndeterminata = false;
        } else {
            this.validTo = null;
            this.fineIndeterminata = true;
        }

        this.imageUrl = piano.imagePath || 'Planimetria.png';
        this.cdr.detectChanges();

        // Recupera il FloorDTO del piano per avere i dati logici (nomi stanze, tipi ecc.)
        this.planimetriaService.getPlanimetrieByEdificio(this.buildingId!).subscribe({
            next: (floors) => {
                const floor = floors.find((f: FloorDTO) => f.id === piano.floorId) ?? { id: piano.floorId, rooms: [], workspaces: [] };
                setTimeout(() => {
                    this.initCanvas(this.imageUrl!);
                    setTimeout(() => {
                        const hasPosizioni = (piano.rooms && piano.rooms.length > 0) || (piano.workspaces && piano.workspaces.length > 0);
                        if (!hasPosizioni && floor.rooms && floor.rooms.length > 0) {
                            console.warn('[Planimetria] Pianimetria vuota, uso fallback dal FloorDTO');
                            this.caricaPlanimetriaSelezionata(floor, this.buildPianoDaFloorDTO(floor));
                        } else {
                            this.caricaPlanimetriaSelezionata(floor, piano);
                        }
                    }, 150);
                }, 0);
            },
            error: () => {
                // Nessun floor logico trovato: disegna comunque con i dati spaziali
                setTimeout(() => {
                    this.initCanvas(this.imageUrl!);
                    setTimeout(() => this.caricaPlanimetriaSelezionata({}, piano), 150);
                }, 0);
            }
        });
    }

    /** Costruisce un Planimetria "di default" usando le stanze logiche del FloorDTO */
    private buildPianoDaFloorDTO(floor: FloorDTO): Planimetria {
        const rooms = floor.rooms ?? [];
        const cols = Math.ceil(Math.sqrt(rooms.length)) || 1;
        const cellW = 160;
        const cellH = 120;
        const padX = 50;
        const padY = 50;

        const roomPositions: any[] = rooms.map((r: any, i: number) => ({
            roomId: r.id,
            mapX: padX + (i % cols) * (cellW + 20),
            mapY: padY + Math.floor(i / cols) * (cellH + 20),
            mapWidth: cellW,
            mapHeight: cellH
        }));

        const wsPositions: any[] = (floor.workspaces ?? []).map((ws: any) => {
            const rPos = roomPositions.find(rp => rp.roomId === ws.roomId);
            return {
                workspaceId: ws.id,
                mapX: rPos ? rPos.mapX + rPos.mapWidth / 2 : 100,
                mapY: rPos ? rPos.mapY + rPos.mapHeight / 2 : 100
            };
        });

        return { rooms: roomPositions, workspaces: wsPositions };
    }

    private caricaPlanimetriaSelezionata(floor: FloorDTO, plan: Planimetria): void {
        if (!this.canvas) return;

        // Rimuovi solo gli oggetti utente, non il background
        const toRemove = this.canvas.getObjects().filter(
            (o: any) => o.data?.tipo === 'stanza' || o.data?.tipo === 'postazione'
        );
        toRemove.forEach(o => this.canvas!.remove(o));

        const desennaOggetti = () => {
            if (!this.canvas) return;
            const idMap = new Map<number, number>();

            if (plan.rooms) {
                plan.rooms.forEach(pos => {
                    const room = floor?.rooms?.find((r: any) => r.id === pos.roomId);

                    const left = pos.mapX;
                    const top = pos.mapY;
                    const width = pos.mapWidth;
                    const height = pos.mapHeight;
                    const name = room?.name ?? `Stanza ${pos.roomId}`;
                    const type = room?.roomType ?? 'MEETING_ROOM';
                    const equipment = room?.equipment ?? [];
                    const roomId = room?.id ?? pos.roomId;

                    const centerX = left + width / 2;
                    const centerY = top + height / 2;

                    const rect = new fabric.Rect({
                        width, height,
                        fill: 'rgba(255, 165, 0, 0.35)',
                        stroke: 'rgba(255, 140, 0, 0.9)',
                        strokeWidth: 2,
                        originX: 'center', originY: 'center'
                    });
                    const text = new fabric.Text(name, {
                        fontSize: 14, fill: '#fff',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        originX: 'center', originY: 'center',
                        opacity: 0
                    });

                    const group = new fabric.Group([rect, text], {
                        left: centerX, top: centerY,
                        originX: 'center', originY: 'center',
                        selectable: this.currentMode === 'SELECT'
                    });

                    (group as any).data = {
                        tipo: 'stanza',
                        label: name,
                        roomType: type,
                        tempId: roomId,
                        id: roomId,
                        equipment
                    };

                    this.canvas!.add(group);
                    group.setCoords();
                    idMap.set(roomId, roomId);
                });
            }

            if (plan.workspaces) {
                plan.workspaces.forEach(pos => {
                    const ws = floor?.workspaces?.find((w: any) => w.id === pos.workspaceId);

                    const x = pos.mapX;
                    const y = pos.mapY;
                    const label = ws?.name ?? `P${pos.workspaceId}`;
                    const tempRoomId = ws?.roomId ?? null;

                    // Determina il tipo di stanza per la forma dell'ellisse
                    const stanzaContenitorePlan = this.canvas!.getObjects().find(
                        (o: any) => o.data?.tipo === 'stanza' && o.containsPoint(new fabric.Point(x, y))
                    ) as any;
                    const roomTypePlan = stanzaContenitorePlan?.data?.roomType ?? 'MEETING_ROOM';
                    const isMeetingPlan = roomTypePlan === 'MEETING_ROOM';

                    const ellipse = new fabric.Ellipse({
                        rx: isMeetingPlan ? 18 : 5,
                        ry: isMeetingPlan ? 10 : 5,
                        fill: 'rgba(59, 130, 246, 0.75)',
                        stroke: '#1d4ed8',
                        strokeWidth: 2,
                        originX: 'center', originY: 'center'
                    });
                    const textDesk = new fabric.Text(label, {
                        fontSize: isMeetingPlan ? 8 : 7, fill: '#fff',
                        fontWeight: 'bold',
                        originX: 'center', originY: 'center'
                    });
                    const groupDesk = new fabric.Group([ellipse, textDesk], {
                        left: x, top: y,
                        originX: 'center', originY: 'center',
                        selectable: this.currentMode === 'SELECT'
                    });

                    (groupDesk as any).data = {
                        tipo: 'postazione',
                        label,
                        tempRoomId,
                        id: ws?.id ?? pos.workspaceId
                    };

                    this.canvas!.add(groupDesk);
                    groupDesk.setCoords();
                });
            }

            this.canvas.renderAll();
            this.cdr.detectChanges();
        };

        // Carica il background image e disegna gli oggetti nel callback
        fabric.Image.fromURL(this.imageUrl || 'Planimetria.png').then((img) => {
            if (!this.canvas) return;
            img.set({
                scaleX: this.canvas.width! / img.width!,
                scaleY: this.canvas.height! / img.height!,
                originX: 'left', originY: 'top',
                left: 0, top: 0,
                selectable: false, evented: false
            });
            this.canvas.backgroundImage = img;
            desennaOggetti();
        }).catch(() => {
            // L'immagine di sfondo non è disponibile, ma disegniamo comunque gli oggetti
            desennaOggetti();
        });
    }

    // ── Canvas ─────────────────────────────────────────────────────────────
    private snap(value: number): number {
        return Math.round(value / this.GRID) * this.GRID;
    }

    setMode(mode: EditorMode): void {
        this.currentMode = mode;
        if (!this.canvas) return;
        this.canvas.selection = mode === 'SELECT';

        if (mode !== 'SELECT') {
            this.stanzaSelezionata = null;
        }

        this.canvas.getObjects().forEach(obj => {
            if ((obj as any).data?.tipo === 'stanza' || (obj as any).data?.tipo === 'postazione') {
                obj.set('selectable', mode === 'SELECT');
            }
        });

        this.canvas.discardActiveObject();
        this.canvas.renderAll();
    }

    onConfirm() {
        this.imageUrl = 'Planimetria.png';
        this.cdr.detectChanges();
        setTimeout(() => this.initCanvas(this.imageUrl!), 0);
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
            img.set({
                scaleX: this.canvas.width! / img.width!,
                scaleY: this.canvas.height! / img.height!,
                originX: 'left', originY: 'top',
                left: 0, top: 0,
                selectable: false, evented: false
            });
            this.canvas.backgroundImage = img;
            this.canvas.renderAll();
        });

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

        this.canvas.on('selection:created', (e) => this.handleRoomLabelVisibility(e, 1));
        this.canvas.on('selection:updated', (e) => this.handleRoomLabelVisibility(e, 1));
        this.canvas.on('selection:cleared', (e) => {
            this.stanzaSelezionata = null;
            e.deselected?.forEach((obj: any) => {
                if (obj.data?.tipo === 'stanza' && obj instanceof fabric.Group) {
                    const objects = obj.getObjects();
                    if (objects[1]) objects[1].set('opacity', 0);
                }
            });
            this.cdr.detectChanges();
            this.canvas?.renderAll();
        });

        this.canvas.on('mouse:down:before', (opt: any) => {
            if (opt.target) {
                (opt.target as any)._lastLeft = opt.target.left;
                (opt.target as any)._lastTop = opt.target.top;
            }
        });

        this.canvas.on('object:moving', (opt: any) => {
            const target = opt.target;
            if (!target || this.isDrawing || this.isDragging) return;
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

        this.canvas.on('object:modified', (opt: any) => {
            const target = opt.target;
            if (!target || (target as any).data?.tipo !== 'postazione') return;
            const center = target.getCenterPoint();
            const stanze = this.canvas!.getObjects().filter((o: any) => o.data?.tipo === 'stanza');
            const stanzaContenitrice = stanze.find((s: any) => s.containsPoint(center)) as any;
            if (stanzaContenitrice) {
                (target as any).data.tempRoomId = stanzaContenitrice.data?.tempId;
                // Aggiorna forma ellisse in base al tipo della nuova stanza
                const isMeeting = stanzaContenitrice.data?.roomType === 'MEETING_ROOM';
                const ellipseObj = (target as fabric.Group).getObjects()[0] as any;
                if (ellipseObj && ellipseObj.set) {
                    ellipseObj.set({ rx: isMeeting ? 18 : 5, ry: isMeeting ? 10 : 5 });
                    target.set('dirty', true);
                    target.setCoords();
                }
                this.canvas!.renderAll();
            } else {
                target.set({ left: (target as any)._lastLeft, top: (target as any)._lastTop });
                target.setCoords();
                this.canvas!.renderAll();
            }
        });

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
                    originX: 'left', originY: 'top',
                    fill: 'rgba(255, 165, 0, 0.35)', stroke: 'rgba(255, 140, 0, 0.9)',
                    strokeWidth: 2, selectable: false, evented: false
                });
                this.canvas!.add(this.drawingRect);
            } else if (this.currentMode === 'DESK') {
                const stanza = this.canvas!.getObjects().find(obj =>
                    (obj as any).data?.tipo === 'stanza' && obj.containsPoint(new fabric.Point(x, y))
                );
                if (stanza) {
                    this.isDragging = false;
                    this.isDrawing = false;
                    this.pendingDeskParams = { x, y, tempRoomId: (stanza as any).data?.tempId };
                    this.newDeskId = this.getNextDeskId((stanza as any).data?.tempId);
                    this.showDeskPromptModal = true;
                    this.cdr.detectChanges();
                }
            } else if (this.currentMode === 'SELECT' && !opt.target) {
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
                    this.newRoomEquipment = [];
                    this.showRoomModal = true;
                    this.cdr.detectChanges();
                }
                this.drawingRect = null;
            }
            this.isDragging = false;
            if (this.currentMode === 'SELECT') this.canvas!.selection = true;
            this.canvas!.renderAll();
        });

        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.canvas) {
                const active = this.canvas.getActiveObjects();
                if (active.length) {
                    active.forEach(obj => {
                        this.canvas?.remove(obj);
                        if ((obj as any).data?.tipo === 'stanza') {
                            const tempId = (obj as any).data?.tempId;
                            const postazioniDaRimuovere = this.canvas!.getObjects().filter(
                                (o: any) => o.data?.tipo === 'postazione' && o.data?.tempRoomId === tempId
                            );
                            postazioniDaRimuovere.forEach(p => this.canvas?.remove(p));
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
        const equipment = this.newRoomType === 'MEETING_ROOM'
            ? this.newRoomEquipment.map(eq => ({
                type: eq.type,
                customName: eq.customName,
                name: eq.type === 'Altro' ? (eq.customName || 'Altro') : eq.type,
                quantity: eq.quantity || 1
            }))
            : [];
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const rect = new fabric.Rect({ width, height, fill: 'rgba(255, 165, 0, 0.35)', stroke: 'rgba(255, 140, 0, 0.9)', strokeWidth: 2, originX: 'center', originY: 'center' });
        const text = new fabric.Text(name, { fontSize: 14, fill: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', originX: 'center', originY: 'center', opacity: 0 });
        const tempId = Date.now();
        const group = new fabric.Group([rect, text], {
            left: centerX, top: centerY,
            originX: 'center', originY: 'center',
            selectable: this.currentMode === 'SELECT'
        });
        (group as any).data = { tipo: 'stanza', label: name, roomType: type, tempId, equipment };
        this.canvas.add(group);
        group.setCoords();

        // Creazione automatica di una postazione base per le Meeting Room
        if (type === 'MEETING_ROOM') {
            this.pendingDeskParams = { x: centerX, y: centerY, tempRoomId: tempId };
            this.newDeskId = "1";
            this.showDeskPromptModal = true;
            this.cdr.detectChanges();
        }

        this.showRoomModal = false;
        this.pendingRoomRect = null;
        this.canvas.renderAll();
        this.cdr.detectChanges();
    }

    cancelRoomCreation() {
        this.showRoomModal = false;
        this.pendingRoomRect = null;
        this.newRoomEquipment = [];
        this.cdr.detectChanges();
    }

    getNextDeskId(tempRoomId: number): string {
        if (!this.canvas) return "1";
        const postazioni = this.canvas.getObjects().filter((o: any) => o.data?.tipo === 'postazione' && o.data?.tempRoomId === tempRoomId);
        return String(postazioni.length + 1);
    }

    confirmDeskPrompt() {
        if (!this.pendingDeskParams || !this.newDeskId.trim()) return;
        const { x, y, tempRoomId } = this.pendingDeskParams;
        const id = this.newDeskId.trim();

        // Determina il tipo di stanza tramite tempRoomId per scegliere la forma
        const stanzaRef = this.canvas!.getObjects().find(
            (o: any) => o.data?.tipo === 'stanza' && o.data?.tempId === tempRoomId
        ) as any;
        const isMeeting = stanzaRef?.data?.roomType === 'MEETING_ROOM';

        const ellipse = new fabric.Ellipse({
            rx: isMeeting ? 18 : 5,
            ry: isMeeting ? 10 : 5,
            fill: 'rgba(59, 130, 246, 0.75)', stroke: '#1d4ed8', strokeWidth: 2, originX: 'center', originY: 'center'
        });
        const textDesk = new fabric.Text(id, { fontSize: isMeeting ? 8 : 7, fill: '#fff', fontWeight: 'bold', originX: 'center', originY: 'center' });
        const groupDesk = new fabric.Group([ellipse, textDesk], {
            left: x, top: y,
            originX: 'center', originY: 'center',
            selectable: this.currentMode === 'SELECT'
        });
        (groupDesk as any).data = { tipo: 'postazione', label: id, tempRoomId };
        this.canvas!.add(groupDesk);
        groupDesk.setCoords();

        this.closeDeskPrompt();
        this.canvas!.discardActiveObject();
        this.canvas!.renderAll();
    }

    closeDeskPrompt() {
        this.showDeskPromptModal = false;
        this.pendingDeskParams = null;
        this.newDeskId = '1';
        this.cdr.detectChanges();
    }

    addEquipment() {
        const availableOptions = this.getFilteredEquipmentOptions(-1);
        if (availableOptions.length > 0) {
            const nextType = availableOptions.find(opt => opt !== 'Altro') || 'Altro';
            this.newRoomEquipment.push({ type: nextType, quantity: 1 });
        }
    }

    getFilteredEquipmentOptions(index: number): string[] {
        return this.equipmentOptions.filter(opt => {
            if (opt === 'Altro') return true;
            return !this.newRoomEquipment.some((eq, i) => i !== index && eq.type === opt);
        });
    }

    removeEquipment(index: number) {
        this.newRoomEquipment.splice(index, 1);
    }

    private handleRoomLabelVisibility(e: any, opacity: number) {
        if (this.currentMode === 'SELECT') {
            if (e.selected?.length === 1 && e.selected[0].data?.tipo === 'stanza') {
                this.stanzaSelezionata = { ...e.selected[0].data };
            } else if (opacity === 0 || !e.selected || e.selected.length > 1) {
                this.stanzaSelezionata = null;
            }
        }

        e.selected?.forEach((obj: any) => {
            if (obj.data?.tipo === 'stanza' && obj instanceof fabric.Group) {
                const objects = obj.getObjects();
                if (objects[1]) objects[1].set('opacity', opacity);
            }
        });
        this.cdr.detectChanges();
        this.canvas?.renderAll();
    }

    updateClusteringView(zoom: number): void {
        if (!this.canvas) return;
        const allObjects = this.canvas.getObjects();
        const stanze = allObjects.filter((obj: any) => obj.data?.tipo === 'stanza' && obj instanceof fabric.Group) as fabric.Group[];
        const postazioni = allObjects.filter((obj: any) => obj.data?.tipo === 'postazione' && obj instanceof fabric.Group) as fabric.Group[];
        const isZoomedOut = zoom < this.ZOOM_THRESHOLD;
        postazioni.forEach((desk) => { desk.set({ opacity: isZoomedOut ? 0 : 1, evented: !isZoomedOut }); });
        stanze.forEach((room) => {
            const children = room.getObjects();
            const labelText = children[1] as fabric.Text | undefined;
            if (!labelText) return;
            if (isZoomedOut) {
                const count = postazioni.filter((desk) => room.containsPoint(desk.getCenterPoint())).length;
                labelText.set({ text: String(count), fill: '#22c55e', fontSize: 24, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.6)', opacity: 1 });
            } else {
                labelText.set({ text: (room as any).data?.label ?? '', fill: '#ffffff', fontSize: 14, fontWeight: 'normal', backgroundColor: 'rgba(0,0,0,0.6)', opacity: 0 });
            }
        });
        this.canvas.renderAll();
    }

    /** Apre il modale validità prima di salvare, dopo aver controllato che non ci siano stanze vuote. */
    salvaDati(): void {
        if (!this.canvas || this.isSaving) return;

        const allObjects = this.canvas.getObjects() as any[];
        const stanzeCanvas = allObjects.filter(o => o.data?.tipo === 'stanza');
        const postazioniCanvas = allObjects.filter(o => o.data?.tipo === 'postazione');

        if (stanzeCanvas.length === 0 && postazioniCanvas.length === 0) {
            this.showAlert('Planimetria Vuota', this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.NO_ELEMENTS'));
            return;
        }

        const capacityMap = new Map<number, number>();
        for (const stanza of stanzeCanvas) {
            const tempId: number = stanza.data?.tempId;
            const count = postazioniCanvas.filter((postazione: any) => stanza.containsPoint(postazione.getCenterPoint())).length;
            capacityMap.set(tempId, count);
        }

        const stanzeVuote = stanzeCanvas.filter((s: any) => (capacityMap.get(s.data?.tempId) ?? 0) === 0);
        if (stanzeVuote.length > 0) {
            const nomi = stanzeVuote.map((s: any) => `"${s.data?.label ?? 'Senza nome'}"`).join(', ');
            this.showAlert('Attenzione: Stanze Vuote', this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.EMPTY_ROOMS_WARNING', { rooms: nomi }));
            return;
        }

        this.apriModaleValidita();
    }

    /** Esegue il salvataggio effettivo (chiamata dopo conferma date). */
    async eseguiSalvataggio(): Promise<void> {
        if (!this.canvas || this.isSaving) return;
        const allObjects = this.canvas.getObjects() as any[];
        const stanzeCanvas = allObjects.filter(o => o.data?.tipo === 'stanza');
        const postazioniCanvas = allObjects.filter(o => o.data?.tipo === 'postazione');

        const capacityMap = new Map<number, number>();
        for (const stanza of stanzeCanvas) {
            const tempId: number = stanza.data?.tempId;
            const count = postazioniCanvas.filter((postazione: any) => stanza.containsPoint(postazione.getCenterPoint())).length;
            capacityMap.set(tempId, count);
        }

        // Formatta le date come YYYY-MM-DD per il backend (LocalDate)
        const validFromStr = this.formatDateYMD(this.validFrom);
        const validToStr = this.fineIndeterminata ? null : this.formatDateYMD(this.validTo);

        this.isSaving = true;
        this.cdr.detectChanges();

        try {
            const tempIdToRealId = new Map<number, number>();

            // 1. Salva le stanze logiche che sono NUOVE
            for (const stanza of stanzeCanvas) {
                const tempId: number = stanza.data?.tempId;
                const capacityCalcolata = capacityMap.get(tempId) ?? 1;

                if (stanza.data?.id) {
                    // Stanza già esistente, mappa il suo ID
                    tempIdToRealId.set(tempId, stanza.data.id);
                } else {
                    // Nuova stanza da creare logically
                    const payload = {
                        name: stanza.data?.label ?? 'Stanza',
                        roomType: stanza.data?.roomType ?? 'MEETING_ROOM',
                        capacity: capacityCalcolata,
                        floorId: (this.selectedFloorId ?? this.selectedFloor)!,
                        enabled: true,
                        equipment: stanza.data?.equipment || []
                    };
                    const savedRoom = await lastValueFrom(this.roomService.createRoom(payload));
                    if (tempId !== undefined && savedRoom.id !== undefined) {
                        tempIdToRealId.set(tempId, savedRoom.id);
                        stanza.data.id = savedRoom.id; // Salva l'ID reale sul canvas per i salvataggi futuri
                    }
                }
            }

            // 2. Salva le postazioni logiche che sono NUOVE
            for (const postazione of postazioniCanvas) {
                const tempRoomId: number | undefined = postazione.data?.tempRoomId;
                const realRoomId = tempRoomId !== undefined ? tempIdToRealId.get(tempRoomId) : undefined;
                if (realRoomId === undefined) continue;

                if (postazione.data?.id) {
                    // Postazione già esistente
                    // Nessun bisogno di creare logically
                } else {
                    // Nuova postazione logica
                    const payload = {
                        name: postazione.data?.label ?? 'Postazione',
                        roomId: realRoomId,
                        capacity: 1,
                        enabled: true
                    };
                    const savedWorkspace = await lastValueFrom(this.workspaceService.createWorkspace(payload as any));
                    if (savedWorkspace.id !== undefined) {
                        postazione.data.id = savedWorkspace.id; // Salva l'ID reale sul canvas
                    }
                }
            }

            // 3. Costruisci il payload completo della Planimetria (FloorPlanDTO)
            const planPayload: Planimetria = {
                id: this.selectedFloorPlanId ?? undefined,
                floorId: (this.selectedFloorId ?? this.selectedFloor)!,
                validFrom: validFromStr,
                validTo: validToStr,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height,
                imagePath: this.imageUrl || 'Planimetria.png',
                rooms: stanzeCanvas.map(stanza => {
                    const bbox = stanza.getBoundingRect();
                    return {
                        roomId: stanza.data.id,
                        mapX: Math.round(bbox.left),
                        mapY: Math.round(bbox.top),
                        mapWidth: Math.round(bbox.width),
                        mapHeight: Math.round(bbox.height)
                    };
                }),
                workspaces: postazioniCanvas.map(postazione => {
                    const pbbox = postazione.getBoundingRect();
                    return {
                        workspaceId: postazione.data.id,
                        mapX: Math.round(pbbox.left + pbbox.width / 2),
                        mapY: Math.round(pbbox.top + pbbox.height / 2)
                    };
                })
            };

            // 4. Salva l'intero schema spaziale su FloorPlan
            await lastValueFrom(this.planimetriaService.salvaDatiPlanimetria(planPayload));

            this.showAlert('Salvataggio Completato', this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.SAVE_SUCCESS', {
                roomsCount: stanzeCanvas.length,
                desksCount: postazioniCanvas.length
            }), 'success');
        } catch (error: any) {
            this.showAlert('Errore di Salvataggio', this.translate.instant('PLANIMETRIA_EDITOR.ALERTS.SAVE_ERROR', { error: error?.message ?? 'Unknown error' }));
        } finally {
            this.isSaving = false;
            this.cdr.detectChanges();
        }
    }
}