import { Component, OnInit } from "@angular/core";
import { FormGroup, ReactiveFormsModule, Validators, FormControl } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RouterModule, ActivatedRoute, Router } from "@angular/router";
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { ResetPasswordService } from "./resetpwd.service";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AnimatedBackgroundComponent } from "@/app/shared/components/animated-background/animated-background.component";
import { HeaderComponent } from "@/app/layout/header/header.component";

// Validator corretto
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-resetpwd',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule,
    AnimatedBackgroundComponent,
    HeaderComponent
  ],
  templateUrl: './resetpwd.component.html'
})
export class ResetpwdComponent implements OnInit {
  resetPwdForm = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{6,}$/)
    ]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: passwordMatchValidator });

  private token = '';
  isLoading = false;
  hideNewPwd = true;
  hideConfirmPwd = true;
  errorMessage: string | null = null;

  constructor(
    private resetPwdService: ResetPasswordService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.showError(this.translate.instant('AUTH.RESET_PASSWORD.ERRORS.TOKEN_MISSING'));
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  get passwordInvalid() {
    const control = this.resetPwdForm.get('password');
    return control && control.invalid && (control.dirty || control.touched);
  }

  get confirmPasswordInvalid() {
    const control = this.resetPwdForm.get('confirmPassword');
    return (control && control.invalid && (control.dirty || control.touched)) ||
      (this.resetPwdForm.errors && this.resetPwdForm.errors['passwordMismatch'] && (control?.dirty || control?.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.resetPwdForm.valid && this.token) {
      this.isLoading = true;
      this.errorMessage = null;

      try {
        const password = this.resetPwdForm.get('password')?.value;
        if (!password) {
          throw new Error(this.translate.instant('AUTH.RESET_PASSWORD.ERRORS.INVALID_PASSWORD'));
        }

        await this.resetPwdService.resetPassword(this.token, password);
        
        this.showSuccess(this.translate.instant('AUTH.RESET_PASSWORD.SUCCESS_MSG'));
        await this.router.navigate(['/login']);
      } catch (error) {
        const msg = error instanceof Error ? error.message : this.translate.instant('AUTH.RESET_PASSWORD.ERRORS.GENERIC_ERROR');
        this.errorMessage = msg;
        this.showError(msg);
      } finally {
        this.isLoading = false;
      }
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, this.translate.instant('COMMON.CLOSE'), {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}