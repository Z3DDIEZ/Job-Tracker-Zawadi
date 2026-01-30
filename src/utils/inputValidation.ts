/**
 * Enhanced Input Validation
 * Comprehensive validation with security focus
 */

import type { ValidationError } from '@/types';

// Constants for validation
const MAX_COMPANY_LENGTH = 100;
const MAX_ROLE_LENGTH = 100;
const MIN_COMPANY_LENGTH = 2;
const MIN_ROLE_LENGTH = 2;

/**
 * Enhanced validation rules
 */
export const SecurityValidators = {
  /**
   * Validate company name with enhanced security
   */
  validateCompanyName(name: string): { valid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Company name is required' };
    }

    const trimmed = name.trim();

    // Length validation
    if (trimmed.length < MIN_COMPANY_LENGTH) {
      return {
        valid: false,
        error: `Company name must be at least ${MIN_COMPANY_LENGTH} characters`,
      };
    }

    if (trimmed.length > MAX_COMPANY_LENGTH) {
      return {
        valid: false,
        error: `Company name must be no more than ${MAX_COMPANY_LENGTH} characters`,
      };
    }

    // Pattern validation - alphanumeric, spaces, hyphens, ampersands only
    const regex = /^[a-zA-Z0-9\s\-&]{2,100}$/;
    if (!regex.test(trimmed)) {
      return {
        valid: false,
        error: 'Company name can only contain letters, numbers, spaces, hyphens, and ampersands',
      };
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPattern(trimmed)) {
      return {
        valid: false,
        error: 'Company name contains invalid characters',
      };
    }

    return { valid: true };
  },

  /**
   * Validate role with enhanced security
   */
  validateRole(role: string): { valid: boolean; error?: string } {
    if (!role || typeof role !== 'string') {
      return { valid: false, error: 'Role is required' };
    }

    const trimmed = role.trim();

    // Length validation
    if (trimmed.length < MIN_ROLE_LENGTH) {
      return {
        valid: false,
        error: `Role must be at least ${MIN_ROLE_LENGTH} characters`,
      };
    }

    if (trimmed.length > MAX_ROLE_LENGTH) {
      return {
        valid: false,
        error: `Role must be no more than ${MAX_ROLE_LENGTH} characters`,
      };
    }

    // Pattern validation
    const regex = /^[a-zA-Z0-9\s\-/]{2,100}$/;
    if (!regex.test(trimmed)) {
      return {
        valid: false,
        error: 'Role can only contain letters, numbers, spaces, hyphens, and forward slashes',
      };
    }

    // Check for suspicious patterns
    if (this.containsSuspiciousPattern(trimmed)) {
      return {
        valid: false,
        error: 'Role contains invalid characters',
      };
    }

    return { valid: true };
  },

  /**
   * Validate date with enhanced security
   */
  validateDate(dateString: string): { valid: boolean; error?: string } {
    if (!dateString || typeof dateString !== 'string') {
      return { valid: false, error: 'Date is required' };
    }

    // Check format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dateString)) {
      return { valid: false, error: 'Invalid date format' };
    }

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date' };
    }

    // Check if date is not in the future
    if (date > today) {
      return { valid: false, error: 'Date cannot be in the future' };
    }

    // Check if date is not too far in the past (reasonable limit: 10 years)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(today.getFullYear() - 10);
    if (date < tenYearsAgo) {
      return { valid: false, error: 'Date is too far in the past' };
    }

    return { valid: true };
  },

  /**
   * Validate status selection
   */
  validateStatus(status: string): { valid: boolean; error?: string } {
    const validStatuses = [
      'Applied',
      'Phone Screen',
      'Technical Interview',
      'Final Round',
      'Offer',
      'Rejected',
    ];

    if (!status || typeof status !== 'string') {
      return { valid: false, error: 'Status is required' };
    }

    if (!validStatuses.includes(status)) {
      return { valid: false, error: 'Invalid status selected' };
    }

    return { valid: true };
  },

  /**
   * Check for suspicious patterns that might indicate injection attempts
   */
  containsSuspiciousPattern(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick, onerror, etc.
      /data:text\/html/i,
      /vbscript:/i,
      /expression\(/i,
      /url\(/i,
      /import\s+/i,
      /from\s+/i,
      /eval\(/i,
      /Function\(/i,
      /\.\.\//, // Path traversal
      /\.\.\\/, // Windows path traversal
      // eslint-disable-next-line no-control-regex
      /\0/, // Null bytes
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(input));

    // Log suspicious patterns
    if (isSuspicious && typeof window !== 'undefined') {
      import('./securityLogger').then(({ securityLogger }) => {
        securityLogger.log({
          type: 'suspicious_input',
          message: 'Suspicious input pattern detected',
          details: { input: input.substring(0, 50) }, // Log first 50 chars only
        });
      });
    }

    return isSuspicious;
  },

  /**
   * Comprehensive application validation
   */
  validateApplication(
    company: string,
    role: string,
    dateApplied: string,
    status: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const companyValidation = this.validateCompanyName(company);
    if (!companyValidation.valid) {
      errors.push({
        field: 'company',
        message: companyValidation.error || 'Invalid company name',
      });
    }

    const roleValidation = this.validateRole(role);
    if (!roleValidation.valid) {
      errors.push({
        field: 'role',
        message: roleValidation.error || 'Invalid role',
      });
    }

    const dateValidation = this.validateDate(dateApplied);
    if (!dateValidation.valid) {
      errors.push({
        field: 'date',
        message: dateValidation.error || 'Invalid date',
      });
    }

    const statusValidation = this.validateStatus(status);
    if (!statusValidation.valid) {
      errors.push({
        field: 'status',
        message: statusValidation.error || 'Invalid status',
      });
    }

    return errors;
  },
};
