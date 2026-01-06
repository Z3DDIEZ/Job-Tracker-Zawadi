/**
 * Input Validation Utilities
 * Ensures data integrity and prevents XSS attacks
 */

import type { ValidationError } from '@/types';

export const Validators = {
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if date is valid and not in the future
    return date instanceof Date && !isNaN(date.getTime()) && date <= today;
  },

  isValidCompanyName(name: string): boolean {
    // Must be 2-100 characters, no special chars except spaces, hyphens, ampersands
    const regex = /^[a-zA-Z0-9\s\-&]{2,100}$/;
    return regex.test(name.trim());
  },

  isValidRole(role: string): boolean {
    // Must be 2-100 characters
    const regex = /^[a-zA-Z0-9\s\-\/]{2,100}$/;
    return regex.test(role.trim());
  },

  sanitizeInput(input: string): string {
    // Remove potential XSS attacks
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
  },

  validateApplication(
    company: string,
    role: string,
    dateApplied: string,
    status: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!this.isValidCompanyName(company)) {
      errors.push({
        field: 'company',
        message:
          'Company name must be 2-100 characters (letters, numbers, spaces, hyphens)',
      });
    }

    if (!this.isValidRole(role)) {
      errors.push({
        field: 'role',
        message: 'Role must be 2-100 characters',
      });
    }

    if (!this.isValidDate(dateApplied)) {
      errors.push({
        field: 'date',
        message: 'Date cannot be in the future',
      });
    }

    if (!status) {
      errors.push({
        field: 'status',
        message: 'Please select a status',
      });
    }

    return errors;
  },
};
