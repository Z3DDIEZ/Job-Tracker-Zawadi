/**
 * Input Validation Utilities
 * Ensures data integrity and prevents XSS attacks
 *
 * NOTE: Enhanced validation moved to inputValidation.ts
 * This file maintained for backward compatibility
 */

import type { ValidationError } from '@/types';
import { SecurityValidators } from './inputValidation';
import { sanitizeUserInput } from './security';

export const Validators = {
  isValidDate(dateString: string): boolean {
    const validation = SecurityValidators.validateDate(dateString);
    return validation.valid;
  },

  isValidCompanyName(name: string): boolean {
    const validation = SecurityValidators.validateCompanyName(name);
    return validation.valid;
  },

  isValidRole(role: string): boolean {
    const validation = SecurityValidators.validateRole(role);
    return validation.valid;
  },

  /**
   * Sanitize input - removes HTML and limits length
   * Use escapeHtml() for display, sanitizeUserInput() for storage
   */
  sanitizeInput(input: string): string {
    return sanitizeUserInput(input, 100);
  },

  validateApplication(
    company: string,
    role: string,
    dateApplied: string,
    status: string
  ): ValidationError[] {
    return SecurityValidators.validateApplication(company, role, dateApplied, status);
  },
};
