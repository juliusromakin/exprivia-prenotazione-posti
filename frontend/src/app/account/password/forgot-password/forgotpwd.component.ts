import { HeaderComponent } from "@/app/layout/header/header.component";
import { Component } from "@angular/core";
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { RouterModule, Router } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { ForgotPasswordService } from "./forgotpwd.service";
import { LucideAngularModule } from "lucide-angular";
import { authAnimations } from "@/app/shared/animations/auth.animations";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'app-forgotpwd',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LucideAngularModule,
    HeaderComponent,
    TranslateModule
  ],
  animations: [
      authAnimations.fadeIn,
      authAnimations.slideUp,
      authAnimations.shake,
      authAnimations.scaleIn
    ],
  templateUrl: './forgotpwd.component.html'
})
export class ForgotpwdComponent {
  forgotPwdForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private forgotPasswordService: ForgotPasswordService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.forgotPwdForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get emailInvalid() {
    const control = this.forgotPwdForm.get('email');
    return control && control.invalid && (control.dirty || control.touched);
  }

  async onSubmit(): Promise<void> {
    if (this.forgotPwdForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      try {
        const email = this.forgotPwdForm.get('email')?.value;
        if (!email) {
          throw new Error(this.translate.instant('AUTH.FORGOT_PASSWORD.ERRORS.EMAIL_NOT_FOUND'));
        }

        await this.forgotPasswordService.forgotPassword(email);
        
        this.showSuccess(this.translate.instant('AUTH.FORGOT_PASSWORD.SUCCESS_MSG'));
        await this.router.navigate(['/login']);
      } catch (error) {
        const msg = error instanceof Error ? error.message : this.translate.instant('AUTH.FORGOT_PASSWORD.ERRORS.GENERIC_ERROR');
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
