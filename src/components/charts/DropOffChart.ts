/**
 * Drop-off Analysis Chart Component
 * Visualizes drop-off rates between application stages
 * Shows where applications are losing momentum in the pipeline
 */

import { createChart, defaultChartOptions, chartColors } from '@/utils/chartHelpers';
import type { Chart, ChartConfiguration } from 'chart.js';

export interface DropOffChartData {
  dropOffAnalysis: Array<{
    fromStage: string;
    toStage: string;
    dropOffRate: number;
    count: number;
  }>;
}

let chartInstance: Chart | null = null;

/**
 * Create a drop-off analysis chart
 * Shows drop-off rates between stages as a horizontal bar chart
 */
export function createDropOffChart(canvas: HTMLCanvasElement, data: DropOffChartData): Chart {
  // Destroy existing chart if present
  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!data.dropOffAnalysis || data.dropOffAnalysis.length === 0) {
    // Show empty state
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No drop-off data available', canvas.width / 2, canvas.height / 2);
    }
    return chartInstance as Chart;
  }

  // Prepare data for chart
  const labels = data.dropOffAnalysis.map(item => `${item.fromStage} → ${item.toStage}`);
  const dropOffRates = data.dropOffAnalysis.map(item => item.dropOffRate);
  const dropOffCounts = data.dropOffAnalysis.map(item => item.count);

  // Color bars based on drop-off rate (higher = more concerning = redder)
  const backgroundColors = dropOffRates.map(rate => {
    if (rate >= 70) return chartColors.rejected; // High drop-off
    if (rate >= 50) return chartColors.phoneScreen; // Medium-high drop-off
    if (rate >= 30) return chartColors.technicalInterview; // Medium drop-off
    return chartColors.applied; // Low drop-off
  });

  const borderColors = dropOffRates.map(rate => {
    if (rate >= 70) return chartColors.rejectedBorder;
    if (rate >= 50) return chartColors.phoneScreenBorder;
    if (rate >= 30) return chartColors.technicalInterviewBorder;
    return chartColors.appliedBorder;
  });

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Drop-off Rate (%)',
          data: dropOffRates,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
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
          text: 'Drop-off Analysis Between Stages',
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
              const index = context.dataIndex;
              const rate = dropOffRates[index];
              const count = dropOffCounts[index];
              return [`Drop-off rate: ${rate}%`, `Applications dropped: ${count}`];
            },
            afterLabel: context => {
              const index = context.dataIndex;
              const item = data.dropOffAnalysis[index];
              if (!item) return '';
              return `Transition: ${item.fromStage} → ${item.toStage}`;
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
          max: 100,
          ticks: {
            callback: function (value) {
              return value + '%';
            },
            font: {
              size: 11,
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          title: {
            display: true,
            text: 'Drop-off Rate (%)',
            font: {
              size: 12,
              weight: 'bold',
            },
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

/**
 * Destroy the drop-off chart instance
 */
export function destroyDropOffChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
