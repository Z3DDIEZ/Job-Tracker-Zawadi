/**
 * Stat Card Component
 * Displays a single metric in a card format
 * SECURITY: Uses safe DOM methods (no innerHTML)
 */

import { escapeHtml } from '@/utils/security';

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
    props.trend === 'up' ? '📈' : props.trend === 'down' ? '📉' : props.icon || '📊';

  // Create header
  const header = document.createElement('div');
  header.className = 'stat-card-header';

  const icon = document.createElement('span');
  icon.className = 'stat-card-icon';
  icon.textContent = trendIcon;

  const title = document.createElement('h3');
  title.className = 'stat-card-title';
  title.textContent = escapeHtml(props.title);

  header.appendChild(icon);
  header.appendChild(title);

  // Create value
  const value = document.createElement('div');
  value.className = 'stat-card-value';
  value.textContent = String(props.value);

  card.appendChild(header);
  card.appendChild(value);

  // Add subtitle if provided
  if (props.subtitle) {
    const subtitle = document.createElement('div');
    subtitle.className = 'stat-card-subtitle';
    subtitle.textContent = escapeHtml(props.subtitle);
    card.appendChild(subtitle);
  }

  return card;
}
