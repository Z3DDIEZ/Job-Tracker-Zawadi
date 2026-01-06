/**
 * Stat Card Component
 * Displays a single metric in a card format
 */

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export function createStatCard(props: StatCardProps): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'stat-card';

  const trendIcon =
    props.trend === 'up'
      ? '📈'
      : props.trend === 'down'
        ? '📉'
        : props.icon || '📊';

  card.innerHTML = `
    <div class="stat-card-header">
      <span class="stat-card-icon">${trendIcon}</span>
      <h3 class="stat-card-title">${props.title}</h3>
    </div>
    <div class="stat-card-value">${props.value}</div>
    ${props.subtitle ? `<div class="stat-card-subtitle">${props.subtitle}</div>` : ''}
  `;

  return card;
}
