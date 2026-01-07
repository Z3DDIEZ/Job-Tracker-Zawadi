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
    const recommendations: string[] = [];

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
      recommendations.push('💡 Action: Review successful applications to identify patterns in company size, role type, or application timing.');
    } else if (metrics.successRate > 0) {
      insights.push(
        `💪 Your success rate is ${metrics.successRate}%. Keep applying and improving!`
      );
      recommendations.push('💡 Action: Focus on quality over quantity. Tailor each application to the specific role and company.');
    } else {
      recommendations.push('💡 Action: Consider getting feedback on your resume and cover letter. Practice common interview questions.');
    }

    // Response rate insights
    if (metrics.responseRate < 30) {
      insights.push(
        `📧 Response rate is ${metrics.responseRate}%. Consider tailoring your applications more.`
      );
      recommendations.push('💡 Action: Customize your resume and cover letter for each application. Highlight relevant experience and keywords from the job description.');
    } else if (metrics.responseRate > 70) {
      insights.push(
        `✅ Strong response rate of ${metrics.responseRate}%! Your applications are getting noticed.`
      );
    }

    // Velocity insights
    if (metrics.weeklyVelocity.length > 0) {
      const recentWeeks = metrics.weeklyVelocity.slice(-4);
      const avgRecent = recentWeeks.reduce((sum, w) => sum + w.count, 0) / recentWeeks.length;
      if (avgRecent < 2) {
        insights.push('⚡ Consider increasing your application velocity for better results.');
        recommendations.push('💡 Action: Aim for 5-10 quality applications per week. Set aside dedicated time each day for job searching.');
      } else if (avgRecent > 10) {
        insights.push(`🚀 High application velocity (${avgRecent.toFixed(1)} per week)! Maintain quality while keeping momentum.`);
      }
    }

    // Funnel insights
    if (metrics.funnelData && metrics.funnelData.length > 0) {
      const stages = metrics.funnelData;
      
      // Check for drop-off points
      for (let i = 1; i < stages.length; i++) {
        const prevStage = stages[i - 1];
        const currentStage = stages[i];
        
        if (!prevStage || !currentStage) continue;
        
        const dropOffRate = prevStage.count > 0 
          ? ((prevStage.count - currentStage.count) / prevStage.count) * 100 
          : 0;
        
        if (dropOffRate > 70 && prevStage.count > 3) {
          insights.push(
            `⚠️ High drop-off at ${prevStage.stage} → ${currentStage.stage} (${dropOffRate.toFixed(0)}% drop-off).`
          );
          if (currentStage.stage === 'Phone Screen') {
            recommendations.push('💡 Action: Practice phone interview skills. Prepare answers to common questions and have questions ready for the interviewer.');
          } else if (currentStage.stage === 'Technical Interview') {
            recommendations.push('💡 Action: Focus on technical interview preparation. Practice coding problems and system design questions relevant to your field.');
          } else if (currentStage.stage === 'Final Round') {
            recommendations.push('💡 Action: Prepare for final round interviews by researching the company culture, preparing behavioral questions, and demonstrating enthusiasm.');
          }
        }
      }

      const firstStage = stages[0];
      const lastStage = stages[stages.length - 1];
      if (firstStage && lastStage) {
        const appliedCount = firstStage.count || 0;
        const offerCount = lastStage.count || 0;
        if (appliedCount > 0 && offerCount === 0) {
          insights.push('🎯 Focus on improving interview performance to convert applications to offers.');
        } else if (offerCount > 0) {
          const conversionRate = (offerCount / appliedCount) * 100;
          if (conversionRate > 10) {
            insights.push(`✅ Strong conversion rate: ${conversionRate.toFixed(1)}% of applications resulted in offers!`);
          }
        }
      }
    }

    // Time in status insights
    const avgTimeInStatus = metrics.averageTimeInStatus;
    const statusesWithTime = Object.entries(avgTimeInStatus)
      .filter(([_, days]) => days > 0)
      .sort(([_, a], [__, b]) => b - a);

    if (statusesWithTime.length > 0) {
      const longestEntry = statusesWithTime[0];
      if (longestEntry) {
        const [longestStatus, longestDays] = longestEntry;
        if (longestDays > 30 && longestStatus !== 'Offer' && longestStatus !== 'Rejected') {
          insights.push(
            `⏱️ Applications spend an average of ${longestDays} days in "${longestStatus}". Consider following up if appropriate.`
          );
          recommendations.push('💡 Action: Set reminders to follow up on applications after 2 weeks of no response.');
        }
      }
    }

    // Combine insights and recommendations
    return [...insights, ...recommendations];
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
