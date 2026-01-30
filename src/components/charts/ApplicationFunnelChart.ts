/**
 * Application Funnel Chart Component
 * Horizontal bar chart showing conversion rates through the application pipeline
 */

import { createChart, getStatusColor, defaultChartOptions } from '@/utils/chartHelpers';
import type { Chart, ChartConfiguration } from 'chart.js';

export interface FunnelChartData {
  funnelData: Array<{ stage: string; count: number; conversionRate: number }>;
}

let chartInstance: Chart | null = null;

export function createApplicationFunnelChart(
  canvas: HTMLCanvasElement,
  data: FunnelChartData
): Chart {
  // Destroy existing chart if present
  if (chartInstance) {
    chartInstance.destroy();
  }

  if (!data.funnelData || data.funnelData.length === 0) {
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

  const stages = data.funnelData.map(item => item.stage);
  const counts = data.funnelData.map(item => item.count);
  const conversionRates = data.funnelData.map(item => item.conversionRate);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: stages,
      datasets: [
        {
          label: 'Applications',
          data: counts,
          backgroundColor: stages.map(stage => getStatusColor(stage, 'background')),
          borderColor: stages.map(stage => getStatusColor(stage, 'border')),
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
          text: 'Application Funnel',
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
            afterLabel: context => {
              const index = context.dataIndex;
              const rate = conversionRates[index];
              if (index === 0) {
                return 'Starting point';
              }
              return `Conversion rate: ${rate}%`;
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

export function destroyApplicationFunnelChart(): void {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}
