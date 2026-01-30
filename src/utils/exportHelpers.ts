/**
 * Export Utilities
 * Functions for exporting data and charts
 */

import type { JobApplication } from '@/types';
import type { Chart } from 'chart.js';

/**
 * Export applications to CSV
 */
export function exportToCSV(
  applications: JobApplication[],
  filename: string = 'job-applications.csv'
): void {
  if (applications.length === 0) {
    alert('No applications to export');
    return;
  }

  // CSV Headers
  const headers = ['Company', 'Role', 'Date Applied', 'Status', 'Visa Sponsorship', 'Timestamp'];

  // Convert applications to CSV rows
  const rows = applications.map(app => {
    return [
      escapeCSVField(app.company || ''),
      escapeCSVField(app.role || ''),
      app.dateApplied || '',
      app.status || '',
      app.visaSponsorship ? 'Yes' : 'No',
      app.timestamp ? new Date(app.timestamp).toISOString() : '',
    ];
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Export chart as PNG image
 */
export function exportChartAsPNG(chart: Chart | null, filename: string = 'chart.png'): void {
  if (!chart) {
    alert('Chart not available for export');
    return;
  }

  const canvas = chart.canvas;
  if (!canvas) {
    alert('Chart canvas not found');
    return;
  }

  // Get chart image as data URL
  const url = canvas.toDataURL('image/png');

  // Create download link
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get chart instance by canvas ID
 */
export function getChartInstance(canvasId: string): Chart | null {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return null;

  // Chart.js stores chart instance on canvas element
  // @ts-expect-error - Chart.js internal property
  return canvas.chart || null;
}
