/**
 * Analytics Service
 * Calculates metrics and insights from application data
 */

import type {
  JobApplication,
  ApplicationStatus,
  AnalyticsMetrics,
} from '@/types';

export class AnalyticsService {
  /**
   * Calculate comprehensive metrics from applications
   */
  calculateMetrics(applications: JobApplication[]): AnalyticsMetrics {
    if (applications.length === 0) {
      return this.getEmptyMetrics();
    }

    const totalApplications = applications.length;
    const statusDistribution = this.calculateStatusDistribution(applications);
    const successRate = this.calculateSuccessRate(applications);
    const responseRate = this.calculateResponseRate(applications);
    const averageTimeInStatus = this.calculateAverageTimeInStatus(applications);
    const weeklyVelocity = this.calculateWeeklyVelocity(applications);
    const funnelData = this.calculateFunnelData(applications);

    return {
      totalApplications,
      successRate,
      responseRate,
      averageTimeInStatus,
      statusDistribution,
      weeklyVelocity,
      funnelData,
    };
  }

  /**
   * Calculate distribution of applications across statuses
   */
  private calculateStatusDistribution(
    applications: JobApplication[]
  ): Record<ApplicationStatus, number> {
    const distribution: Record<string, number> = {
      Applied: 0,
      'Phone Screen': 0,
      'Technical Interview': 0,
      'Final Round': 0,
      Offer: 0,
      Rejected: 0,
    };

    applications.forEach((app) => {
      if (app.status && distribution[app.status] !== undefined) {
        distribution[app.status] = (distribution[app.status] || 0) + 1;
      }
    });

    return distribution as Record<ApplicationStatus, number>;
  }

  /**
   * Calculate overall success rate (Offer / Total)
   */
  private calculateSuccessRate(applications: JobApplication[]): number {
    if (applications.length === 0) return 0;

    const offers = applications.filter((app) => app.status === 'Offer').length;
    return Math.round((offers / applications.length) * 100 * 10) / 10; // 1 decimal place
  }

  /**
   * Calculate response rate (any response / Total)
   */
  private calculateResponseRate(applications: JobApplication[]): number {
    if (applications.length === 0) return 0;

    const responded = applications.filter(
      (app) => app.status !== 'Applied'
    ).length;
    return Math.round((responded / applications.length) * 100 * 10) / 10;
  }

  /**
   * Calculate average time spent in each status
   */
  private calculateAverageTimeInStatus(
    applications: JobApplication[]
  ): Record<ApplicationStatus, number> {
    const averages: Record<string, number> = {
      Applied: 0,
      'Phone Screen': 0,
      'Technical Interview': 0,
      'Final Round': 0,
      Offer: 0,
      Rejected: 0,
    };

    const statusCounts: Record<string, number> = { ...averages };
    const statusTotals: Record<string, number> = { ...averages };

    applications.forEach((app) => {
      if (!app.dateApplied || !app.timestamp) return;

      const appliedDate = new Date(app.dateApplied).getTime();
      const currentTime = app.updatedAt || app.timestamp;
      const daysSinceApplied = Math.floor(
        (currentTime - appliedDate) / (1000 * 60 * 60 * 24)
      );

      if (app.status && statusCounts[app.status] !== undefined) {
        const status = app.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        statusTotals[status] = (statusTotals[status] || 0) + daysSinceApplied;
      }
    });

    // Calculate averages
    Object.keys(averages).forEach((status) => {
      const count = statusCounts[status] || 0;
      const total = statusTotals[status] || 0;
      if (count > 0) {
        averages[status] = Math.round(total / count);
      }
    });

    return averages as Record<ApplicationStatus, number>;
  }

  /**
   * Calculate weekly application velocity
   */
  private calculateWeeklyVelocity(
    applications: JobApplication[]
  ): Array<{ week: string; count: number }> {
    const weeklyData: Record<string, number> = {};

    applications.forEach((app) => {
      if (!app.dateApplied) return;

      const date = new Date(app.dateApplied);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (weekKey) {
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
      }
    });

    // Convert to array and sort by date
    return Object.entries(weeklyData)
      .map(([week, count]) => ({
        week,
        count,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12); // Last 12 weeks
  }

  /**
   * Calculate funnel data (conversion rates)
   */
  private calculateFunnelData(
    applications: JobApplication[]
  ): Array<{ stage: string; count: number; conversionRate: number }> {
    const stages: ApplicationStatus[] = [
      'Applied',
      'Phone Screen',
      'Technical Interview',
      'Final Round',
      'Offer',
    ];

    const funnel: Array<{ stage: string; count: number; conversionRate: number }> =
      [];
    let previousCount = applications.length;

    stages.forEach((stage) => {
      const count = applications.filter((app) => app.status === stage).length;
      const conversionRate =
        previousCount > 0
          ? Math.round((count / previousCount) * 100 * 10) / 10
          : 0;

      funnel.push({
        stage: stage as string,
        count,
        conversionRate,
      });

      previousCount = count;
    });

    return funnel;
  }

  /**
   * Get week start date (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): AnalyticsMetrics {
    return {
      totalApplications: 0,
      successRate: 0,
      responseRate: 0,
      averageTimeInStatus: {
        Applied: 0,
        'Phone Screen': 0,
        'Technical Interview': 0,
        'Final Round': 0,
        Offer: 0,
        Rejected: 0,
      },
      statusDistribution: {
        Applied: 0,
        'Phone Screen': 0,
        'Technical Interview': 0,
        'Final Round': 0,
        Offer: 0,
        Rejected: 0,
      },
      weeklyVelocity: [],
      funnelData: [],
    };
  }

  /**
   * Generate insights from metrics
   */
  getInsights(metrics: AnalyticsMetrics): string[] {
    const insights: string[] = [];

    if (metrics.totalApplications === 0) {
      insights.push('Start adding applications to see insights!');
      return insights;
    }

    // Success rate insights
    if (metrics.successRate > 20) {
      insights.push(
        `🎉 Excellent success rate of ${metrics.successRate}%! Keep up the great work.`
      );
    } else if (metrics.successRate > 10) {
      insights.push(
        `📈 Your success rate is ${metrics.successRate}%. Consider refining your application strategy.`
      );
    } else if (metrics.successRate > 0) {
      insights.push(
        `💪 Your success rate is ${metrics.successRate}%. Keep applying and improving!`
      );
    }

    // Response rate insights
    if (metrics.responseRate < 30) {
      insights.push(
        `📧 Response rate is ${metrics.responseRate}%. Consider tailoring your applications more.`
      );
    }

    // Velocity insights
    if (metrics.weeklyVelocity.length > 0) {
      const recentWeeks = metrics.weeklyVelocity.slice(-4);
      const avgRecent = recentWeeks.reduce((sum, w) => sum + w.count, 0) / recentWeeks.length;
      if (avgRecent < 2) {
        insights.push('⚡ Consider increasing your application velocity for better results.');
      }
    }

    // Funnel insights
    if (metrics.funnelData && metrics.funnelData.length > 0) {
      const firstStage = metrics.funnelData[0];
      const lastStage = metrics.funnelData[metrics.funnelData.length - 1];
      const appliedCount = firstStage?.count || 0;
      const offerCount = lastStage?.count || 0;
      if (appliedCount > 0 && offerCount === 0) {
        insights.push('🎯 Focus on improving interview performance to convert applications to offers.');
      }
    }

    return insights;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
