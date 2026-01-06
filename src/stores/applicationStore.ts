/**
 * Application State Management using Nanostores
 * Provides reactive, predictable state updates
 */

import { atom, map } from 'nanostores';
import { persistentMap } from '@nanostores/persistent';
import type {
  JobApplication,
  ApplicationFilters,
  SortOption,
} from '@/types';

// Core application state
export const applications = atom<JobApplication[]>([]);
export const filteredApplications = atom<JobApplication[]>([]);
export const currentEditId = atom<string | null>(null);

// Persistent filters and sort preferences
export const filters = persistentMap<ApplicationFilters>(
  'job-tracker-filters',
  {
    search: '',
    status: 'all',
    dateRange: 'all',
    visaSponsorship: 'all',
  }
);

export const sortBy = persistentMap<{ value: SortOption }>(
  'job-tracker-sort',
  { value: 'date-desc' }
);

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
  filters.setKey(key, value);
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
