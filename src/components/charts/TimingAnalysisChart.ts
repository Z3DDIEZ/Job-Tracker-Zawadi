/**
 * Timing Analysis Chart Component
 * Visualizes optimal application timing based on success rates
 * Shows day of week and week of month analysis
 */

import { createChart, chartColors, defaultChartOptions } from '@/utils/chartHelpers';
import type { Chart, ChartConfiguration } from 'chart.js';

export interface TimingAnalysisData {
  byDayOfWeek: Record<string, { count: number; successRate: number }>;
  byWeekOfMonth: Record<string, { count: number; successRate: number }>;
}

let dayOfWeekChartInstance: Chart | null = null;
let weekOfMonthChartInstance: Chart | null = null;

/**
 * Create a day of week timing analysis chart
 */
export function createDayOfWeekChart(canvas: HTMLCanvasElement, data: TimingAnalysisData): Chart {
  // Destroy existing chart if present
  if (dayOfWeekChartInstance) {
    dayOfWeekChartInstance.destroy();
  }

  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData = dayOrder
    .map(day => {
      const dayInfo = data.byDayOfWeek[day];
      return {
        day,
        count: dayInfo?.count || 0,
        successRate: dayInfo?.successRate || 0,
      };
    })
    .filter(item => item.count > 0); // Only show days with data

  if (dayData.length === 0) {
    // Show empty state
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No timing data available', canvas.width / 2, canvas.height / 2);
    }
    return dayOfWeekChartInstance as Chart;
  }

  const labels = dayData.map(item => item.day.substring(0, 3)); // Abbreviated day names
  const successRates = dayData.map(item => item.successRate);
  const counts = dayData.map(item => item.count);

  // Color bars based on success rate (higher = better = greener)
  const backgroundColors = successRates.map(rate => {
    if (rate >= 20) return chartColors.offer;
    if (rate >= 10) return chartColors.finalRound;
    if (rate >= 5) return chartColors.technicalInterview;
    return chartColors.applied;
  });

  const borderColors = successRates.map(rate => {
    if (rate >= 20) return chartColors.offerBorder;
    if (rate >= 10) return chartColors.finalRoundBorder;
    if (rate >= 5) return chartColors.technicalInterviewBorder;
    return chartColors.appliedBorder;
  });

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Success Rate (%)',
          data: successRates,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
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
          text: 'Success Rate by Day of Week',
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
              const rate = successRates[index];
              const count = counts[index];
              return [`Success rate: ${rate}%`, `Applications: ${count}`];
            },
          },
        },
        legend: {
          display: false,
        },
      },
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
            color: 'rgba(148, 163, 184, 0.1)',
          },
          title: {
            display: true,
            text: 'Success Rate (%)',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
        },
        x: {
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

  dayOfWeekChartInstance = createChart(canvas, config);
  return dayOfWeekChartInstance;
}

/**
 * Create a week of month timing analysis chart
 */
export function createWeekOfMonthChart(canvas: HTMLCanvasElement, data: TimingAnalysisData): Chart {
  // Destroy existing chart if present
  if (weekOfMonthChartInstance) {
    weekOfMonthChartInstance.destroy();
  }

  // Sort weeks by week number
  const weekData = Object.entries(data.byWeekOfMonth)
    .map(([week, info]) => ({
      week,
      weekNum: parseInt(week.replace('Week ', '')) || 0,
      count: info.count,
      successRate: info.successRate,
    }))
    .sort((a, b) => a.weekNum - b.weekNum)
    .filter(item => item.count > 0); // Only show weeks with data

  if (weekData.length === 0) {
    // Show empty state
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('No timing data available', canvas.width / 2, canvas.height / 2);
    }
    return weekOfMonthChartInstance as Chart;
  }

  const labels = weekData.map(item => item.week);
  const successRates = weekData.map(item => item.successRate);
  const counts = weekData.map(item => item.count);

  // Color bars based on success rate
  const backgroundColors = successRates.map(rate => {
    if (rate >= 20) return chartColors.offer;
    if (rate >= 10) return chartColors.finalRound;
    if (rate >= 5) return chartColors.technicalInterview;
    return chartColors.applied;
  });

  const borderColors = successRates.map(rate => {
    if (rate >= 20) return chartColors.offerBorder;
    if (rate >= 10) return chartColors.finalRoundBorder;
    if (rate >= 5) return chartColors.technicalInterviewBorder;
    return chartColors.appliedBorder;
  });

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Success Rate (%)',
          data: successRates,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
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
          text: 'Success Rate by Week of Month',
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
              const rate = successRates[index];
              const count = counts[index];
              return [`Success rate: ${rate}%`, `Applications: ${count}`];
            },
          },
        },
        legend: {
          display: false,
        },
      },
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
            color: 'rgba(148, 163, 184, 0.1)',
          },
          title: {
            display: true,
            text: 'Success Rate (%)',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
        },
        x: {
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

  weekOfMonthChartInstance = createChart(canvas, config);
  return weekOfMonthChartInstance;
}

/**
 * Destroy chart instances
 */
export function destroyTimingAnalysisCharts(): void {
  if (dayOfWeekChartInstance) {
    dayOfWeekChartInstance.destroy();
    dayOfWeekChartInstance = null;
  }
  if (weekOfMonthChartInstance) {
    weekOfMonthChartInstance.destroy();
    weekOfMonthChartInstance = null;
  }
}
