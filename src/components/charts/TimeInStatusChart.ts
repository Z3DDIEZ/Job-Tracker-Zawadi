/**
 * Time in Status Chart Component
 * Horizontal bar chart showing average days spent in each status
 */

import { createChart, getStatusColor, defaultChartOptions } from '@/utils/chartHelpers';
import type { Chart, ChartConfiguration } from 'chart.js';
import type { ApplicationStatus } from '@/types';

export interface TimeInStatusChartData {
  averageTimeInStatus: Record<ApplicationStatus, number>;
}

let chartInstance: Chart | null = null;

export function createTimeInStatusChart(
  canvas: HTMLCanvasElement,
  data: TimeInStatusChartData
): Chart {
  // Destroy existing chart if present
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Filter out statuses with zero time
  const statuses = Object.keys(data.averageTimeInStatus) as ApplicationStatus[];
  const filteredData = statuses
    .map(status => ({
      status,
      days: data.averageTimeInStatus[status] || 0,
    }))
    .filter(item => item.days > 0);

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

  const labels = filteredData.map(item => item.status);
  const days = filteredData.map(item => item.days);

  // Find max for highlighting
  const maxDays = Math.max(...days);
  const maxIndex = days.indexOf(maxDays);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Average Days',
          data: days,
          backgroundColor: labels.map((status, index) => {
            // Highlight the longest time
            if (index === maxIndex) {
              const baseColor = getStatusColor(status, 'background');
              // Make it slightly darker for emphasis
              return baseColor;
            }
            return getStatusColor(status, 'background');
          }),
          borderColor: labels.map(status => getStatusColor(status, 'border')),
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...defaultChartOptions,
      indexAxis: 'y', // Horizontal bar chart
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: 'Average Time in Status',
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
            label: context => {
              const days = context.parsed.x;
              return `Average: ${days} day${days !== 1 ? 's' : ''}`;
            },
          },
        },
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11,
            },
            callback: value => {
              return `${value} day${value !== 1 ? 's' : ''}`;
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
        },
        y: {
          ticks: {
            font: {
              size: 11,
            },
          },
          grid: {
            display: false,
          },
        },
      },
    },
  };

  chartInstance = createChart(canvas, config);
  return chartInstance;
}

export function destroyTimeInStatusChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
