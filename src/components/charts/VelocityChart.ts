/**
 * Velocity Chart Component
 * Line chart showing weekly application velocity over time
 */

import { createChart, defaultChartOptions, chartColors } from '@/utils/chartHelpers';
import type { Chart, ChartConfiguration } from 'chart.js';

export interface VelocityChartData {
  weeklyVelocity: Array<{ week: string; count: number }>;
}

let chartInstance: Chart | null = null;

/**
 * Format week string for display (e.g., "2024-01-01" -> "Jan 1")
 */
function formatWeekLabel(weekString: string): string {
  try {
    const date = new Date(weekString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    return weekString;
  }
}

export function createVelocityChart(
  canvas: HTMLCanvasElement,
  data: VelocityChartData
): Chart {
  // Destroy existing chart if present
  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!data.weeklyVelocity || data.weeklyVelocity.length === 0) {
    // Show empty state
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
    }
    return chartInstance as Chart;
  }

  const labels = data.weeklyVelocity.map((item) => formatWeekLabel(item.week));
  const counts = data.weeklyVelocity.map((item) => item.count);

  // Calculate average
  const average =
    counts.reduce((sum, count) => sum + count, 0) / counts.length;

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Applications per Week',
          data: counts,
          borderColor: chartColors.accent,
          backgroundColor: chartColors.accentLight + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: chartColors.accent,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
        {
          label: 'Average',
          data: Array(counts.length).fill(average),
          borderColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: 'Weekly Application Velocity',
          font: {
            size: 16,
            weight: 'bold',
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            afterLabel: (context) => {
              if (context.datasetIndex === 0) {
                return `Week of ${data.weeklyVelocity[context.dataIndex]?.week || ''}`;
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            font: {
              size: 10,
            },
            maxRotation: 45,
            minRotation: 45,
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11,
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
        },
      },
    },
  };

  chartInstance = createChart(canvas, config);
  return chartInstance;
}

export function destroyVelocityChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
