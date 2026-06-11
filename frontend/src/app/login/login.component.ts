import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoginService } from './login.service';
import { authAnimations } from '../shared/animations/auth.animations';
import { LucideAngularModule } from 'lucide-angular';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { HeaderComponent } from '../layout/header/header.component';
import { TranslateModule } from '@ngx-translate/core';
import { AnimatedBackgroundComponent } from '../shared/components/animated-background/animated-background.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
    LucideAngularModule,
    MatIconModule,
    HeaderComponent,
    TranslateModule,
    AnimatedBackgroundComponent
  ],
  animations: [
    authAnimations.fadeIn,
    authAnimations.slideUp,
    authAnimations.shake,
    authAnimations.scaleIn
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePwd: boolean = true;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  iconName: string = 'eye-off';
  private destroy$ = new Subject<void>();
  private preventNextErrorClear = false;

  private loginService = inject(LoginService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Parallax animation variables
  translateX = 0;
  translateY = 0;

  onMouseMove(event: MouseEvent) {
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    
    // Move the image slightly based on mouse position
    this.translateX = -(x / 25);
    this.translateY = -(y / 25);
  }

  onMouseLeave() {
    this.translateX = 0;
    this.translateY = 0;
  }

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', { validators: [Validators.required, Validators.email], nonNullable: true }],
      password: ['', { validators: [Validators.required], nonNullable: true }]
    });

    this.loginForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.preventNextErrorClear) {
          this.preventNextErrorClear = false;
          return;
        }
        
        if (this.errorMessage) {
          this.errorMessage = null;
        }
      });
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.isLoading = false;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;
      
      // Disable form controls while loading
      this.loginForm.disable();

      this.loginService.login(this.loginForm.value)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            // Prevent error clearing when form is re-enabled programmatically
            this.preventNextErrorClear = true;
            this.loginForm.enable();
          })
        )
        .subscribe({
          next: (user) => {
            if (user) {
              let returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'];
              
              if (user.badges?.includes('ROLE_ADMIN')) {
                if (!returnUrl || returnUrl === '/') {
                  returnUrl = '/dashboard';
                }
              } else if (user.badges?.includes('ROLE_USER') || user.badges?.includes('ACTION_RESERVATION_CREATE_OWN')) {
                if (!returnUrl || returnUrl === '/') {
                  returnUrl = '/dashboard/workspace-booking';
                }
              } else if (!returnUrl) {
                returnUrl = '/';
              }
              
              this.router.navigateByUrl(returnUrl);
            }
          },
          error: (error) => {
            this.errorMessage = error.message;
            
            // Force change detection
            this.cdr.detectChanges();
            
            this.loginForm.markAsPristine();
            
            if (error.originalError?.response?.status === 400) {
              const emailControl = this.loginForm.get('email');
              if (emailControl) {
                emailControl.markAsTouched();
                const emailInput = document.getElementById('email') as HTMLInputElement;
                if (emailInput) {
                  emailInput.focus();
                }
              }
            }
          }
        });
    }
  }

  togglePasswordIcon(): void {
    this.iconName = this.iconName === 'eye' ? 'eye-off' : 'eye';
  }

  get emailInvalid(): boolean {
    const control = this.loginForm.get('email');
    return control ? (control.dirty || control.touched) && control.invalid : false;
  }

  get passwordInvalid(): boolean {
    const control = this.loginForm.get('password');
    return control ? (control.dirty || control.touched) && control.invalid : false;
  }

  dismissError(): void {
    this.errorMessage = null;
  }
}
