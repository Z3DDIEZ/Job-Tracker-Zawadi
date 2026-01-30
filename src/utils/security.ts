/**
 * Security Utilities
 * Provides secure functions for common operations
 */

/**
 * Validate Firebase path component (application ID)
 * Prevents path traversal and injection attacks
 */
export function validateFirebaseId(id: string): boolean {
  // Firebase keys are alphanumeric, max 768 chars
  // Allow only alphanumeric, hyphens, underscores
  const idPattern = /^[a-zA-Z0-9_-]{1,768}$/;
  return idPattern.test(id);
}

/**
 * Sanitize string for safe HTML display
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') {
    return '';
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return unsafe.replace(/[&<>"']/g, m => map[m] || m);
}

/**
 * Sanitize and validate user input
 * Combines validation and sanitization
 */
export function sanitizeUserInput(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate application ID before database operations
 * Throws error if invalid
 */
export function validateApplicationId(id: string): void {
  if (!id || typeof id !== 'string') {
    const error = new Error('Invalid application ID: ID is required');
    // Log security event
    if (typeof window !== 'undefined') {
      import('./securityLogger').then(({ securityLogger }) => {
        securityLogger.log({
          type: 'invalid_id',
          message: 'Attempted to use invalid application ID',
          details: { id, reason: 'missing_or_invalid_type' },
        });
      });
    }
    throw error;
  }

  if (!validateFirebaseId(id)) {
    const error = new Error('Invalid application ID: ID format is invalid');
    // Log security event
    if (typeof window !== 'undefined') {
      import('./securityLogger').then(({ securityLogger }) => {
        securityLogger.log({
          type: 'invalid_id',
          message: 'Attempted to use invalid application ID format',
          details: { id, reason: 'invalid_format' },
        });
      });
    }
    throw error;
  }
}

/**
 * Rate limiter for Firebase operations
 * Prevents abuse and DoS attacks
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   * Returns true if allowed, false if rate limited
   */
  isAllowed(key: string = 'default'): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => now - timestamp < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return true;
  }

  /**
   * Reset rate limiter for a key
   */
  reset(key: string = 'default'): void {
    this.requests.delete(key);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(10, 1000); // 10 requests per second

/**
 * Secure DOM element creation
 * Creates elements with text content instead of innerHTML
 */
export function createSecureElement(
  tag: string,
  className?: string,
  textContent?: string
): HTMLElement {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
}

/**
 * Secure attribute setting
 * Validates and sets attributes safely
 */
export function setSecureAttribute(element: HTMLElement, name: string, value: string): void {
  if (!value || typeof value !== 'string') {
    return;
  }

  // Whitelist of safe attributes
  const safeAttributes = [
    'id',
    'class',
    'data-id',
    'type',
    'placeholder',
    'for',
    'title',
    'alt',
    'src',
    'href',
  ];

  if (safeAttributes.includes(name.toLowerCase())) {
    element.setAttribute(name, escapeHtml(value));
  } else {
    console.warn(`Attempted to set unsafe attribute: ${name}`);
  }
}
