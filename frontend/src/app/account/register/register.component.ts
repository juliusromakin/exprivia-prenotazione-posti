import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RegisterService, RegisterUserData } from './register.service';
import { authAnimations } from '../../shared/animations/auth.animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HeaderComponent } from '../../layout/header/header.component';
import { ToastModule } from 'primeng/toast';
import { ToastService } from '../../shared/services/toast.service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    HeaderComponent,
    ToastModule,
  ],
  providers: [],
  styleUrls: ['../../shared/styles/toast.styles.css'],
  animations: [
    authAnimations.fadeIn,
    authAnimations.slideUp,
    authAnimations.shake,
    authAnimations.scaleIn
  ],
  styles: [`
    :host ::ng-deep .mat-mdc-raised-button {
      --mdc-filled-button-container-color: transparent;
      --mdc-filled-button-container-shape: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      transition: all 0.3s ease;
      height: 48px;
      padding: 0;
    }

    :host ::ng-deep .mat-mdc-raised-button:hover {
      box-shadow: var(--shadow-xl);
      transform: scale(1.02);
    }

    :host ::ng-deep .mat-mdc-raised-button:disabled {
      opacity: 0.5;
    }

    :host ::ng-deep .mat-mdc-raised-button .mdc-button__label {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePwd = true;
  hideConfirmPwd = true;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private registerService: RegisterService,
    private toastService: ToastService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    });

    // Add password match validation when either password or confirmPassword changes
    this.registerForm.get('password')?.valueChanges.subscribe(() => {
      this.registerForm.get('confirmPassword')?.updateValueAndValidity();
    });

    this.registerForm.get('confirmPassword')?.setValidators([
      Validators.required,
      this.passwordMatchValidator.bind(this)
    ]);
  }

  // Updated password match validator
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    if (!control || !this.registerForm) {
      return null;
    }

    const password = this.registerForm.get('password')?.value;
    const confirmPassword = control.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get emailInvalid() {
    const control = this.registerForm.get('email');
    return control && control.invalid && (control.dirty || control.touched);
  }

  getEmailErrorMessage(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) {
      return 'L\'email è obbligatoria';
    }
    if (control?.hasError('email')) {
      return 'Inserisci un indirizzo email valido';
    }
    if (control?.hasError('emailExists')) {
      return 'Questa email è già registrata';
    }
    return '';
  }

  get passwordInvalid() {
    const control = this.registerForm.get('password');
    return control && control.invalid && (control.dirty || control.touched);
  }

  get confirmPasswordInvalid() {
    const control = this.registerForm.get('confirmPassword');
    return control && control.invalid && (control.dirty || control.touched);
  }

  getPasswordErrorMessage(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return 'La password è obbligatoria';
    }
    if (control?.hasError('minlength')) {
      return 'La password deve contenere almeno 6 caratteri';
    }
    if (control?.hasError('pattern')) {
      return 'La password deve contenere almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale';
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) {
      return 'La conferma password è obbligatoria';
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Le password non coincidono';
    }
    return '';
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const formData = this.registerForm.value;
      const userData: RegisterUserData = {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      };

      // Esegui la registrazione e porta alla pagina di login
      this.registerService.register(userData)
        .pipe(
          catchError(error => {
            console.error('Registration error:', error);

            // Access the message from the ErrorDto JSON if available
            const backendError = error.response?.data?.message || 
                                error.response?.data || 
                                'Errore durante la registrazione. Riprova più tardi.';
            
            let errorMessage = (typeof backendError === 'string') ? backendError : 'Errore durante la registrazione.';

            // Check for specific error cases (matching the strings from AuthService.java)
            if (error.response?.status === 400 && 
               (errorMessage === 'Esiste già un utente con questa email!' || 
                errorMessage.toLowerCase().includes('email già esistente') ||
                errorMessage.toLowerCase().includes('email already exists'))) {
              this.registerForm.get('email')?.setErrors({ emailExists: true });
              errorMessage = 'Questa email è già registrata. Per favore, utilizza un\'altra email o accedi.';
            }

            this.showErrorToast('Errore Registrazione', errorMessage);
            return throwError(() => new Error(errorMessage));
          }),
          finalize(() => {
            this.isLoading = false;
          }),
          tap(() => {
            console.log('Registration success, showing success toast...');
            this.showSuccessToast(
              'Registrazione Completata',
              'Il tuo account è stato creato con successo! Ora è in attesa di approvazione da parte dell\'amministratore. Riceverai l\'abilitazione a breve.'
            );
            console.log('Navigating to login...');
            this.router.navigate(['/login']);
          })
        )
        .subscribe();
    }
  }

  // Toast utility methods for consistent styling and messaging
  private showSuccessToast(summary: string, detail: string): void {
    this.toastService.showSuccess(summary, detail);
  }

  private showErrorToast(summary: string, detail: string): void {
    this.toastService.showError(summary, detail);
  }

  private showInfoToast(summary: string, detail: string): void {
    this.toastService.showInfo(summary, detail);
  }

  private showWarningToast(summary: string, detail: string): void {
    this.toastService.showWarning(summary, detail);
  }

  // Clear all existing toasts
  private clearAllToasts(): void {
    this.toastService.clearAll();
  }
}
