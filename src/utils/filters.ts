/**
 * Filtering Logic
 * Pure functions for filtering applications
 */

import type { JobApplication, ApplicationFilters } from '@/types';

export const FilterManager = {
  applyFilters(applications: JobApplication[], filters: ApplicationFilters): JobApplication[] {
    let filtered = [...applications];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        app =>
          (app.company || '').toLowerCase().includes(searchTerm) ||
          (app.role || '').toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Visa sponsorship filter
    if (filters.visaSponsorship !== 'all') {
      const requiresVisa = filters.visaSponsorship === 'true';
      filtered = filtered.filter(app => app.visaSponsorship === requiresVisa);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = Date.now();
      const ranges: Record<string, number> = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        quarter: 90 * 24 * 60 * 60 * 1000,
      };

      const rangeMs = ranges[filters.dateRange];
      if (rangeMs) {
        filtered = filtered.filter(app => {
          const appDate = new Date(app.dateApplied).getTime();
          return now - appDate <= rangeMs;
        });
      }
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(app => {
        if (!app.tags || app.tags.length === 0) {
          return false; // No tags on application, doesn't match
        }

        // Check if application has any of the selected tags
        return filters.tags.some(selectedTagId =>
          app.tags!.some(appTag => appTag.id === selectedTagId)
        );
      });
    }

    return filtered;
  },
};
