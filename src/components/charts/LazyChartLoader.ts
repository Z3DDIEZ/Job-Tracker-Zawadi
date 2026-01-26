import { createStatusDistributionChart } from './StatusDistributionChart';
import { createApplicationFunnelChart } from './ApplicationFunnelChart';
import { createVelocityChart } from './VelocityChart';
import { createTimeInStatusChart } from './TimeInStatusChart';
import { createVisaImpactChart } from './VisaImpactChart';
import { createDropOffChart } from './DropOffChart';
import { createDayOfWeekChart, createWeekOfMonthChart } from './TimingAnalysisChart';
import { exportChartAsPNG } from '../../utils/exportHelpers';
import { eventTrackingService } from '../../services/eventTracking';
import type { Chart } from 'chart.js';

// Store chart instances for export
const chartInstances: Map<string, Chart> = new Map();

export function renderCharts(
    metrics: any, // Using any here to avoid circular dependency with analyticsService types if complicated, but ideally use the type
    container: HTMLDivElement
): void {
    if (!container) return;

    container.innerHTML = '';
    chartInstances.clear(); // Clear previous chart instances

    // Helper function to create a chart container with export button
    const createChartContainer = (
        id: string,
        title: string,
        filename: string,
        description?: string
    ): { container: HTMLDivElement; wrapper: HTMLDivElement; canvas: HTMLCanvasElement } => {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';

        const header = document.createElement('div');
        header.className = 'chart-header';

        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'chart-title-wrapper';

        const chartTitle = document.createElement('div');
        chartTitle.className = 'chart-title';
        chartTitle.textContent = title;

        titleWrapper.appendChild(chartTitle);

        // Add description if provided
        if (description) {
            const chartDescription = document.createElement('div');
            chartDescription.className = 'chart-description';
            chartDescription.textContent = description;
            titleWrapper.appendChild(chartDescription);
        }

        const exportBtn = document.createElement('button');
        exportBtn.className = 'chart-export-btn';
        exportBtn.textContent = '📥 Export PNG';
        exportBtn.title = 'Export chart as PNG image';
        exportBtn.addEventListener('click', () => {
            const chart = chartInstances.get(id);
            if (chart) {
                eventTrackingService.track('export_chart', {
                    chartType: id,
                });
                exportChartAsPNG(chart, filename);
            }
        });

        header.appendChild(titleWrapper);
        header.appendChild(exportBtn);

        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';

        const canvas = document.createElement('canvas');
        canvas.id = id;

        wrapper.appendChild(canvas);
        chartContainer.appendChild(header);
        chartContainer.appendChild(wrapper);
        container.appendChild(chartContainer);

        return { container: chartContainer, wrapper, canvas };
    };

    // Status Distribution Chart
    const statusChartElements = createChartContainer(
        'status-chart',
        'Status Distribution',
        'status-distribution.png',
        'Breakdown of applications across all status stages'
    );
    if (statusChartElements.canvas) {
        const chart = createStatusDistributionChart(statusChartElements.canvas, metrics);
        chartInstances.set('status-chart', chart);
    }

    // Application Funnel Chart
    const funnelChartElements = createChartContainer(
        'funnel-chart',
        'Application Funnel',
        'application-funnel.png',
        'Conversion rates through each stage of the application process'
    );
    if (funnelChartElements.canvas) {
        const chart = createApplicationFunnelChart(funnelChartElements.canvas, metrics);
        chartInstances.set('funnel-chart', chart);
    }

    // Velocity Chart
    const velocityChartElements = createChartContainer(
        'velocity-chart',
        'Weekly Application Velocity',
        'weekly-velocity.png',
        'Number of applications submitted per week over time'
    );
    if (velocityChartElements.canvas) {
        const chart = createVelocityChart(velocityChartElements.canvas, metrics);
        chartInstances.set('velocity-chart', chart);
    }

    // Time in Status Chart
    const timeStatusChartElements = createChartContainer(
        'time-status-chart',
        'Average Time in Status',
        'time-in-status.png',
        'Average days spent in each application status'
    );
    if (timeStatusChartElements.canvas) {
        const chart = createTimeInStatusChart(timeStatusChartElements.canvas, metrics);
        chartInstances.set('time-status-chart', chart);
    }

    // Visa Impact Chart (only if we have visa data)
    if (metrics.visaImpact && (metrics.visaImpact.withVisa.total > 0 || metrics.visaImpact.withoutVisa.total > 0)) {
        const visaChartElements = createChartContainer(
            'visa-impact-chart',
            'Visa Sponsorship Impact',
            'visa-impact.png',
            'Comparison of success and response rates for applications with and without visa sponsorship'
        );
        if (visaChartElements.canvas) {
            const chart = createVisaImpactChart(visaChartElements.canvas, metrics);
            chartInstances.set('visa-impact-chart', chart);
        }
    }

    // Drop-off Analysis Chart
    if (metrics.dropOffData) {
        const dropOffChartElements = createChartContainer(
            'drop-off-chart',
            'Pipeline Drop-off Analysis',
            'drop-off-analysis.png',
            'Where applications are being lost in the hiring pipeline'
        );
        if (dropOffChartElements.canvas) {
            const chart = createDropOffChart(dropOffChartElements.canvas, metrics);
            chartInstances.set('drop-off-chart', chart);
        }
    }

    // Timing Analysis Charts
    if (metrics.timingAnalysis) {
        // Day of Week
        const dayChartElements = createChartContainer(
            'day-of-week-chart',
            'Success Rate by Day Applied',
            'day-of-week-success.png',
            'Which days of the week result in higher interview rates'
        );
        if (dayChartElements.canvas) {
            const chart = createDayOfWeekChart(dayChartElements.canvas, metrics);
            chartInstances.set('day-of-week-chart', chart);
        }

        // Week of Month
        const weekChartElements = createChartContainer(
            'week-of-month-chart',
            'Success Rate by Week of Month',
            'week-of-month-success.png',
            'Timing analysis based on when in the month you apply'
        );
        if (weekChartElements.canvas) {
            const chart = createWeekOfMonthChart(weekChartElements.canvas, metrics);
            chartInstances.set('week-of-month-chart', chart);
        }
    }
}
