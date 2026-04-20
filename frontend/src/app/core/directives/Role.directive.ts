// core/directives/Role.directive.ts

import { Directive, ElementRef, Renderer2, Input, OnInit } from '@angular/core';
import { AuthJwtService } from '../auth/auth-jwt.service';
import { UserRole } from '../models/enums'; // Importa l'enum centralizzato

@Directive({
  selector: '[hasRole]'
})
export class HasRoleDirective implements OnInit {

  // Accetta sia stringhe che l'enum UserRole per massima flessibilità
  @Input() hasRole: (string | UserRole)[] = [];

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private authJwtService: AuthJwtService
  ) { }

  ngOnInit() {
    const userRoles = this.authJwtService.getUserRoles();

    // Verifica se l'utente ha uno dei ruoli richiesti
    const hasRequiredRole = this.hasRole.some(role => userRoles.includes(role as string));

    if (!hasRequiredRole) {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    } else {
      // Usiamo 'flex' o 'block' a seconda del layout originale, 'revert' è più sicuro
      this.renderer.setStyle(this.el.nativeElement, 'display', 'revert');
    }
  }
}