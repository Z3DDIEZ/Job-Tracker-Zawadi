/**
 * Sorting Logic
 * Pure functions for sorting applications
 */

import type { JobApplication, SortOption } from '@/types';

const STATUS_ORDER: Array<JobApplication['status']> = [
  'Applied',
  'Phone Screen',
  'Technical Interview',
  'Final Round',
  'Offer',
  'Rejected',
];

export const SortManager = {
  sort(applications: JobApplication[], sortBy: SortOption): JobApplication[] {
    const sorted = [...applications];

    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => b.timestamp - a.timestamp);
      case 'date-asc':
        return sorted.sort((a, b) => a.timestamp - b.timestamp);
      case 'company-asc':
        return sorted.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
      case 'company-desc':
        return sorted.sort((a, b) => (b.company || '').localeCompare(a.company || ''));
      case 'status':
        return sorted.sort((a, b) => {
          const aIndex = STATUS_ORDER.indexOf(a.status);
          const bIndex = STATUS_ORDER.indexOf(b.status);
          return aIndex - bIndex;
        });
      default:
        return sorted;
    }
  },
};
