/**
 * Status Distribution Chart Component
 * Pie/Donut chart showing distribution of applications across statuses
 */

import { createChart, getStatusColor, defaultChartOptions } from '@/utils/chartHelpers';
import type { Chart, ChartConfiguration } from 'chart.js';
import type { ApplicationStatus } from '@/types';

export interface StatusDistributionData {
  statusDistribution: Record<ApplicationStatus, number>;
}

let chartInstance: Chart | null = null;

export function createStatusDistributionChart(
  canvas: HTMLCanvasElement,
  data: StatusDistributionData
): Chart {
  // Destroy existing chart if present
  if (chartInstance) {
    chartInstance.destroy();
  }

  const statuses = Object.keys(data.statusDistribution) as ApplicationStatus[];
  const counts = statuses.map(status => data.statusDistribution[status] || 0);

  // Filter out zero values for cleaner chart
  const filteredData = statuses
    .map((status, index) => ({ status, count: counts[index] || 0 }))
    .filter(item => item.count > 0);

  if (filteredData.length === 0) {
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

  const config: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: filteredData.map(item => item.status),
      datasets: [
        {
          label: 'Applications',
          data: filteredData
            .map(item => item.count)
            .filter((count): count is number => count !== undefined),
          backgroundColor: filteredData.map(item => getStatusColor(item.status, 'background')),
          borderColor: filteredData.map(item => getStatusColor(item.status, 'border')),
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: 'Status Distribution',
          font: {
            size: 16,
            weight: 'bold',
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
      },
    },
  };

  chartInstance = createChart(canvas, config);
  return chartInstance;
}

export function destroyStatusDistributionChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
