/**
 * Secure Error Handling
 * Prevents information leakage through error messages
 */

import { securityLogger } from './securityLogger';

/**
 * Sanitize error messages for user display
 * Prevents information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  // Don't expose internal errors to users
  if (error instanceof Error) {
    // Log full error for debugging
    console.error('Error details:', error);

    // Log security-relevant errors
    if (error.message.includes('Invalid') || error.message.includes('Security')) {
      securityLogger.log({
        type: 'unauthorized_access',
        message: 'Security validation error',
        details: { error: error.message.substring(0, 100) },
      });
    }

    // Return generic message to user
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'You do not have permission to perform this action.';
    }

    if (error.message.includes('network') || error.message.includes('connection')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      return 'Service limit reached. Please try again later.';
    }
  }

  // Generic fallback
  return 'An error occurred. Please try again.';
}

/**
 * Handle Firebase errors securely
 */
export function handleFirebaseError(error: unknown, operation: string): void {
  const errorMessage = sanitizeErrorMessage(error);

  securityLogger.log({
    type: 'unauthorized_access',
    message: `Firebase error in ${operation}`,
    details: { operation, error: String(error).substring(0, 100) },
  });

  // Re-throw with sanitized message
  throw new Error(errorMessage);
}
