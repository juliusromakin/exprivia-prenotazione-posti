import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { AuthJwtService } from '../../core/auth/auth-jwt.service';
import { User } from '../../core/models';

export interface UpdateUserRequest {
  name?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UpdateUserService {
  constructor(
    private userService: UserService,
    private authJwtService: AuthJwtService
  ) {}

  /**
   * Updates the user data
   * @param userId ID of the user to update
   * @param updates Data to update
   * @returns Observable with the updated user
   */
  updateUser(userId: number, updates: UpdateUserRequest): Observable<User> {
    // If there's a new password, verify current password first
    if (updates.newPassword && updates.currentPassword) {
      return this.authJwtService.login({ email: updates.email || '', password: updates.currentPassword }).pipe(
        switchMap(() => {
          // If login succeeds, proceed with the update
          const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
          );
          return this.userService.updateUser(userId, cleanUpdates);
        }),
        map(response => response as User),
        catchError(error => {
          let errorMessage = 'An error occurred while updating the profile.';
          
          if (error.response?.data) {
            errorMessage = error.response.data;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
    }

    // If there's no new password, proceed directly with the update
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    return this.userService.updateUser(userId, cleanUpdates).pipe(
      map(response => response as User),
      catchError(error => {
        let errorMessage = 'An error occurred while updating the profile.';
        
        if (error.response?.data) {
          errorMessage = error.response.data;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Validates the update data
   * @param updates Data to validate
   * @returns Object with any validation errors
   */
  validateUpdates(updates: UpdateUserRequest): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (updates['name'] && updates['name'].trim().length < 2) {
      errors['name'] = 'Name must contain at least 2 characters';
    }

    if (updates['lastName'] && updates['lastName'].trim().length < 2) {
      errors['lastName'] = 'Last name must contain at least 2 characters';
    }

    if (updates['email']) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(updates['email'])) {
        errors['email'] = 'Enter a valid email address';
      }
    }

    if (updates['newPassword']) {
      if (updates['newPassword'].length < 8) {
        errors['newPassword'] = 'Password must contain at least 8 characters';
      }
      if (!updates['currentPassword']) {
        errors['currentPassword'] = 'Enter the current password to change the password';
      }
    }

    if (updates['currentPassword'] && !updates['newPassword']) {
      errors['newPassword'] = 'Enter the new password';
    }

    return errors;
  }
} 
 