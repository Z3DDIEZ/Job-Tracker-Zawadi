/**
 * Event Tracking Service
 * Tracks user behavior and application patterns for behavioral analytics
 */

export type UserEventType =
  | 'application_added'
  | 'application_updated'
  | 'application_deleted'
  | 'status_changed'
  | 'filter_applied'
  | 'view_mode_changed'
  | 'export_csv'
  | 'export_chart'
  | 'analytics_viewed'
  | 'search_performed';

export interface UserEvent {
  type: UserEventType;
  timestamp: number;
  data?: Record<string, unknown>;
  sessionId?: string;
}

class EventTrackingService {
  private events: UserEvent[] = [];
  private readonly maxEvents = 500; // Keep last 500 events in memory
  private readonly storageKey = 'user_events';
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a session ID for this browser session
   */
  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('session_id');
    if (stored) {
      return stored;
    }
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('session_id', newSessionId);
    return newSessionId;
  }

  /**
   * Track a user event
   */
  track(eventType: UserEventType, data?: Record<string, unknown>): void {
    const event: UserEvent = {
      type: eventType,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
    };

    // Add to memory
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // Remove oldest
    }

    // Store in localStorage for persistence
    this.saveToStorage(event);

    // Log in development
    if (import.meta.env.DEV) {
      console.log('📊 Event Tracked:', event);
    }
  }

  /**
   * Save event to localStorage
   */
  private saveToStorage(event: UserEvent): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const events: UserEvent[] = stored ? JSON.parse(stored) : [];
      
      events.push(event);
      
      // Keep only last 1000 events in localStorage
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to save event to storage:', error);
    }
  }

  /**
   * Get all tracked events
   */
  getEvents(): UserEvent[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load events from storage:', error);
      return [];
    }
  }

  /**
   * Get events by type
   */
  getEventsByType(type: UserEventType): UserEvent[] {
    return this.getEvents().filter((event) => event.type === type);
  }

  /**
   * Get events in a time range
   */
  getEventsInRange(startTime: number, endTime: number): UserEvent[] {
    return this.getEvents().filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Clear all events (for testing or privacy)
   */
  clearEvents(): void {
    this.events = [];
    localStorage.removeItem(this.storageKey);
    console.log('Events cleared');
  }

  /**
   * Get event statistics
   */
  getEventStats(): {
    totalEvents: number;
    eventsByType: Record<UserEventType, number>;
    firstEventTime: number | null;
    lastEventTime: number | null;
  } {
    const allEvents = this.getEvents();
    
    const eventsByType = allEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<UserEventType, number>
    );

    const timestamps = allEvents.map((e) => e.timestamp);
    
    return {
      totalEvents: allEvents.length,
      eventsByType,
      firstEventTime: timestamps.length > 0 ? Math.min(...timestamps) : null,
      lastEventTime: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }
}

// Export singleton instance
export const eventTrackingService = new EventTrackingService();
