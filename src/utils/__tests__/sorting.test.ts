/**
 * Sort Manager Tests
 */

import { describe, it, expect } from 'vitest';
import { SortManager } from '../sorting';
import type { JobApplication, SortOption } from '@/types';

describe('SortManager', () => {
  const mockApplications: JobApplication[] = [
    {
      id: '1',
      company: 'Google',
      role: 'Engineer',
      dateApplied: '2024-01-15',
      status: 'Applied',
      visaSponsorship: true,
      timestamp: 1000,
    },
    {
      id: '2',
      company: 'Amazon',
      role: 'Manager',
      dateApplied: '2024-01-10',
      status: 'Phone Screen',
      visaSponsorship: false,
      timestamp: 2000,
    },
    {
      id: '3',
      company: 'Microsoft',
      role: 'Analyst',
      dateApplied: '2024-01-20',
      status: 'Offer',
      visaSponsorship: true,
      timestamp: 500,
    },
  ];

  it('should sort by date descending (newest first)', () => {
    const result = SortManager.sort(mockApplications, 'date-desc');
    expect(result[0].timestamp).toBe(2000);
    expect(result[1].timestamp).toBe(1000);
    expect(result[2].timestamp).toBe(500);
  });

  it('should sort by date ascending (oldest first)', () => {
    const result = SortManager.sort(mockApplications, 'date-asc');
    expect(result[0].timestamp).toBe(500);
    expect(result[1].timestamp).toBe(1000);
    expect(result[2].timestamp).toBe(2000);
  });

  it('should sort by company name A-Z', () => {
    const result = SortManager.sort(mockApplications, 'company-asc');
    expect(result[0].company).toBe('Amazon');
    expect(result[1].company).toBe('Google');
    expect(result[2].company).toBe('Microsoft');
  });

  it('should sort by company name Z-A', () => {
    const result = SortManager.sort(mockApplications, 'company-desc');
    expect(result[0].company).toBe('Microsoft');
    expect(result[1].company).toBe('Google');
    expect(result[2].company).toBe('Amazon');
  });

  it('should sort by status order', () => {
    const result = SortManager.sort(mockApplications, 'status');
    expect(result[0].status).toBe('Applied');
    expect(result[1].status).toBe('Phone Screen');
    expect(result[2].status).toBe('Offer');
  });
});
