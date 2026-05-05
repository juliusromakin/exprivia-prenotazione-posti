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
  imports: [CommonModule, FormsModule, LucideAngularModule],
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
  private nodes: BadgeNode[] = [];

  // Posizioni salvate manualmente dall'utente (key = badge id)
  private savedPositions: Map<number, { x: number; y: number }> = new Map();

  // Drag state
  private draggingNode: BadgeNode | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private isDragging = false;

  // Modale creazione
  showCreateModal = false;
  createForm: Partial<badgeDTO> = { type: 'ROLE', isActive: true, parentIds: [] };
  createError = '';

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
    private cdr: ChangeDetectorRef
  ) {
    this.boundOnMouseMove = this.onCanvasMouseMove.bind(this);
    this.boundOnMouseUp = this.onCanvasMouseUp.bind(this);
    this.boundOnResize = this.drawGraph.bind(this);
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
        this.layoutAndDraw();
      });

    this.badgeService.loadBadges();
  }

  ngAfterViewInit(): void {
    this.layoutAndDraw();
    window.addEventListener('resize', this.boundOnResize);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.boundOnResize);
  }

  // --- Selezione e pannello ereditarietà ---

  selectBadge(badge: badgeDTO): void {
    if (this.selectedBadge?.id === badge.id) {
      this.closeSidePanel();
    } else {
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
    setTimeout(() => this.layoutAndDraw(), 50);
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
      currentParents.push(candidate.id);
    }

    this.workingBadge.parentIds = currentParents;
    // Non salviamo ancora, aggiorniamo solo il disegno del grafo se vogliamo vedere l'anteprima
    this.drawGraph();
  }

  async saveChanges(): Promise<void> {
    if (!this.workingBadge || !this.selectedBadge || !this.hasChanges()) return;

    try {
      const updated = await this.badgeService.updateBadge(this.workingBadge.id!, this.workingBadge);
      this.selectedBadge = { ...updated };
      this.workingBadge = JSON.parse(JSON.stringify(updated));
      this.showToast('Gerarchia salvata con successo', 'success');
    } catch (err: any) {
      this.showToast(err?.response?.data?.message ?? 'Errore nel salvataggio', 'error');
    }
  }

  resetChanges(): void {
    if (this.selectedBadge) {
      this.workingBadge = JSON.parse(JSON.stringify(this.selectedBadge));
      this.drawGraph();
    }
  }

  // --- Toggle isActive ---

  async toggleBadgeStatus(badge: badgeDTO): Promise<void> {
    try {
      await this.badgeService.updateBadge(badge.id!, { ...badge, isActive: !badge.isActive });
      this.showToast(`Badge ${badge.isActive ? 'disattivato' : 'attivato'}`, 'success');
    } catch {
      this.showToast('Errore durante l\'aggiornamento dello stato', 'error');
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
      this.createError = 'Il nome è obbligatorio.';
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
      this.showToast('Badge creato con successo!', 'success');
    } catch (err: any) {
      this.createError = err?.response?.data?.message ?? 'Errore durante la creazione.';
    }
  }

  // --- Eliminazione (soft delete) ---

  async deleteBadge(badge: badgeDTO): Promise<void> {
    if (this.isProtectedBadge(badge)) {
      this.showToast('Il ruolo ROLE_ADMIN è protetto e non può essere disattivato.', 'error');
      return;
    }
    try {
      await this.badgeService.deleteBadge(badge.name);
      if (this.selectedBadge?.id === badge.id) this.selectedBadge = null;
      this.showToast('Badge disattivato correttamente', 'success');
    } catch {
      this.showToast('Errore durante la disattivazione', 'error');
    }
  }

  // --- Layout e disegno del grafo ---

  private layoutAndDraw(): void {
    if (!this.canvasRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight || 500;

    const allBadges = this.allBadges.filter(b => b.isActive);
    if (!allBadges.length) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.nodes = [];
      return;
    }

    const nodeW = 180; // Aumentato da 160
    const nodeH = 54;  // Aumentato da 48
    const padding = 40;

    const roles = allBadges.filter(b => b.type === 'ROLE');
    const actions = allBadges.filter(b => b.type === 'ACTION');

    // Ricostruisci i nodi solo se non ne abbiamo ancora o la lista è cambiata
    const newNodes: BadgeNode[] = [];

    const rolesGap = roles.length > 1
      ? (canvas.width - padding * 2 - nodeW) / (roles.length - 1)
      : 0;
    const actionsGap = actions.length > 1
      ? (canvas.width - padding * 2 - nodeW) / (actions.length - 1)
      : 0;

    roles.forEach((b, i) => {
      const saved = this.savedPositions.get(b.id!);
      newNodes.push({
        badge: b,
        x: saved ? saved.x : (roles.length === 1 ? (canvas.width - nodeW) / 2 : padding + i * rolesGap),
        y: saved ? saved.y : 60,
        width: nodeW,
        height: nodeH
      });
    });

    actions.forEach((b, i) => {
      const saved = this.savedPositions.get(b.id!);
      newNodes.push({
        badge: b,
        x: saved ? saved.x : (actions.length === 1 ? (canvas.width - nodeW) / 2 : padding + i * actionsGap),
        y: saved ? saved.y : canvas.height - 100,
        width: nodeW,
        height: nodeH
      });
    });

    this.nodes = newNodes;
    this.drawGraph();
  }

  drawGraph(): void {
    if (!this.canvasRef?.nativeElement) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.nodes.length) return;

    const nodeW = 160;
    const nodeH = 48;

    // Disegna frecce
    this.nodes.forEach(childNode => {
      const parents = childNode.badge.parentIds ?? [];
      parents.forEach(parentId => {
        const parentNode = this.nodes.find(n => n.badge.id === parentId);
        if (!parentNode) return;

        // LOGICA DI FILTRO:
        // Se c'è un badge selezionato, mostriamo la freccia solo se coinvolge il badge selezionato
        // Usiamo workingBadge per mostrare le modifiche in anteprima nel grafo
        const focusBadge = this.workingBadge || this.selectedBadge;
        if (focusBadge) {
          const isSelectedChild = childNode.badge.id === focusBadge.id;
          const isSelectedParent = parentNode.badge.id === focusBadge.id;
          if (!isSelectedChild && !isSelectedParent) return;
        }

        const x1 = childNode.x + nodeW / 2;
        const y1 = childNode.y + nodeH / 2;
        const x2 = parentNode.x + nodeW / 2;
        const y2 = parentNode.y + nodeH / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y1);

        // Curva di Bezier
        const cpX = (x1 + x2) / 2;
        const cpY = (y1 + y2) / 2 + (y2 > y1 ? -60 : 60);
        ctx.quadraticCurveTo(cpX, cpY, x2, y2);

        const isRole = childNode.badge.type === 'ROLE';
        ctx.strokeStyle = isRole ? '#3b82f6' : '#f97316';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();

        // Freccia
        this.drawArrowhead(ctx, cpX, cpY, x2, y2, isRole ? '#3b82f6' : '#f97316');
      });
    });

    // Disegna nodi
    this.nodes.forEach(node => {
      this.drawNode(ctx, node);
    });
  }

  private drawNode(ctx: CanvasRenderingContext2D, node: BadgeNode): void {
    const { x, y, width: w, height: h, badge } = node;
    const isRole = badge.type === 'ROLE';
    const isSelected = this.selectedBadge?.id === badge.id;
    const isBeingDragged = this.draggingNode?.badge.id === badge.id;

    // LOGICA DI DIMMING:
    // Se c'è una selezione, rendiamo meno visibili i nodi non correlati
    let alpha = 1.0;
    const focusBadge = this.workingBadge || this.selectedBadge;
    if (focusBadge && !isSelected) {
      const isParentOfSelected = focusBadge.parentIds?.includes(badge.id!);
      const isChildOfSelected = badge.parentIds?.includes(focusBadge.id!);
      if (!isParentOfSelected && !isChildOfSelected) {
        alpha = 0.2; // Molto trasparente se non c'entra nulla
      }
    }
    ctx.globalAlpha = alpha;

    // Ombra per il nodo trascinato
    if (isBeingDragged) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
    }

    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);

    if (isSelected) {
      ctx.fillStyle = isRole ? '#dbeafe' : '#ffedd5';
      ctx.strokeStyle = isRole ? '#1d4ed8' : '#ea580c';
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = isRole ? '#eff6ff' : '#fff7ed';
      ctx.strokeStyle = isRole ? '#3b82f6' : '#f97316';
      ctx.lineWidth = 1.5;
    }

    ctx.fill();
    ctx.stroke();

    // Reset alpha e ombra
    ctx.globalAlpha = 1.0;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Icona di drag (grip) — piccole linee
    ctx.strokeStyle = isRole ? '#93c5fd' : '#fdba74';
    ctx.lineWidth = 1;
    const gripX = x + 12;
    const gripY = y + h / 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(gripX - 3, gripY + i * 5);
      ctx.lineTo(gripX + 3, gripY + i * 5);
      ctx.stroke();
    }

    // Label
    const label = badge.name.replace(/^ROLE_|^ACTION_/, '').replace(/_/g, ' ');
    ctx.fillStyle = isRole ? '#1e40af' : '#9a3412';
    ctx.font = isSelected ? 'bold 14px Inter, sans-serif' : '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label.length > 20 ? label.slice(0, 18) + '…' : label, x + w / 2, y + h / 2);
  }

  private drawArrowhead(
    ctx: CanvasRenderingContext2D,
    fromX: number, fromY: number,
    toX: number, toY: number,
    color: string
  ): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const size = 8;

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - size * Math.cos(angle - Math.PI / 6), toY - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - size * Math.cos(angle + Math.PI / 6), toY - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
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
      if (Math.pow((mx - cx) / rx, 2) + Math.pow((my - cy) / ry, 2) <= 1) {
        return node;
      }
    }
    return null;
  }

  onCanvasMouseDown(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const node = this.findNodeAtPos(mx, my);
    if (node) {
      this.draggingNode = node;
      this.dragOffsetX = mx - node.x;
      this.dragOffsetY = my - node.y;
      this.isDragging = false;
      canvas.style.cursor = 'grabbing';

      // Registra i listener globali per mouse move e up
      document.addEventListener('mousemove', this.boundOnMouseMove);
      document.addEventListener('mouseup', this.boundOnMouseUp);
    }
  }

  private onCanvasMouseMove(event: MouseEvent): void {
    if (!this.draggingNode) return;

    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    // Clamp alle dimensioni del canvas
    this.draggingNode.x = Math.max(0, Math.min(canvas.width - this.draggingNode.width, mx - this.dragOffsetX));
    this.draggingNode.y = Math.max(0, Math.min(canvas.height - this.draggingNode.height, my - this.dragOffsetY));

    this.isDragging = true;
    this.drawGraph();
  }

  private onCanvasMouseUp(event: MouseEvent): void {
    document.removeEventListener('mousemove', this.boundOnMouseMove);
    document.removeEventListener('mouseup', this.boundOnMouseUp);

    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = 'pointer';

    if (this.draggingNode) {
      // Salva la posizione personalizzata
      this.savedPositions.set(this.draggingNode.badge.id!, {
        x: this.draggingNode.x,
        y: this.draggingNode.y
      });

      // Se non era un drag reale (solo click), seleziona il badge
      if (!this.isDragging) {
        this.selectBadge(this.draggingNode.badge);
        this.cdr.detectChanges();
      }
    }

    this.draggingNode = null;
    this.isDragging = false;
  }

  onCanvasHover(event: MouseEvent): void {
    if (this.draggingNode) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const node = this.findNodeAtPos(mx, my);
    canvas.style.cursor = node ? 'grab' : 'default';
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

  // --- Toast ---

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => (this.toastMessage = ''), 3500);
  }
}
