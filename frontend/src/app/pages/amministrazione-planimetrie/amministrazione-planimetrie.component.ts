import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { authAnimations } from '../../shared/animations/auth.animations';
import { ButtonComponent } from '../../shared/components/buttons/button.component';

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

    ngOnInit(): void {
    }

    onSedeChange(event: any) {
        this.selectedSede = event.target.value;
        this.isConfirmed = false;
        this.imageUrl = null;
    }

    onConfirm() {
        if (this.selectedSede) {
            this.isConfirmed = true;
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imageUrl = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}
