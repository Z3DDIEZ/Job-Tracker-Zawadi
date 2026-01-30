/**
 * Core Type Definitions
 * Defines the data structures for the Job Application Tracker
 */

export type ApplicationStatus =
  | 'Applied'
  | 'Phone Screen'
  | 'Technical Interview'
  | 'Final Round'
  | 'Offer'
  | 'Rejected';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  dateApplied: string;
  status: ApplicationStatus;
  visaSponsorship: boolean;
  timestamp: number;
  updatedAt?: number;
  tags?: Tag[];
}

export interface ApplicationFilters {
  search: string;
  status: ApplicationStatus | 'all';
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  visaSponsorship: 'all' | 'true' | 'false';
  tags: string[]; // Array of tag IDs to filter by
}

export type SortOption = 'date-desc' | 'date-asc' | 'company-asc' | 'company-desc' | 'status';

export interface AppState {
  applications: JobApplication[];
  filteredApplications: JobApplication[];
  currentEditId: string | null;
  sortBy: SortOption;
  filters: ApplicationFilters;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface CacheData {
  data: JobApplication[] | null;
  timestamp: number | null;
  isValid: boolean;
}

export interface AnalyticsEvent {
  type:
    | 'application_added'
    | 'application_updated'
    | 'application_deleted'
    | 'filter_applied'
    | 'status_changed';
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface AnalyticsMetrics {
  totalApplications: number;
  successRate: number;
  responseRate: number;
  averageTimeInStatus: Record<ApplicationStatus, number>;
  statusDistribution: Record<ApplicationStatus, number>;
  weeklyVelocity: Array<{ week: string; count: number }>;
  funnelData: Array<{ stage: string; count: number; conversionRate: number }>;
  dropOffAnalysis?: Array<{
    fromStage: string;
    toStage: string;
    dropOffRate: number;
    count: number;
  }>;
  timingAnalysis?: {
    byDayOfWeek: Record<string, { count: number; successRate: number }>;
    byWeekOfMonth: Record<string, { count: number; successRate: number }>;
  };
  visaImpact?: {
    withVisa: { total: number; offers: number; successRate: number; responseRate: number };
    withoutVisa: { total: number; offers: number; successRate: number; responseRate: number };
  };
}

// Authentication Types
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  emailVerified: boolean;
}

export interface AuthError {
  code: string;
  message: string;
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthStateChangeCallback {
  (user: User | null): void;
}

// Tagging Types
export type TagCategory =
  | 'industry'
  | 'role-type'
  | 'company-size'
  | 'location'
  | 'seniority'
  | 'remote-work';

export interface Tag {
  id: string;
  name: string;
  category: TagCategory;
  color?: string;
}

export interface TagSuggestion {
  tag: Tag;
  confidence: number; // 0-1, how confident the system is in this suggestion
  reason: string; // Why this tag was suggested
}

export interface TaggedJobApplication extends JobApplication {
  tags: Tag[];
  suggestedTags?: TagSuggestion[];
}
