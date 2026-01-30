/**
 * Safe DOM Manipulation Helpers
 * Prevents XSS attacks by using safe DOM methods
 */

import { escapeHtml, validateApplicationId } from './security';
import type { JobApplication } from '@/types';

/**
 * Create application card safely (no innerHTML)
 */
export function createApplicationCardSafe(app: JobApplication): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'application-card';

  // Validate and set ID safely
  try {
    validateApplicationId(app.id);
    card.dataset.id = app.id;
  } catch (error) {
    console.error('Invalid application ID:', error);
    return card; // Return empty card if ID invalid
  }

  const statusClass = app.status ? app.status.toLowerCase().replace(/\s+/g, '-') : 'unknown';

  card.classList.add(`status-${statusClass}`);

  // Format date safely
  let formattedDate = 'Date not set';
  if (app.dateApplied) {
    try {
      formattedDate = new Date(app.dateApplied).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      formattedDate = 'Invalid date';
    }
  }

  // Create card header
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';

  const companyName = document.createElement('h3');
  companyName.className = 'company-name';
  companyName.textContent = app.company || 'Company not set';

  const statusBadge = document.createElement('span');
  statusBadge.className = `status-badge status-${statusClass}`;
  statusBadge.textContent = app.status || 'Unknown';

  cardHeader.appendChild(companyName);
  cardHeader.appendChild(statusBadge);

  // Create card body
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const roleTitle = document.createElement('p');
  roleTitle.className = 'role-title';
  roleTitle.textContent = app.role || 'Role not set';

  const dateApplied = document.createElement('p');
  dateApplied.className = 'date-applied';
  dateApplied.textContent = `Applied: ${formattedDate}`;

  cardBody.appendChild(roleTitle);
  cardBody.appendChild(dateApplied);

  // Add visa badge if applicable
  if (app.visaSponsorship) {
    const visaBadge = document.createElement('span');
    visaBadge.className = 'visa-badge';
    visaBadge.textContent = '✓ Visa Sponsorship';
    cardBody.appendChild(visaBadge);
  }

  // Create card footer
  const cardFooter = document.createElement('div');
  cardFooter.className = 'card-footer';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-edit';
  editBtn.textContent = 'Edit';
  editBtn.dataset.action = 'edit';
  editBtn.dataset.appId = app.id;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.dataset.action = 'delete';
  deleteBtn.dataset.appId = app.id;

  cardFooter.appendChild(editBtn);
  cardFooter.appendChild(deleteBtn);

  // Assemble card
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  card.appendChild(cardFooter);

  return card;
}

/**
 * Create safe HTML string for simple cases (when innerHTML is unavoidable)
 * Escapes all user-controlled content
 */
export function createSafeHTML(template: string, values: Record<string, string>): string {
  let safeHTML = template;

  // Replace placeholders with escaped values
  Object.entries(values).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    safeHTML = safeHTML.replace(new RegExp(placeholder, 'g'), escapeHtml(value));
  });

  return safeHTML;
}
