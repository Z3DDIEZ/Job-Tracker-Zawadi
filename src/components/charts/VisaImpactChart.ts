/**
 * Visa Impact Comparison Chart
 * Compares success rates and response rates for applications with and without visa sponsorship
 */

import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import { createChart, chartColors, defaultChartOptions } from '../../utils/chartHelpers';

Chart.register(...registerables);

export interface VisaImpactData {
  withVisa: { total: number; offers: number; successRate: number; responseRate: number };
  withoutVisa: { total: number; offers: number; successRate: number; responseRate: number };
}

/**
 * Create a visa impact comparison chart
 */
export function createVisaImpactChart(
  canvas: HTMLCanvasElement,
  data: VisaImpactData
): Chart {
  const { withVisa, withoutVisa } = data;

  // Prepare data for comparison
  const labels = ['Success Rate', 'Response Rate'];
  const withVisaData = [withVisa.successRate, withVisa.responseRate];
  const withoutVisaData = [withoutVisa.successRate, withoutVisa.responseRate];

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'With Visa Sponsorship',
          data: withVisaData,
          backgroundColor: chartColors.offer,
          borderColor: chartColors.offerBorder,
          borderWidth: 2,
        },
        {
          label: 'Without Visa Sponsorship',
          data: withoutVisaData,
          backgroundColor: chartColors.applied,
          borderColor: chartColors.appliedBorder,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...defaultChartOptions,
      scales: {
        y: {
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
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
          },
        },
      },
      plugins: {
        ...defaultChartOptions.plugins,
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const datasetIndex = context.datasetIndex;
              
              if (datasetIndex === 0) {
                // With visa
                const total = withVisa.total;
                const offers = withVisa.offers;
                return [
                  `${label}: ${value}%`,
                  `Total: ${total} applications`,
                  `Offers: ${offers}`,
                ];
              } else {
                // Without visa
                const total = withoutVisa.total;
                const offers = withoutVisa.offers;
                return [
                  `${label}: ${value}%`,
                  `Total: ${total} applications`,
                  `Offers: ${offers}`,
                ];
              }
            },
          },
        },
        legend: {
          ...defaultChartOptions.plugins?.legend,
          position: 'top',
        },
      },
    },
  };

  return createChart(canvas, config);
}
