import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { Subject } from "rxjs"
import { takeUntil, catchError, finalize } from "rxjs/operators"
import { throwError } from "rxjs"
import { authAnimations } from "../../shared/animations/auth.animations"
import { AuthService } from "../../core/auth/auth.service"
import { UserService } from "../../core/services/user.service"
import type { User } from "../../core/models"
import { TranslateModule, TranslateService } from "@ngx-translate/core"

@Component({
  selector: "app-update-user",
  templateUrl: "./update-user.component.html",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  animations: [authAnimations.fadeIn, authAnimations.slideUp, authAnimations.shake, authAnimations.scaleIn],
})
export class UpdateUserComponent implements OnInit, OnDestroy {
  userForm: FormGroup
  currentUser: User | null = null
  hideCurrentPwd = true
  hideNewPwd = true
  hideConfirmPwd = true
  isLoading = false
  updateSuccess = false
  errorMessage: string | null = null
  showDeleteConfirmation = false
  private destroy$ = new Subject<void>()

  // Password requirements tracking
  passwordRequirements = {
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.userForm = this.fb.group({
      name: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      currentPassword: [""],
      newPassword: [
        "",
        [Validators.minLength(6), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)],
      ],
      confirmPassword: [""],
    })

    // Add password match validation when newPassword changes
    this.userForm.get("newPassword")?.valueChanges.subscribe((password) => {
      this.checkPasswordRequirements(password || '')
      this.userForm.get("confirmPassword")?.updateValueAndValidity()
    })

    this.userForm.get("confirmPassword")?.setValidators([this.passwordMatchValidator.bind(this)])
  }

  ngOnInit(): void {
    // Initialize component state
    this.isLoading = false
    this.updateSuccess = false
    this.errorMessage = null
    
    this.loadUserData()
  }

  private loadUserData(): void {
    this.isLoading = true
    this.errorMessage = null
    
    // Use the one-time identity method instead of the continuous observable
    this.authService
      .identity(true) // Force fresh fetch
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false
        })
      )
      .subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user
            this.userForm.patchValue({
              name: user.name,
              lastName: user.lastName,
              email: user.email,
            })
            console.log('User loaded successfully:', user.name, user.lastName)
          } else {
            this.errorMessage = 'Error loading user data'
            console.warn('User not found')
          }
        },
        error: (error) => {
          console.error('Error loading user data:', error)
          this.errorMessage = 'Error loading user data'
          this.isLoading = false // Backup safety
        }
      })
  }

  // Check password requirements in real-time
  private checkPasswordRequirements(password: string): void {
    this.passwordRequirements.minLength = password.length >= 6
    this.passwordRequirements.hasUppercase = /[A-Z]/.test(password)
    this.passwordRequirements.hasLowercase = /[a-z]/.test(password)
    this.passwordRequirements.hasNumber = /\d/.test(password)
  }

  // Get overall password strength
  get passwordStrength(): number {
    const requirements = Object.values(this.passwordRequirements)
    return requirements.filter(req => req).length
  }

  // Get password strength text
  get passwordStrengthText(): string {
    return this.getStrengthText();
  }

  getStrengthText(): string {
    const strength = this.passwordStrength
    if (strength === 0) return ''
    if (strength === 1) return this.translate.instant('ACCOUNT.PASSWORD.STRENGTH_LEVELS.WEAK')
    if (strength === 2) return this.translate.instant('ACCOUNT.PASSWORD.STRENGTH_LEVELS.FAIR')
    if (strength === 3) return this.translate.instant('ACCOUNT.PASSWORD.STRENGTH_LEVELS.GOOD')
    return this.translate.instant('ACCOUNT.PASSWORD.STRENGTH_LEVELS.STRONG')
  }

  // Get password strength color
  get passwordStrengthColor(): string {
    const strength = this.passwordStrength
    if (strength === 0) return 'text-gray-400'
    if (strength === 1) return 'text-red-500'
    if (strength === 2) return 'text-orange-500'
    if (strength === 3) return 'text-yellow-500'
    return 'text-green-500'
  }

  // Password match validator
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    if (!control || !this.userForm) {
      return null
    }

    const newPassword = this.userForm.get("newPassword")?.value
    const confirmPassword = control.value

    // If both fields are empty, don't validate (password not being changed)
    if ((!newPassword || newPassword === "") && (!confirmPassword || confirmPassword === "")) {
      return null
    }

    // If new password is entered, confirmation is required
    if (newPassword && (!confirmPassword || confirmPassword === "")) {
      return { required: true }
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true }
    }

    // If password is being changed, current password is required
    const currentPassword = this.userForm.get("currentPassword")?.value
    if (newPassword && (!currentPassword || currentPassword === "")) {
      this.userForm.get("currentPassword")?.setErrors({ required: true })
    }

    return null
  }

  // Getters for field validation
  get nameInvalid() {
    const control = this.userForm.get("name")
    return control && control.invalid && (control.dirty || control.touched)
  }

  get lastNameInvalid() {
    const control = this.userForm.get("lastName")
    return control && control.invalid && (control.dirty || control.touched)
  }

  get emailInvalid() {
    const control = this.userForm.get("email")
    return control && control.invalid && (control.dirty || control.touched)
  }

  get currentPasswordInvalid() {
    const control = this.userForm.get("currentPassword")
    return control && control.invalid && (control.dirty || control.touched)
  }

  get newPasswordInvalid() {
    const control = this.userForm.get("newPassword")
    return control && control.invalid && (control.dirty || control.touched)
  }

  get confirmPasswordInvalid() {
    const control = this.userForm.get("confirmPassword")
    return control && control.invalid && (control.dirty || control.touched)
  }

  // Error message getters
  getNameErrorMessage(): string {
    const control = this.userForm.get("name")
    if (control?.hasError("required")) {
      return this.translate.instant('ACCOUNT.ERRORS.REQUIRED')
    }
    if (control?.hasError("minlength")) {
      return this.translate.instant('ACCOUNT.ERRORS.MIN_LENGTH')
    }
    return ""
  }

  getLastNameErrorMessage(): string {
    const control = this.userForm.get("lastName")
    if (control?.hasError("required")) {
      return this.translate.instant('ACCOUNT.ERRORS.REQUIRED')
    }
    if (control?.hasError("minlength")) {
      return this.translate.instant('ACCOUNT.ERRORS.MIN_LENGTH')
    }
    return ""
  }

  getEmailErrorMessage(): string {
    const control = this.userForm.get("email")
    if (control?.hasError("required")) {
      return this.translate.instant('ACCOUNT.ERRORS.REQUIRED')
    }
    if (control?.hasError("email")) {
      return this.translate.instant('ACCOUNT.ERRORS.EMAIL_INVALID')
    }
    return ""
  }

  getCurrentPasswordErrorMessage(): string {
    const control = this.userForm.get("currentPassword")
    if (control?.hasError("required")) {
      return this.translate.instant('ACCOUNT.ERRORS.CURRENT_PWD_REQ')
    }
    return ""
  }

  getNewPasswordErrorMessage(): string {
    const control = this.userForm.get("newPassword")
    if (control?.hasError("required")) {
      return this.translate.instant('ACCOUNT.ERRORS.REQUIRED')
    }
    if (control?.hasError("minlength")) {
      return this.translate.instant('ACCOUNT.ERRORS.MIN_LENGTH')
    }
    if (control?.hasError("pattern")) {
      return this.translate.instant('ACCOUNT.ERRORS.MIN_LENGTH') + " (1 upper, 1 lower, 1 number)"
    }
    return ""
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.userForm.get("confirmPassword")
    if (control?.hasError("required")) {
      return this.translate.instant('ACCOUNT.ERRORS.REQUIRED')
    }
    if (control?.hasError("passwordMismatch")) {
      return this.translate.instant('ACCOUNT.ERRORS.PWD_MISMATCH')
    }
    return ""
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.isLoading) {
      return
    }

    this.isLoading = true
    this.errorMessage = null
    this.updateSuccess = false

    const formValue = this.userForm.value
    const updateData: any = {
      name: formValue.name,
      lastName: formValue.lastName,
      email: formValue.email,
    }

    // Only include password fields if they are filled
    if (formValue.newPassword && formValue.currentPassword) {
      updateData.password = formValue.newPassword
      updateData.currentPassword = formValue.currentPassword
    }

    // Use current user ID for the update
    if (!this.currentUser?.id) {
      this.errorMessage = "Error: user data not available"
      this.isLoading = false
      return
    }

    this.userService
      .updateUser(this.currentUser.id, updateData)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error("Update error:", error)
          if (error.status === 400) {
            this.errorMessage = "Invalid data. Please check the entered fields."
          } else if (error.status === 401) {
            this.errorMessage = "Current password is incorrect."
          } else if (error.status === 409) {
            this.errorMessage = "The entered email is already in use."
          } else {
            this.errorMessage = "Error during profile update. Please try again later."
          }
          return throwError(() => error)
        }),
        finalize(() => {
          this.isLoading = false
        }),
      )
      .subscribe({
        next: (updatedUser: any) => {
          this.updateSuccess = true
          this.currentUser = updatedUser
          this.userForm.patchValue({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
          this.authService.authenticate(updatedUser)
          setTimeout(() => {
            this.updateSuccess = false
          }, 5000)
        }
      })
  }

  resetForm(): void {
    if (this.currentUser) {
      this.userForm.patchValue({
        name: this.currentUser.name,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
    this.passwordRequirements = {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false
    }
    this.errorMessage = null
    this.updateSuccess = false
    this.isLoading = false
    this.userForm.markAsUntouched()
    this.userForm.markAsPristine()
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.setErrors(null)
    })
  }

  openDeleteConfirmation(): void {
    this.showDeleteConfirmation = true;
    document.body.classList.add('overflow-hidden');
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    document.body.classList.remove('overflow-hidden');
  }

  deleteAccount(): void {
    if (!this.currentUser) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.userService.deleteOwnAccount()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          localStorage.removeItem('jwt_token');
          sessionStorage.clear();
          this.authService.logout();
          setTimeout(() => {
            this.router.navigate(['/accedi']);
          }, 100);
        },
        error: (error: unknown) => {
          console.error('Error during account deletion:', error);
          this.errorMessage = 'An error occurred during account deletion. Please try again later.';
        }
      });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('overflow-hidden');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
