import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { badgeDTO } from '@core/models';
import { BadgeManagementService } from './badge-management.service';

interface BadgeNode {
  badge: badgeDTO;
  x: number;
  y: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-badge-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LucideAngularModule,
    TranslateModule
  ],
  templateUrl: './badge-management.component.html'
})
export class BadgeManagementComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('graphCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();

  roles: badgeDTO[] = [];
  actions: badgeDTO[] = [];
  loading = false;

  // Search queries
  roleSearchQuery = '';
  actionSearchQuery = '';
  inheritanceSearchQuery = '';

  // Nodo selezionato originario (stato server)
  selectedBadge: badgeDTO | null = null;
  // Copia di lavoro per le modifiche locali (stato UI)
  workingBadge: badgeDTO | null = null;

  // Tutti i badge per i toggle nel pannello
  allBadges: badgeDTO[] = [];

  // Mappa id -> nodo canvas
  nodes: BadgeNode[] = [];

  // Posizioni salvate manualmente dall'utente (key = badge id)
  private savedPositions: Map<number, { x: number; y: number }> = new Map();

  // Drag state
  private draggingNode: BadgeNode | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private isDragging = false;
  private hoveredNode: BadgeNode | null = null;

  // Gestione Visibilità e ViewMode
  hiddenBadgeIds: Set<number> = new Set();
  viewMode: 'full' | 'focus' = 'full';
  private isFirstLoad = true;

  // Zoom & Pan state
  zoom = 1.0;
  panX = 0;
  panY = 0;
  private isPanning = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Rendering Loop & Performance
  private needsRedraw = false;
  private animationFrameId: number | null = null;

  // Selezione & Connessione
  interactionMode: 'pan' | 'select' | 'connect' = 'pan';
  selectedNodeIds: Set<number> = new Set();
  selectionRect: { x1: number, y1: number, x2: number, y2: number } | null = null;
  private connectionStartNode: BadgeNode | null = null;
  private connectionEndPoint: { x: number, y: number } | null = null;

  // Modale creazione
  showCreateModal = false;
  createForm: Partial<badgeDTO> = { type: 'ROLE', isActive: true, parentIds: [] };
  createError = '';

  // Modale eliminazione avanzata
  showDeleteModal = false;
  badgeToDelete: badgeDTO | null = null;
  preserveHierarchyOnDelete = true;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeout: any;

  // Bound event handlers per rimozione corretta
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: (e: MouseEvent) => void;
  private boundOnResize: () => void;

  constructor(
    public badgeService: BadgeManagementService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {
    this.boundOnMouseMove = this.onCanvasMouseMove.bind(this);
    this.boundOnMouseUp = this.onCanvasMouseUp.bind(this);
    this.boundOnResize = this.drawGraph.bind(this);
    
    // Carica le posizioni salvate localmente all'avvio
    this.loadPositionsFromStorage();

    // Avvia il loop di rendering
    this.startRenderLoop();
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.needsRedraw) {
        this.drawGraph();
        this.needsRedraw = false;
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private loadPositionsFromStorage(): void {
    try {
      const saved = localStorage.getItem('badge-management-layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convertiamo l'oggetto semplice in una Map
        Object.keys(parsed).forEach(id => {
          this.savedPositions.set(Number(id), parsed[id]);
        });
      }
      const savedHidden = localStorage.getItem('badge-management-hidden-ids');
      if (savedHidden) {
        const parsedHidden = JSON.parse(savedHidden);
        if (Array.isArray(parsedHidden)) {
          this.hiddenBadgeIds = new Set(parsedHidden);
        }
      }
    } catch (e) {
      console.warn('Errore nel caricamento dallo storage locale', e);
    }
  }

  private savePositionsToStorage(): void {
    try {
      // Convertiamo la Map in un oggetto semplice per JSON
      const obj: any = {};
      this.savedPositions.forEach((pos, id) => {
        obj[id] = pos;
      });
      localStorage.setItem('badge-management-layout', JSON.stringify(obj));
      localStorage.setItem('badge-management-hidden-ids', JSON.stringify(Array.from(this.hiddenBadgeIds)));
    } catch (e) {
      console.error('Errore nel salvataggio nello storage locale', e);
    }
  }

  ngOnInit(): void {
    this.badgeService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => (this.loading = loading));

    this.badgeService.badges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(badges => {
        this.allBadges = badges;
        this.roles = badges.filter(b => b.type === 'ROLE');
        this.actions = badges.filter(b => b.type === 'ACTION');

        if (this.isFirstLoad) {
          // Se non abbiamo ID nascosti caricati dallo storage locale, nascondiamo di default i nodi isolati
          if (!localStorage.getItem('badge-management-hidden-ids')) {
            badges.forEach(b => {
              if (b.id && b.isActive && this.isIsolated(b.id)) {
                this.hiddenBadgeIds.add(b.id);
              }
            });
          }
          this.isFirstLoad = false;
        }
        
        this.layoutAndDraw();
      });

    this.badgeService.loadBadges();
  }

  private hasChildren(badgeId: number, allBadges: badgeDTO[]): boolean {
    return allBadges.some(b => b.parentIds?.includes(badgeId));
  }

  ngAfterViewInit(): void {
    this.layoutAndDraw();
    window.addEventListener('resize', this.boundOnResize);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.boundOnResize);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // --- Selezione e pannello ereditarietà ---

  selectBadge(badge: badgeDTO): void {
    if (this.selectedBadge?.id === badge.id) {
      this.closeSidePanel();
    } else {
      // Se lo selezioniamo dalla lista e non è visibile, lo rendiamo visibile
      if (badge.id && this.hiddenBadgeIds.has(badge.id)) {
        this.hiddenBadgeIds.delete(badge.id);
        this.savePositionsToStorage();
      }
      this.selectedBadge = { ...badge };
      this.workingBadge = JSON.parse(JSON.stringify(badge)); // Copia profonda
      // Aspetta che il pannello si apra e ridisegna per evitare stretch
      setTimeout(() => this.layoutAndDraw(), 50);
    }
  }

  isSelectedBadge(badge: badgeDTO): boolean {
    return this.selectedBadge?.id === badge.id;
  }

  closeSidePanel(): void {
    this.selectedBadge = null;
    this.workingBadge = null;
    this.inheritanceSearchQuery = ''; // Reset della ricerca quando si chiude
    // Aspetta che il pannello si chiuda (il flex si espanda) e ridisegna
    setTimeout(() => {
      this.layoutAndDraw();
      this.needsRedraw = true;
    }, 50);
  }

  onCanvasMouseDown(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const worldX = (mx - this.panX) / this.zoom;
    const worldY = (my - this.panY) / this.zoom;

    // --- Supporto tasto centrale (Rotellina) per il Panning sempre attivo ---
    if (event.button === 1) {
      event.preventDefault();
      this.isPanning = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      canvas.style.cursor = 'grabbing';
      document.addEventListener('mousemove', this.boundOnMouseMove);
      document.addEventListener('mouseup', this.boundOnMouseUp);
      return;
    }

    const node = this.findNodeAtPos(worldX, worldY);

    // Gestione click su pulsanti speciali (Hide) in Hover su qualsiasi nodo
    if (node && node === this.hoveredNode) {
      const hx = node.x + node.width;
      const hy = node.y;
      
      // Controllo click su "Hide" (X) - posizione (hx - 15, hy + 15)
      if (worldX > hx - 25 && worldX < hx - 5 && worldY > hy + 5 && worldY < hy + 25) {
        event.stopPropagation();
        this.hideFromGraph(node.badge);
        return;
      }
    }

    if (this.interactionMode === 'connect') {
      if (node) {
        this.connectionStartNode = node;
        this.connectionEndPoint = { x: worldX, y: worldY };
        this.draggingNode = null; // Forza la disattivazione del trascinamento nodo
        this.isDragging = false;
        this.needsRedraw = true;
      }
    } else if (node) {
      // Trascinamento nodo (valido in pan o select se clicco un nodo)
      this.draggingNode = node;
      this.dragOffsetX = worldX - node.x;
      this.dragOffsetY = worldY - node.y;
      this.isDragging = false;
      if (!this.selectedNodeIds.has(node.badge.id!)) {
        this.selectedNodeIds.clear();
      }
      canvas.style.cursor = 'grabbing';
    } else if (this.interactionMode === 'select') {
      this.selectionRect = { x1: worldX, y1: worldY, x2: worldX, y2: worldY };
      this.selectedNodeIds.clear();
      this.needsRedraw = true;
    } else {
      // Panning standard
      this.isPanning = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      canvas.style.cursor = 'grabbing';
    }

    document.addEventListener('mousemove', this.boundOnMouseMove);
    document.addEventListener('mouseup', this.boundOnMouseUp);
  }

  private onCanvasMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = (event.clientX - rect.left - this.panX) / this.zoom;
    const my = (event.clientY - rect.top - this.panY) / this.zoom;

    if (this.isPanning) {
      const dx = event.clientX - this.lastMouseX;
      const dy = event.clientY - this.lastMouseY;
      this.panX += dx;
      this.panY += dy;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      this.needsRedraw = true;
      return;
    }

    if (this.selectionRect) {
      this.selectionRect.x2 = mx;
      this.selectionRect.y2 = my;
      this.needsRedraw = true;
      return;
    }

    if (this.connectionStartNode) {
      this.connectionEndPoint = { x: mx, y: my };
      this.needsRedraw = true;
      return;
    }

    if (this.draggingNode) {
      const worldX = mx;
      const worldY = my;
      const dx = worldX - (this.draggingNode.x + this.dragOffsetX);
      const dy = worldY - (this.draggingNode.y + this.dragOffsetY);
      
      this.draggingNode.x = worldX - this.dragOffsetX;
      this.draggingNode.y = worldY - this.dragOffsetY;
      
      // Muovi anche gli altri nodi selezionati
      if (this.selectedNodeIds.has(this.draggingNode.badge.id!)) {
        this.selectedNodeIds.forEach(id => {
          if (id === this.draggingNode!.badge.id) return;
          const otherNode = this.nodes.find(n => n.badge.id === id);
          if (otherNode) {
            otherNode.x += dx;
            otherNode.y += dy;
          }
        });
      }

      this.isDragging = true;
      this.needsRedraw = true;
      return;
    }

    // Hover effect
    const hovered = this.findNodeAtPos(mx, my);
    canvas.style.cursor = hovered ? 'grab' : (this.interactionMode === 'pan' ? 'grab' : (this.interactionMode === 'connect' ? 'crosshair' : 'default'));
    if (this.isPanning) canvas.style.cursor = 'grabbing';
  }

  private onCanvasMouseUp(event: MouseEvent): void {
    document.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('mouseup', this.boundOnMouseUp);

    if (this.connectionStartNode) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const mx = (event.clientX - rect.left - this.panX) / this.zoom;
      const my = (event.clientY - rect.top - this.panY) / this.zoom;
      const targetNode = this.findNodeAtPos(mx, my);

      if (targetNode && targetNode.badge.id !== this.connectionStartNode.badge.id) {
        // Avviamo la logica di connessione
        this.selectBadge(this.connectionStartNode.badge); // Apriamo il pannello per feedback
        this.toggleInheritance(targetNode.badge);
      }

      this.connectionStartNode = null;
      this.connectionEndPoint = null;
      this.needsRedraw = true;
    }

    if (this.draggingNode) {
      // Salva posizioni per tutti i coinvolti (singoli o selezione multipla)
      const involvedIds = this.selectedNodeIds.has(this.draggingNode.badge.id!) 
        ? Array.from(this.selectedNodeIds) 
        : [this.draggingNode.badge.id!];
      
      involvedIds.forEach(id => {
        const n = this.nodes.find(node => node.badge.id === id);
        if (n) this.savedPositions.set(id, { x: n.x, y: n.y });
      });

      this.savePositionsToStorage();
      
      if (!this.isDragging) {
        this.selectBadge(this.draggingNode.badge);
      }
    }

    if (this.selectionRect) {
      this.updateSelectionFromRect();
      this.selectionRect = null;
      this.needsRedraw = true;
    }

    this.draggingNode = null;
    this.isDragging = false;
    this.isPanning = false;
  }

  private updateSelectionFromRect(): void {
    if (!this.selectionRect) return;
    const { x1, y1, x2, y2 } = this.selectionRect;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    this.nodes.forEach(n => {
      const nx = n.x + n.width / 2;
      const ny = n.y + n.height / 2;
      if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
        this.selectedNodeIds.add(n.badge.id!);
      }
    });
  }

  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    const zoomIntensity = 0.001;
    const delta = -event.deltaY;
    const factor = Math.pow(1.1, delta / 100);
    
    const newZoom = Math.min(Math.max(this.zoom * factor, 0.1), 5);
    
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const worldX = (mouseX - this.panX) / this.zoom;
    const worldY = (mouseY - this.panY) / this.zoom;
    
    this.zoom = newZoom;
    this.panX = mouseX - worldX * this.zoom;
    this.panY = mouseY - worldY * this.zoom;
    
    this.needsRedraw = true;
  }

  onCanvasHover(event: MouseEvent): void {
    if (this.draggingNode || this.isPanning || this.connectionStartNode) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = (event.clientX - rect.left - this.panX) / this.zoom;
    const my = (event.clientY - rect.top - this.panY) / this.zoom;

    const node = this.findNodeAtPos(mx, my);
    if (this.hoveredNode !== node) {
      this.hoveredNode = node;
      this.needsRedraw = true;
    }

    if (node) {
      // Controllo se siamo sopra il pulsante Hide (X)
      const hx = node.x + node.width;
      const hy = node.y;
      const isOverHide = mx > hx - 25 && mx < hx - 5 && 
                         my > hy + 5 && my < hy + 25;
      
      canvas.style.cursor = isOverHide ? 'pointer' : 'grab';
    } else {
      canvas.style.cursor = (this.interactionMode === 'connect' ? 'crosshair' : (this.interactionMode === 'pan' ? 'grab' : 'default'));
    }
  }

  private isIsolated(badgeId: number): boolean {
    const badge = this.allBadges.find(b => b.id === badgeId);
    if (!badge) return true;
    
    // Ha genitori?
    if (badge.parentIds && badge.parentIds.length > 0) return false;
    
    // È genitore di qualcuno?
    const isParent = this.allBadges.some(b => b.parentIds?.includes(badgeId));
    if (isParent) return false;
    
    return true;
  }

  isInheriting(candidate: badgeDTO): boolean {
    if (!this.workingBadge || !this.workingBadge.parentIds) return false;
    return this.workingBadge.parentIds.includes(candidate.id!);
  }

  canInheritFrom(candidate: badgeDTO): boolean {
    if (this.isProtectedBadge(this.workingBadge)) return false; // Non si può modificare un ruolo protetto
    return candidate.id !== this.workingBadge?.id;
  }

  isProtectedBadge(badge: badgeDTO | null | undefined): boolean {
    if (!badge) return false;
    // ROLE_ADMIN è protetto per evitare lockout
    return badge.name === 'ROLE_ADMIN';
  }

  hasChanges(): boolean {
    if (!this.selectedBadge || !this.workingBadge) return false;
    const original = JSON.stringify([...(this.selectedBadge.parentIds ?? [])].sort());
    const working = JSON.stringify([...(this.workingBadge.parentIds ?? [])].sort());
    return original !== working;
  }

  toggleInheritance(candidate: badgeDTO): void {
    if (!this.workingBadge || !candidate.id || this.isProtectedBadge(this.workingBadge)) return;

    const currentParents = [...(this.workingBadge.parentIds ?? [])];
    const idx = currentParents.indexOf(candidate.id);

    if (idx >= 0) {
      currentParents.splice(idx, 1);
    } else {
      // Controllo cicli lato UI per feedback immediato
      if (this.isReachable(this.workingBadge.id!, candidate.id)) {
        this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.CYCLE_ERROR'), 'error');
        return;
      }
      currentParents.push(candidate.id);
    }

    this.workingBadge.parentIds = currentParents;
    this.needsRedraw = true;
  }

  /**
   * Verifica se un'ereditarietà è ridondante (già coperta da un altro percorso).
   */
  isRedundantInheritance(parentId: number): boolean {
    if (!this.workingBadge || !this.workingBadge.parentIds) return false;
    
    // Un genitore è ridondante se è raggiungibile da QUALSIASI ALTRO genitore attuale
    for (const otherParentId of this.workingBadge.parentIds) {
      if (otherParentId === parentId) continue;
      if (this.isReachable(otherParentId, parentId)) {
        return true;
      }
    }
    return false;
  }


  public toggleViewMode(): void {
    this.viewMode = this.viewMode === 'full' ? 'focus' : 'full';
    this.layoutAndDraw();
  }


  public clearCanvas(): void {
    if (this.viewMode === 'full') {
      // Reset layout
      this.savedPositions.clear();
      this.hiddenBadgeIds.clear();
      this.allBadges.forEach(b => {
        if (b.id && b.isActive && this.isIsolated(b.id)) {
          this.hiddenBadgeIds.add(b.id);
        }
      });
      this.savePositionsToStorage();
      this.layoutAndDraw();
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.DEFAULT_LAYOUT_RESET'), 'success');
    } else {
      // Clear map (nascondi tutti)
      this.allBadges.forEach(b => {
        if (b.id) this.hiddenBadgeIds.add(b.id);
      });
      this.savePositionsToStorage();
      this.selectedBadge = null;
      this.workingBadge = null;
      this.layoutAndDraw();
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.ALL_HIDDEN'), 'success');
    }
  }

  async saveChanges(): Promise<void> {
    if (!this.workingBadge || !this.selectedBadge || !this.hasChanges()) return;

    try {
      const updated = await this.badgeService.updateBadge(this.workingBadge.id!, this.workingBadge);
      this.selectedBadge = { ...updated };
      this.workingBadge = JSON.parse(JSON.stringify(updated));
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.SUCCESS_UPDATE'), 'success');
    } catch (err: any) {
      this.showToast(err?.response?.data?.message ?? this.translate.instant('BADGE_MANAGEMENT.MESSAGES.ERROR_UPDATE'), 'error');
    }
  }

  resetChanges(): void {
    if (this.selectedBadge) {
      this.workingBadge = JSON.parse(JSON.stringify(this.selectedBadge));
      this.layoutAndDraw();
    }
  }

  // --- Toggle isActive ---

  async toggleBadgeStatus(badge: badgeDTO): Promise<void> {
    try {
      await this.badgeService.updateBadge(badge.id!, { ...badge, isActive: !badge.isActive });
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.SUCCESS_UPDATE'), 'success');
    } catch {
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.ERROR_UPDATE'), 'error');
    }
  }

  // --- Creazione badge ---

  openCreateModal(type: 'ROLE' | 'ACTION'): void {
    this.createForm = { name: '', type, description: '', isActive: true, parentIds: [] };
    this.createError = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  async submitCreate(): Promise<void> {
    if (!this.createForm.name?.trim()) {
      this.createError = this.translate.instant('BADGE_MANAGEMENT.MESSAGES.ERROR_NAME_REQUIRED');
      return;
    }
    if (!this.createForm.type) {
      this.createError = 'Il tipo è obbligatorio.';
      return;
    }

    // Normalizzazione nome: UPPERCASE, spazi -> UNDERSCORE, aggiunta prefisso
    let normalizedName = this.createForm.name.trim().toUpperCase().replace(/\s+/g, '_');
    const prefix = this.createForm.type === 'ROLE' ? 'ROLE_' : 'ACTION_';
    
    if (!normalizedName.startsWith(prefix)) {
      normalizedName = prefix + normalizedName;
    }

    try {
      await this.badgeService.createBadge({
        name: normalizedName,
        type: this.createForm.type!,
        description: this.createForm.description ?? '',
        isActive: true,
        parentIds: []
      });
      this.closeCreateModal();
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.SUCCESS_CREATE'), 'success');
    } catch (err: any) {
      this.createError = err?.response?.data?.message ?? this.translate.instant('BADGE_MANAGEMENT.MESSAGES.ERROR_CREATE');
    }
  }

  // --- Gestione Visibilità e Deletion ---

  toggleBadgeVisibility(badge: badgeDTO): void {
    if (!badge.id) return;
    if (this.hiddenBadgeIds.has(badge.id)) {
      this.hiddenBadgeIds.delete(badge.id);
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.VISIBLE_ON_GRAPH', { name: this.formatBadgeName(badge.name) }), 'success');
    } else {
      this.hiddenBadgeIds.add(badge.id);
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.HIDDEN_FROM_GRAPH', { name: this.formatBadgeName(badge.name) }), 'success');
    }
    this.savePositionsToStorage();
    this.layoutAndDraw();
  }

  isBadgeVisible(badge: badgeDTO): boolean {
    if (!badge.id) return false;
    if (!badge.isActive) return false;
    if (this.viewMode === 'focus' && this.selectedBadge) {
      return this.isInFocusHierarchy(badge.id);
    }
    return !this.hiddenBadgeIds.has(badge.id);
  }

  hideFromGraph(badge: badgeDTO): void {
    if (!badge.id) return;
    this.hiddenBadgeIds.add(badge.id);
    this.savePositionsToStorage();
    this.layoutAndDraw();
    this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.HIDDEN_FROM_GRAPH', { name: this.formatBadgeName(badge.name) }), 'success');
  }

  deleteBadge(badge: badgeDTO): void {
    if (this.isProtectedBadge(badge)) {
      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.PROTECTED_ADMIN'), 'error');
      return;
    }
    this.badgeToDelete = badge;
    this.preserveHierarchyOnDelete = true;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.badgeToDelete = null;
  }

  async confirmDelete(): Promise<void> {
    if (!this.badgeToDelete || !this.badgeToDelete.name) return;
    
    try {
      this.loading = true;
      // Chiamata al servizio (passando il nome come richiesto dal tipo string)
      await this.badgeService.deleteBadge(this.badgeToDelete.name, this.preserveHierarchyOnDelete);
      
      const idToRemove = this.badgeToDelete.id;
      if (idToRemove) {
        this.hiddenBadgeIds.delete(idToRemove);
        this.allBadges = this.allBadges.filter(b => b.id !== idToRemove);
        this.roles = this.allBadges.filter(b => b.type === 'ROLE');
        this.actions = this.allBadges.filter(b => b.type === 'ACTION');
      }

      if (this.selectedBadge?.id === idToRemove) {
        this.selectedBadge = null;
        this.workingBadge = null;
      }

      this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.SUCCESS_DELETE'), 'success');
      this.closeDeleteModal();
      this.layoutAndDraw();
    } catch (err: any) {
      this.showToast(err?.response?.data?.message ?? this.translate.instant('BADGE_MANAGEMENT.MESSAGES.ERROR_DELETE'), 'error');
    } finally {
      this.loading = false;
    }
  }

  // --- Layout e disegno del grafo ---

  public layoutAndDraw(): void {
    if (!this.canvasRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight || 500;

    const allBadges = this.allBadges.filter(b => {
      if (!b.isActive) return false;
      // D. Forziamo la visibilità se in modalità focus fa parte della gerarchia
      if (this.viewMode === 'focus' && this.selectedBadge) {
        return this.isInFocusHierarchy(b.id!);
      }
      return !this.hiddenBadgeIds.has(b.id!);
    });

    if (!allBadges.length) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.nodes = [];
      return;
    }

    const nodeW = 180;
    const nodeH = 54;
    const horizontalGap = 60; // Spazio minimo orizzontale
    const verticalGap = 100;  // Spazio tra le righe di badge dello stesso tipo
    const sectionGap = 250;   // Spazio tra la sezione Ruoli e la sezione Azioni

    const roles = allBadges.filter(b => b.type === 'ROLE');
    const actions = allBadges.filter(b => b.type === 'ACTION');

    const newNodes: BadgeNode[] = [];
    const availableWidth = canvas.width - 100; // Margine laterale di 50px per lato

    // --- Layout Ruoli ---
    let currentX = 50;
    let currentY = 60;
    roles.forEach((b, i) => {
      const saved = this.savedPositions.get(b.id!);
      if (saved) {
        newNodes.push({ badge: b, x: saved.x, y: saved.y, width: nodeW, height: nodeH });
      } else {
        // Se andiamo fuori dal canvas, andiamo a capo
        if (currentX + nodeW > availableWidth) {
          currentX = 50;
          currentY += verticalGap;
        }
        newNodes.push({ badge: b, x: currentX, y: currentY, width: nodeW, height: nodeH });
        currentX += nodeW + horizontalGap;
      }
    });

    // --- Layout Azioni ---
    // Partiamo da sotto l'ultima riga dei ruoli o da un'altezza minima
    let actionStartY = Math.max(currentY + sectionGap, canvas.height - 150);
    currentX = 50;
    currentY = actionStartY;

    actions.forEach((b, i) => {
      const saved = this.savedPositions.get(b.id!);
      if (saved) {
        newNodes.push({ badge: b, x: saved.x, y: saved.y, width: nodeW, height: nodeH });
      } else {
        if (currentX + nodeW > availableWidth) {
          currentX = 50;
          currentY += verticalGap;
        }
        newNodes.push({ badge: b, x: currentX, y: currentY, width: nodeW, height: nodeH });
        currentX += nodeW + horizontalGap;
      }
    });

    this.nodes = newNodes;
    this.needsRedraw = true;
  }

  public drawGraph(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Ottimizzazione Risoluzione (Retina/High DPI) ---
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Se la dimensione interna non corrisponde alla dimensione visualizzata, aggiornala
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.nodes.length) return;

    // --- Applicazione Trasformazioni (Zoom & Pan) ---
    ctx.save();
    
    // Applichiamo prima il dpr per la nitidezza
    ctx.scale(dpr, dpr);
    
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // Miglioramento qualità testo
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // --- Disegno Rettangolo di Selezione ---
    if (this.selectionRect) {
      const { x1, y1, x2, y2 } = this.selectionRect;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1 / this.zoom;
      ctx.setLineDash([5 / this.zoom, 5 / this.zoom]);
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]);
    }

    const nodeW = 180;
    const nodeH = 54;

    // Disegna frecce
    this.nodes.forEach(childNode => {
      const parents = childNode.badge.parentIds ?? [];
      parents.forEach(parentId => {
        const parentNode = this.nodes.find(n => n.badge.id === parentId);
        if (!parentNode) return;

        // LOGICA DI FILTRO:
        const focusBadge = this.workingBadge || this.selectedBadge;
        if (focusBadge) {
          if (this.viewMode === 'focus') {
            // In Focus Mode, mostriamo la freccia se ENTRAMBI i nodi sono nella gerarchia focus
            if (!this.isInFocusHierarchy(childNode.badge.id!) || !this.isInFocusHierarchy(parentNode.badge.id!)) {
              return;
            }
          } else {
            // Full Mode: Intera Lineage (Sopra e Sotto)
            if (!this.isInLineage(childNode.badge.id!) || !this.isInLineage(parentNode.badge.id!)) {
              return;
            }
          }
        }

        const x1 = childNode.x + childNode.width / 2;
        const y1 = childNode.y + childNode.height / 2;
        const x2 = parentNode.x + parentNode.width / 2;
        const y2 = parentNode.y + parentNode.height / 2;

        // Curva di Bezier
        const cpX = (x1 + x2) / 2;
        const cpY = (y1 + y2) / 2 + (y2 > y1 ? -60 : 60);

        // Calcolo dei punti sui bordi usando l'helper
        const startPoint = this.getEdgePoint(childNode, cpX, cpY);
        const targetPoint = this.getEdgePoint(parentNode, cpX, cpY);

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.quadraticCurveTo(cpX, cpY, targetPoint.x, targetPoint.y);

        const isRole = childNode.badge.type === 'ROLE';
        const isRedundant = this.isReachableThroughOthers(childNode.badge, parentId);
        
        ctx.strokeStyle = isRole ? (isRedundant ? '#93c5fd' : '#3b82f6') : (isRedundant ? '#fdba74' : '#f97316');
        ctx.lineWidth = isRedundant ? 1 : 2;
        ctx.setLineDash(isRedundant ? [5, 5] : []);
        ctx.stroke();

        // Freccia posizionata sul bordo
        this.drawArrowhead(ctx, cpX, cpY, targetPoint.x, targetPoint.y, ctx.strokeStyle as string);
      });
    });
    // Disegna la linea di connessione fantasma (Ghost Line)
    if (this.connectionStartNode && this.connectionEndPoint) {
      const startX = this.connectionStartNode.x + this.connectionStartNode.width / 2;
      const startY = this.connectionStartNode.y + this.connectionStartNode.height / 2;
      
      const startPoint = this.getEdgePoint(this.connectionStartNode, this.connectionEndPoint.x, this.connectionEndPoint.y);
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(this.connectionEndPoint.x, this.connectionEndPoint.y);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Freccia temporanea
      this.drawArrowhead(ctx, startX, startY, this.connectionEndPoint.x, this.connectionEndPoint.y, '#94a3b8');
    }

    this.drawNodes(ctx);
    
    ctx.restore(); 
  }

  /**
   * Calcola il punto di intersezione sul bordo di un nodo dato un punto esterno (es. punto di controllo Bezier).
   */
  private getEdgePoint(node: BadgeNode, externalX: number, externalY: number): { x: number, y: number } {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const angle = Math.atan2(cy - externalY, cx - externalX);
    
    if (node.badge.type === 'ROLE') {
      // Intersezione con rettangolo (90x27)
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      const scale = Math.min((node.width / 2) / absCos, (node.height / 2) / absSin);
      return {
        x: cx - scale * Math.cos(angle),
        y: cy - scale * Math.sin(angle)
      };
    } else {
      // Intersezione con ellisse (90x27)
      return {
        x: cx - (node.width / 2) * Math.cos(angle),
        y: cy - (node.height / 2) * Math.sin(angle)
      };
    }
  }

  /**
   * Helper per il disegno: verifica se un genitore specifico è ridondante per un badge.
   */
  private isReachableThroughOthers(child: badgeDTO, targetParentId: number): boolean {
    if (!child.parentIds) return false;
    for (const pId of child.parentIds) {
      if (pId === targetParentId) continue;
      if (this.isReachable(pId, targetParentId)) return true;
    }
    return false;
  }

  /**
   * Verifica se un badge è raggiungibile da un altro attraverso la gerarchia (ricorsivo).
   */
  private isReachable(startId: number, targetId: number, visited = new Set<number>()): boolean {
    if (startId === targetId) return true;
    if (visited.has(startId)) return false;
    visited.add(startId);

    const badge = this.allBadges.find(b => b.id === startId);
    if (!badge?.parentIds) return false;

    for (const pId of badge.parentIds) {
      if (this.isReachable(pId, targetId, visited)) return true;
    }
    return false;
  }

  /**
   * Verifica se un badge fa parte della gerarchia di quello attualmente in focus.
   */
  private isInFocusHierarchy(badgeId: number): boolean {
    const focusBadge = this.workingBadge || this.selectedBadge;
    if (!focusBadge) return false;
    // Un badge è in focus se è il badge stesso o uno dei suoi antenati
    return this.isReachable(focusBadge.id!, badgeId);
  }

  /**
   * Verifica se un badge fa parte della lineage completa (antenati O discendenti).
   */
  private isInLineage(badgeId: number): boolean {
    const focusBadge = this.workingBadge || this.selectedBadge;
    if (!focusBadge) return true;
    
    // Antenati (Salgo l'albero)
    if (this.isReachable(focusBadge.id!, badgeId)) return true;
    // Discendenti (Scendo l'albero)
    if (this.isReachable(badgeId, focusBadge.id!)) return true;
    
    return false;
  }

  // Disegna nodi
  private drawNodes(ctx: CanvasRenderingContext2D): void {
    this.nodes.forEach(node => {
      this.drawNode(ctx, node);
    });
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: BadgeNode): void {
    const { x, y, width: w, height: h, badge } = node;
    const isRole = badge.type === 'ROLE';
    const isSelected = this.selectedBadge?.id === badge.id || this.selectedNodeIds.has(badge.id!);

    // LOGICA DI DIMMING (RADIOGRAFIA):
    let alpha = 1.0;
    const focusBadge = this.workingBadge || this.selectedBadge;
    if (focusBadge && !isSelected && this.selectedNodeIds.size === 0) {
      // In Full Mode evidenziamo l'intera Lineage (sopra e sotto)
      if (!this.isInLineage(badge.id!)) {
        alpha = 0.15; // Più marcato per far risaltare il ramo
      }
    }
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    if (isRole) {
      // @ts-ignore - roundRect è supportato ma potrebbe non essere nei tipi standard di TS vecchi
      if (ctx.roundRect) {
        // @ts-ignore
        ctx.roundRect(x, y, w, h, 12);
      } else {
        // Fallback manuale per roundRect
        const r = 12;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
      }
    } else {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    }

    if (isSelected) {
      ctx.fillStyle = isRole ? '#dbeafe' : '#ffedd5';
      ctx.strokeStyle = isRole ? '#1d4ed8' : '#ea580c';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = isRole ? 'rgba(29, 78, 216, 0.4)' : 'rgba(234, 88, 12, 0.4)';
    } else {
      ctx.fillStyle = isRole ? '#eff6ff' : '#fff7ed';
      ctx.strokeStyle = isRole ? '#3b82f6' : '#f97316';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(0,0,0,0.05)';
    }

    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Reset alpha e ombra
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;


    // Label
    const label = badge.name.replace(/^ROLE_|^ACTION_/, '').replace(/_/g, ' ');
    ctx.fillStyle = isRole ? '#1e40af' : '#9a3412';
    ctx.font = isSelected ? 'bold 14px Inter, sans-serif' : '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.length > 20 ? label.slice(0, 18) + '…' : label, x + w / 2, y + h / 2);

    // Icona "Handle" per la modalità Connect
    if (this.interactionMode === 'connect') {
      ctx.beginPath();
      const handleX = x + w - 10;
      const handleY = y + h / 2;
      ctx.arc(handleX, handleY, 8, 0, Math.PI * 2);
      ctx.fillStyle = isRole ? '#3b82f6' : '#f97316';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Simbolo "+" al centro dell'handle
      ctx.beginPath();
      ctx.moveTo(handleX - 4, handleY);
      ctx.lineTo(handleX + 4, handleY);
      ctx.moveTo(handleX, handleY - 4);
      ctx.lineTo(handleX, handleY + 4);
      ctx.stroke();
    }

    // Indicatore di archi/relazioni nascoste (Opzione 2)
    const hiddenParentsCount = (badge.parentIds || []).filter(pId => 
      this.allBadges.some(b => b.id === pId && b.isActive) && !this.nodes.some(n => n.badge.id === pId)
    ).length;

    const hiddenChildrenCount = this.allBadges.filter(b => 
      b.isActive && b.parentIds?.includes(badge.id!) && !this.nodes.some(n => n.badge.id === b.id)
    ).length;

    const totalHidden = hiddenParentsCount + hiddenChildrenCount;
    if (totalHidden > 0) {
      ctx.save();
      const pillW = 76;
      const pillH = 18;
      const pillX = x + w / 2 - pillW / 2;
      const pillY = y - pillH / 2;

      ctx.beginPath();
      if (ctx.roundRect) {
        // @ts-ignore
        ctx.roundRect(pillX, pillY, pillW, pillH, 9);
      } else {
        ctx.rect(pillX, pillY, pillW, pillH);
      }
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🔗 +${totalHidden} nascosti`, pillX + pillW / 2, pillY + pillH / 2);
      ctx.restore();
    }

    // Icone di Hover (Hide su qualsiasi nodo)
    if (node === this.hoveredNode && !this.isDragging && this.interactionMode !== 'connect') {
      const hx = x + w;
      const hy = y;

      // Pulsante HIDE (X)
      ctx.beginPath();
      ctx.arc(hx - 15, hy + 15, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.strokeStyle = '#64748b';
      ctx.moveTo(hx - 19, hy + 11);
      ctx.lineTo(hx - 11, hy + 19);
      ctx.moveTo(hx - 11, hy + 11);
      ctx.lineTo(hx - 19, hy + 19);
      ctx.stroke();
    }
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    fromX: number, fromY: number,
    toX: number, toY: number,
    color: string
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const size = 12; // Aumentato da 8

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 5), toY - size * Math.sin(angle - Math.PI / 5));
    ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 5), toY - size * Math.sin(angle + Math.PI / 5));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    // Un piccolo bordo per far risaltare la freccia
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // --- Drag & Drop sui nodi del canvas ---

  private findNodeAtPos(mx: number, my: number): BadgeNode | null {
    // Cerchiamo dall'ultimo al primo (i nodi disegnati per ultimi sono sopra)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const cx = node.x + node.width / 2;
      const cy = node.y + node.height / 2;
      const rx = node.width / 2;
      const ry = node.height / 2;
      if (node.badge.type === 'ROLE') {
        // Hit test rettangolo
        if (mx >= node.x && mx <= node.x + node.width && my >= node.y && my <= node.y + node.height) {
          return node;
        }
      } else {
        // Hit test ellisse
        if (Math.pow((mx - cx) / rx, 2) + Math.pow((my - cy) / ry, 2) <= 1) {
          return node;
        }
      }
    }
    return null;
  }

  // --- Drag & Drop dall'elenco ---

  onDragStart(event: DragEvent, badge: badgeDTO): void {
    if (!badge.isActive) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('badgeId', badge.id!.toString());
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault(); // Necessario per permettere il drop
    event.dataTransfer!.dropEffect = 'copy';
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    const badgeIdStr = event.dataTransfer?.getData('badgeId');
    if (!badgeIdStr) return;
    
    const badgeId = parseInt(badgeIdStr, 10);
    const badge = this.allBadges.find(b => b.id === badgeId);
    
    if (!badge) return;

    if (!this.hiddenBadgeIds.has(badgeId)) {
      this.showToast(`Il badge ${this.formatBadgeName(badge.name)} è già visibile.`, 'success');
      this.selectBadge(badge);
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    // Convertiamo in coordinate del mondo (World Coordinates) considerando Pan e Zoom
    const worldX = (mx - this.panX) / this.zoom;
    const worldY = (my - this.panY) / this.zoom;

    // Rendi visibile e imposta la posizione
    this.hiddenBadgeIds.delete(badgeId);
    this.savedPositions.set(badgeId, { x: worldX - 90, y: worldY - 27 }); // Centro il nodo
    
    this.savePositionsToStorage(); // Salva lo stato e le posizioni dopo il drop
    this.layoutAndDraw();
    this.showToast(this.translate.instant('BADGE_MANAGEMENT.MESSAGES.VISIBLE_ON_GRAPH', { name: this.formatBadgeName(badge.name) }), 'success');
  }

  // --- Getters filtrati per la ricerca ---

  get filteredRoles(): badgeDTO[] {
    if (!this.roleSearchQuery.trim()) return this.roles;
    const q = this.roleSearchQuery.toLowerCase();
    return this.roles.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.description && r.description.toLowerCase().includes(q))
    );
  }

  get filteredActions(): badgeDTO[] {
    if (!this.actionSearchQuery.trim()) return this.actions;
    const q = this.actionSearchQuery.toLowerCase();
    return this.actions.filter(a => 
      a.name.toLowerCase().includes(q) || 
      (a.description && a.description.toLowerCase().includes(q))
    );
  }

  get filteredInheritanceRoles(): badgeDTO[] {
    if (!this.inheritanceSearchQuery.trim()) return this.roles;
    const q = this.inheritanceSearchQuery.toLowerCase();
    return this.roles.filter(r => r.name.toLowerCase().includes(q));
  }

  get filteredInheritanceActions(): badgeDTO[] {
    if (!this.inheritanceSearchQuery.trim()) return this.actions;
    const q = this.inheritanceSearchQuery.toLowerCase();
    return this.actions.filter(a => a.name.toLowerCase().includes(q));
  }

  // --- Utility UI ---

  getTotalRelations(): number {
    return this.allBadges.reduce((sum, b) => sum + (b.parentIds?.length ?? 0), 0);
  }

  getActiveBadgeCount(): number {
    return this.allBadges.filter(b => b.isActive).length;
  }

  formatBadgeName(name: string): string {
    return name.replace(/^ROLE_|^ACTION_/, '').replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => (this.toastMessage = ''), 3500);
  }
}
