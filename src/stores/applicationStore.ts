/**
 * Application State Management using Nanostores
 * Provides reactive, predictable state updates
 */

import { atom, map } from 'nanostores';
import { persistentMap, persistentAtom } from '@nanostores/persistent';
import type { JobApplication, ApplicationFilters, SortOption } from '@/types';

// Core application state
// Use persistentAtom to cache applications for offline access
export const applications = persistentAtom<JobApplication[]>('job-tracker-applications', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});
export const filteredApplications = atom<JobApplication[]>([]);
export const currentEditId = atom<string | null>(null);

// Persistent filters and sort preferences
// Using Record<string, string> to satisfy persistentMap requirements
type FilterStore = Record<string, string> & {
  search: string;
  status: string;
  dateRange: string;
  visaSponsorship: string;
};

export const filters = persistentMap<FilterStore>('job-tracker-filters', {
  search: '',
  status: 'all',
  dateRange: 'all',
  visaSponsorship: 'all',
});

export const sortBy = persistentMap<{ value: SortOption }>('job-tracker-sort', {
  value: 'date-desc',
});

// Cache state
export const cache = map<{
  data: JobApplication[] | null;
  timestamp: number | null;
  isValid: boolean;
}>({
  data: null,
  timestamp: null,
  isValid: false,
});

// Helper functions for state updates
export function setApplications(apps: JobApplication[]): void {
  applications.set(apps);
}

export function setFilteredApplications(apps: JobApplication[]): void {
  filteredApplications.set(apps);
}

export function setCurrentEditId(id: string | null): void {
  currentEditId.set(id);
}

export function updateFilter<K extends keyof ApplicationFilters>(
  key: K,
  value: ApplicationFilters[K]
): void {
  filters.setKey(key as string, String(value));
}

export function resetFilters(): void {
  filters.set({
    search: '',
    status: 'all',
    dateRange: 'all',
    visaSponsorship: 'all',
  });
}

export function setSortPreference(sort: SortOption): void {
  sortBy.set({ value: sort });
}
