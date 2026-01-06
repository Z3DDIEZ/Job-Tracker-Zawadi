/**
 * Chart.js Helper Utilities
 * Provides utilities for creating and managing charts
 */

import { Chart, registerables, type ChartConfiguration } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

/**
 * Create a Chart.js chart instance
 */
export function createChart(
  canvas: HTMLCanvasElement,
  config: ChartConfiguration
): Chart {
  return new Chart(canvas, config);
}

/**
 * Destroy a chart instance
 */
export function destroyChart(chart: Chart | null): void {
  if (chart) {
    chart.destroy();
  }
}

/**
 * Get Chart.js color palette matching our design system
 */
export const chartColors = {
  // Status colors matching CSS
  applied: '#dbeafe',
  phoneScreen: '#fef3c7',
  technicalInterview: '#fce7f3',
  finalRound: '#e0e7ff',
  offer: '#d1fae5',
  rejected: '#fee2e2',

  // Border colors
  appliedBorder: '#93c5fd',
  phoneScreenBorder: '#fde68a',
  technicalInterviewBorder: '#fbcfe8',
  finalRoundBorder: '#c7d2fe',
  offerBorder: '#6ee7b7',
  rejectedBorder: '#fecaca',

  // Text colors
  appliedText: '#1e40af',
  phoneScreenText: '#b45309',
  technicalInterviewText: '#be185d',
  finalRoundText: '#4338ca',
  offerText: '#059669',
  rejectedText: '#dc2626',

  // Accent
  accent: '#d97706',
  accentLight: '#f59e0b',
};

/**
 * Get color for a specific status
 */
export function getStatusColor(
  status: string,
  type: 'background' | 'border' | 'text' = 'background'
): string {
  const statusMap: Record<string, Record<string, string>> = {
    Applied: {
      background: chartColors.applied,
      border: chartColors.appliedBorder,
      text: chartColors.appliedText,
    },
    'Phone Screen': {
      background: chartColors.phoneScreen,
      border: chartColors.phoneScreenBorder,
      text: chartColors.phoneScreenText,
    },
    'Technical Interview': {
      background: chartColors.technicalInterview,
      border: chartColors.technicalInterviewBorder,
      text: chartColors.technicalInterviewText,
    },
    'Final Round': {
      background: chartColors.finalRound,
      border: chartColors.finalRoundBorder,
      text: chartColors.finalRoundText,
    },
    Offer: {
      background: chartColors.offer,
      border: chartColors.offerBorder,
      text: chartColors.offerText,
    },
    Rejected: {
      background: chartColors.rejected,
      border: chartColors.rejectedBorder,
      text: chartColors.rejectedText,
    },
  };

  return statusMap[status]?.[type] || chartColors.applied;
}

/**
 * Default chart options
 */
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 15,
        usePointStyle: true,
        font: {
          size: 12,
          family: "'Inter', sans-serif",
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold' as const,
      },
      bodyFont: {
        size: 12,
      },
      borderColor: '#d97706',
      borderWidth: 1,
    },
  },
};
