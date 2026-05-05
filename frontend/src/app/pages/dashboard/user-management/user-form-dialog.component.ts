import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '@core/models';
import { RoleSelectorComponent } from './components/role-selector/role-selector.component';

export interface DialogData {
  title: string;
  user: Partial<User>;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RoleSelectorComponent
  ],
  template: `
    <!-- Modal Overlay -->
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 99999; display: flex; align-items: center; justify-content: center;"
         (click)="onCancel()">
      
      <div class="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-300 w-full max-w-3xl mx-4" 
           (click)="$event.stopPropagation()">
        
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <!-- Header -->
          <div class="px-6 py-4 bg-blue-50 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900 flex items-center">
              <i class="fas fa-user-plus text-blue-600 mr-2" *ngIf="!data.user.id"></i>
              <i class="fas fa-user-edit text-blue-600 mr-2" *ngIf="data.user.id"></i>
              {{ data.title }}
            </h3>
          </div>
          
          <!-- Body -->
          <div class="px-6 py-4 max-h-[80vh] overflow-y-auto">
            <div class="space-y-4">
              
              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" 
                       formControlName="name" 
                       placeholder="Enter first name"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <div *ngIf="userForm.get('name')?.invalid && userForm.get('name')?.touched" 
                     class="text-sm text-red-600 mt-1">
                  First name is required
                </div>
              </div>

              <!-- Last Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" 
                       formControlName="lastName" 
                       placeholder="Enter last name"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <div *ngIf="userForm.get('lastName')?.invalid && userForm.get('lastName')?.touched" 
                     class="text-sm text-red-600 mt-1">
                  Last name is required
                </div>
              </div>

              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" 
                       formControlName="email" 
                       placeholder="Enter email address"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <div *ngIf="userForm.get('email')?.invalid && userForm.get('email')?.touched" 
                     class="text-sm text-red-600 mt-1">
                  <span *ngIf="userForm.get('email')?.errors?.['required']">Email is required</span>
                  <span *ngIf="userForm.get('email')?.errors?.['email']">Enter a valid email address</span>
                </div>
              </div>

              <!-- Password (new users only) -->
              <div *ngIf="!data.user.id">
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" 
                       formControlName="password" 
                       placeholder="Enter password"
                       class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <div *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched" 
                     class="text-sm text-red-600 mt-1">
                  <span *ngIf="userForm.get('password')?.errors?.['required']">Password is required</span>
                  <span *ngIf="userForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
                </div>
              </div>

              <!-- Role -->
              <!-- Roles Drag and Drop -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Assegnazione Ruoli e Permessi</label>
                <app-role-selector 
                  [assignedRoles]="userForm.get('badges')?.value || []"
                  (rolesChanged)="userForm.get('badges')?.setValue($event); userForm.get('badges')?.markAsTouched()">
                </app-role-selector>
                <!-- Messaggio di errore per ruoli mancanti -->
                <div *ngIf="userForm.get('badges')?.invalid && userForm.get('badges')?.touched" 
                     class="text-sm text-red-600 mt-2 flex items-center">
                  <i class="fas fa-exclamation-circle mr-1"></i>
                  Seleziona almeno un ruolo per poter procedere
                </div>
              </div>

              <!-- Enabled Status -->
              <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div class="flex items-center h-5">
                  <input id="enabled" 
                         type="checkbox" 
                         formControlName="enabled"
                         class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                </div>
                <div class="text-sm">
                  <label for="enabled" class="font-medium text-gray-700">Account Active</label>
                  <p class="text-gray-500">Enable or disable user access to the system</p>
                </div>
              </div>

            </div>

            <!-- Error message -->
            <div *ngIf="errorMessage" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button type="button" 
                    (click)="onCancel()"
                    [disabled]="isLoading"
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" 
                    [disabled]="isLoading || userForm.invalid"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
              <span *ngIf="isLoading" class="mr-2">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              {{ isLoading ? (data.user.id ? 'Saving...' : 'Creating...') : (data.user.id ? 'Save' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    select {
      appearance: none;
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }
  `]
})
export class UserFormDialogComponent implements OnInit {
  @Input() data: DialogData = { title: '', user: {} };
  @Output() submitted = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  userForm: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      badges: [[], [Validators.required, Validators.minLength(1)]],
      enabled: [true]
    });
  }

  ngOnInit(): void {
    if (this.data && this.data.user) {
      this.userForm.patchValue({
        name: this.data.user.name || '',
        lastName: this.data.user.lastName || '',
        email: this.data.user.email || '',
        badges: this.data.user.badges || ['ROLE_USER'],
        enabled: this.data.user.enabled !== false // Default to true if not specified
      });

      // Set password validation based on whether it's a new user or edit
      const passwordControl = this.userForm.get('password');
      if (!this.data.user.id) {
        passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
      } else {
        passwordControl?.clearValidators();
      }
      passwordControl?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const userData = this.userForm.value;
      
      // Remove password if empty (edit mode)
      if (!userData.password) {
        delete userData.password;
      }

      // Mark all fields as touched to show validation errors if any
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });

      this.submitted.emit(userData);
    } else {
      this.errorMessage = 'Please fill all required fields';
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}