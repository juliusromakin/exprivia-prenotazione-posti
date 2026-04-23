import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { ButtonComponent } from '../../shared/components/buttons/button.component';
import * as fabric from 'fabric';

@Component({
    selector: 'app-amministrazione-planimetrie',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        HeaderComponent,
        ButtonComponent
    ],
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

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
    }

    onSedeChange(event: any) {
        this.selectedSede = event.target.value;
        this.isConfirmed = false;
        this.imageUrl = null;
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
    }

    resetSede() {
        this.isConfirmed = false;
        this.imageUrl = null;
        this.selectedSede = '';
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
    }

    onConfirm() {
        if (this.selectedSede) {
            this.isConfirmed = true;
            // Imposta immagine di default
            this.imageUrl = 'Planimetria.png';
            this.cdr.detectChanges();
            setTimeout(() => {
                this.initCanvas(this.imageUrl!);
            }, 0);
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imageUrl = e.target.result;
                this.cdr.detectChanges();
                setTimeout(() => {
                    this.initCanvas(this.imageUrl!);
                }, 0);
            };
            reader.readAsDataURL(file);
        }
    }

    initCanvas(imageSrc: string) {
        if (this.canvas) {
            this.canvas.dispose();
        }
        
        this.canvas = new fabric.Canvas('planimetriaCanvas', {
            width: 800,
            height: 450,
            selection: true
        });

        fabric.Image.fromURL(imageSrc).then((img) => {
            if (!this.canvas) return;
            
            // Scala l'immagine per farla fittare nel canvas
            const scale = Math.min(
                this.canvas.width! / img.width!,
                this.canvas.height! / img.height!
            );
            
            img.set({
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                left: this.canvas.width! / 2,
                top: this.canvas.height! / 2,
                selectable: false,
                evented: false
            });
            
            this.canvas.backgroundImage = img;
            this.canvas.renderAll();
        }).catch(err => {
            console.error("Errore nel caricamento dell'immagine nel canvas:", err);
        });

        // Elimina oggetti con tasto CANC/Delete
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.canvas) {
                    const activeObjects = this.canvas.getActiveObjects();
                    if (activeObjects.length) {
                        e.preventDefault();
                        activeObjects.forEach(obj => this.canvas?.remove(obj));
                        this.canvas.discardActiveObject();
                        this.canvas.renderAll();
                    }
                }
            }
        });

        // Zoom con rotellina
        this.canvas.on('mouse:wheel', (opt: any) => {
            const delta = opt.e.deltaY;
            let zoom = this.canvas!.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 10) zoom = 10;
            if (zoom < 1) zoom = 1;
            this.canvas!.zoomToPoint(new fabric.Point(opt.e.offsetX, opt.e.offsetY), zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });

        // Pan libero (cliccando sul background)
        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        this.canvas.on('mouse:down', (opt: any) => {
            const evt = opt.e;
            // Se opt.target è undefined, stiamo cliccando sul vuoto (o sull'immagine di sfondo)
            if (!opt.target) {
                isDragging = true;
                this.canvas!.selection = false;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
            }
        });

        this.canvas.on('mouse:move', (opt: any) => {
            if (isDragging) {
                const e = opt.e;
                const movement = new fabric.Point(e.clientX - lastPosX, e.clientY - lastPosY);
                this.canvas!.relativePan(movement);
                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        });

        this.canvas.on('mouse:up', (opt: any) => {
            isDragging = false;
            this.canvas!.selection = true;
        });
    }

    aggiungiStanza() {
        if (!this.canvas) return;
        const rect = new fabric.Rect({
            left: 100,
            top: 100,
            fill: 'rgba(255, 165, 0, 0.4)', // Arancione semi-trasparente
            stroke: 'orange',
            strokeWidth: 2,
            width: 100,
            height: 100,
            cornerColor: 'blue',
            transparentCorners: false
        });
        // Aggiungiamo data personalizzati come richiesto
        (rect as any).data = { tipo: 'stanza' };
        
        this.canvas.add(rect);
        this.canvas.setActiveObject(rect);
        this.canvas.renderAll();
    }

    aggiungiPostazione() {
        if (!this.canvas) return;
        const circle = new fabric.Circle({
            left: 150,
            top: 150,
            radius: 20,
            fill: 'rgba(0, 150, 255, 0.7)', // Blu
            stroke: 'blue',
            strokeWidth: 2,
            cornerColor: 'blue',
            transparentCorners: false
        });
        (circle as any).data = { tipo: 'postazione' };

        this.canvas.add(circle);
        this.canvas.setActiveObject(circle);
        this.canvas.renderAll();
    }

    salvaDati() {
        if (!this.canvas) return;
        const objects = this.canvas.getObjects();
        const output = objects.map((obj: any) => {
            return {
                tipo: obj.data ? obj.data.tipo : 'sconosciuto',
                x: obj.left,
                y: obj.top,
                larghezza: obj.width * (obj.scaleX || 1),
                altezza: obj.height * (obj.scaleY || 1),
                raggio: obj.radius ? (obj.radius * (obj.scaleX || 1)) : null
            };
        });
        console.log("Dati planimetria salvati:", JSON.stringify(output, null, 2));
    }
}
