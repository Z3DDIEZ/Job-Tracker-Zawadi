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
}

export interface ApplicationFilters {
  search: string;
  status: ApplicationStatus | 'all';
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  visaSponsorship: 'all' | 'true' | 'false';
}

export type SortOption =
  | 'date-desc'
  | 'date-asc'
  | 'company-asc'
  | 'company-desc'
  | 'status';

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
  type: 'application_added' | 'application_updated' | 'application_deleted' | 'filter_applied' | 'status_changed';
  data?: Record<string, unknown>;
  timestamp: number;
}
