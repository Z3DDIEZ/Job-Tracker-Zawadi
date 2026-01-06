/**
 * Security Event Logger
 * Logs security-related events for monitoring and auditing
 */

export interface SecurityEvent {
  type:
    | 'invalid_id'
    | 'validation_failed'
    | 'rate_limited'
    | 'suspicious_input'
    | 'xss_attempt'
    | 'injection_attempt'
    | 'unauthorized_access'
    | 'authentication_failure';
  message: string;
  details?: Record<string, unknown>;
  timestamp?: number;
  userAgent?: string;
  url?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 100; // Keep last 100 events in memory
  private readonly storageKey = 'security_events';

  /**
   * Log a security event
   */
  log(event: SecurityEvent): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Add to memory
    this.events.push(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // Remove oldest
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn('🔒 Security Event:', fullEvent);
    }

    // Store in localStorage (limited, for client-side analysis)
    this.saveToStorage(fullEvent);

    // In production, you might want to send to a logging service
    // this.sendToLoggingService(fullEvent);
  }

  /**
   * Save event to localStorage (limited storage)
   */
  private saveToStorage(event: SecurityEvent): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const events: SecurityEvent[] = stored ? JSON.parse(stored) : [];
      
      events.push(event);
      
      // Keep only last 50 events in storage
      if (events.length > 50) {
        events.shift();
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(events));
    } catch (error) {
      // Silently fail - don't break app if storage is full
      console.error('Failed to save security event:', error);
    }
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit: number = 10): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Get event count by type
   */
  getEventCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.events.forEach((event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();
