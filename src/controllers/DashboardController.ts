/**
 * DashboardController
 * Manages Analytics Dashboard, charts and insights
 */

import { analyticsService } from '../services/analytics';
import { createStatCard } from '../components/stats/StatCard';
import { animationService } from '../services/animationService';
import type { JobApplication } from '../types';

export class DashboardController {
    private analyticsSection: HTMLElement | null;
    private statsGrid: HTMLElement | null;
    private chartsContainer: HTMLElement | null;

    constructor() {
        this.analyticsSection = document.getElementById('analytics-section');
        this.statsGrid = document.getElementById('stats-grid');
        this.chartsContainer = document.getElementById('charts-container');
    }

    /**
     * Render the dashboard with data
     */
    public render(apps: JobApplication[]): void {
        if (!this.analyticsSection || !this.statsGrid || !this.chartsContainer) return;

        // Calculate metrics
        const metrics = analyticsService.calculateMetrics(apps);

        // Display Stat Cards
        this.renderStatCards(metrics);

        // Show insights
        this.renderInsights(metrics);

        // Lazy load and render charts
        this.renderCharts(metrics);
    }

    private renderStatCards(metrics: ReturnType<typeof analyticsService.calculateMetrics>): void {
        if (!this.statsGrid) return;
        this.statsGrid.innerHTML = '';

        const cards = [
            createStatCard({
                title: 'Total Applications',
                value: metrics.totalApplications,
                icon: '📊',
            }),
            createStatCard({
                title: 'Success Rate',
                value: `${metrics.successRate}%`,
                subtitle: 'Applications → Offers',
                trend: metrics.successRate > 15 ? 'up' : metrics.successRate > 5 ? 'neutral' : 'down',
                icon: '🎯',
            }),
            createStatCard({
                title: 'Response Rate',
                value: `${metrics.responseRate}%`,
                subtitle: 'Applications with responses',
                trend: metrics.responseRate > 50 ? 'up' : 'neutral',
                icon: '📧',
            }),
        ];

        cards.forEach(card => this.statsGrid?.appendChild(card));
        animationService.animateCardEntrance(cards as HTMLElement[], { delay: 50 });
    }

    private renderInsights(metrics: ReturnType<typeof analyticsService.calculateMetrics>): void {
        if (!this.chartsContainer) return;

        const existing = document.getElementById('analytics-insights');
        if (existing) existing.remove();

        const insights = analyticsService.getInsights(metrics);
        if (insights.length === 0) return;

        const div = document.createElement('div');
        div.id = 'analytics-insights';
        div.className = 'analytics-insights';
        div.innerHTML = `
      <div class="chart-title">💡 Insights</div>
      <ul class="insights-list">
        ${insights.map(i => `<li>${i}</li>`).join('')}
      </ul>
    `;
        this.chartsContainer.appendChild(div);
    }

    private renderCharts(metrics: ReturnType<typeof analyticsService.calculateMetrics>): void {
        if (!this.chartsContainer) return;

        import('../components/charts/LazyChartLoader')
            .then(({ renderCharts }) => {
                if (this.chartsContainer) {
                    renderCharts(metrics, this.chartsContainer as HTMLDivElement);
                }
            })
            .catch(err => console.error('Failed to load charts', err));
    }
}
