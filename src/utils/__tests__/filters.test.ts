/**
 * Filter Manager Tests
 * Example test file showing how to test utility functions
 */

import { describe, it, expect } from 'vitest';
import { FilterManager } from '../filters';
import type { JobApplication, ApplicationFilters } from '@/types';

describe('FilterManager', () => {
  const mockApplications: JobApplication[] = [
    {
      id: '1',
      company: 'Google',
      role: 'Software Engineer',
      dateApplied: '2024-01-15',
      status: 'Applied',
      visaSponsorship: true,
      timestamp: Date.now(),
    },
    {
      id: '2',
      company: 'Microsoft',
      role: 'Data Analyst',
      dateApplied: '2024-01-10',
      status: 'Phone Screen',
      visaSponsorship: false,
      timestamp: Date.now() - 1000,
    },
    {
      id: '3',
      company: 'Amazon',
      role: 'Product Manager',
      dateApplied: '2024-01-20',
      status: 'Applied',
      visaSponsorship: true,
      timestamp: Date.now() - 2000,
    },
  ];

  it('should filter by search term (company name)', () => {
    const filters: ApplicationFilters = {
      search: 'Google',
      status: 'all',
      dateRange: 'all',
      visaSponsorship: 'all',
      tags: [],
    };

    const result = FilterManager.applyFilters(mockApplications, filters);
    expect(result).toHaveLength(1);
    expect(result[0]?.company).toBe('Google');
  });

  it('should filter by search term (role)', () => {
    const filters: ApplicationFilters = {
      search: 'Engineer',
      status: 'all',
      dateRange: 'all',
      visaSponsorship: 'all',
      tags: [],
    };

    const result = FilterManager.applyFilters(mockApplications, filters);
    expect(result).toHaveLength(1);
    expect(result[0]?.role).toBe('Software Engineer');
  });

  it('should filter by status', () => {
    const filters: ApplicationFilters = {
      search: '',
      status: 'Applied',
      dateRange: 'all',
      visaSponsorship: 'all',
      tags: [],
    };

    const result = FilterManager.applyFilters(mockApplications, filters);
    expect(result).toHaveLength(2);
    expect(result.every((app) => app.status === 'Applied')).toBe(true);
  });

  it('should filter by visa sponsorship', () => {
    const filters: ApplicationFilters = {
      search: '',
      status: 'all',
      dateRange: 'all',
      visaSponsorship: 'true',
      tags: [],
    };

    const result = FilterManager.applyFilters(mockApplications, filters);
    expect(result).toHaveLength(2);
    expect(result.every((app) => app.visaSponsorship === true)).toBe(true);
  });

  it('should return all applications when filters are empty', () => {
    const filters: ApplicationFilters = {
      search: '',
      status: 'all',
      dateRange: 'all',
      visaSponsorship: 'all',
      tags: [],
    };

    const result = FilterManager.applyFilters(mockApplications, filters);
    expect(result).toHaveLength(3);
  });

  it('should combine multiple filters', () => {
    const filters: ApplicationFilters = {
      search: 'Google',
      status: 'Applied',
      dateRange: 'all',
      visaSponsorship: 'true',
      tags: [],
    };

    const result = FilterManager.applyFilters(mockApplications, filters);
    expect(result).toHaveLength(1);
    expect(result[0]?.company).toBe('Google');
    expect(result[0]?.status).toBe('Applied');
    expect(result[0]?.visaSponsorship).toBe(true);
  });
});
