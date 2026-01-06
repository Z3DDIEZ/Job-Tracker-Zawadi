/**
 * View Mode Utilities
 * Handles switching between card view and table view for better scalability
 */

import type { JobApplication } from '@/types';

export type ViewMode = 'cards' | 'table' | 'analytics';

/**
 * Create table row for an application
 */
export function createTableRow(app: JobApplication): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.className = 'application-row';
  row.dataset.id = app.id;

  const statusClass = app.status
    ? app.status.toLowerCase().replace(/\s+/g, '-')
    : 'unknown';

  let formattedDate = 'Date not set';
  if (app.dateApplied) {
    try {
      formattedDate = new Date(app.dateApplied).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      formattedDate = app.dateApplied;
    }
  }

  const visaBadge = app.visaSponsorship
    ? '<span class="visa-badge-small">✓ Visa</span>'
    : '';

  const displayStatus = app.status || 'Unknown';
  const statusBadge = `<span class="status-badge status-${statusClass}">${displayStatus}</span>`;

  row.innerHTML = `
    <td class="table-company">
      <strong>${app.company || 'Company not set'}</strong>
    </td>
    <td class="table-role">${app.role || 'Role not set'}</td>
    <td class="table-date">${formattedDate}</td>
    <td class="table-status">${statusBadge}</td>
    <td class="table-visa">${visaBadge}</td>
    <td class="table-actions">
      <button class="btn-edit-small" onclick="editApplication('${app.id}')" title="Edit">✏️</button>
      <button class="btn-delete-small" onclick="deleteApplication('${app.id}')" title="Delete">🗑️</button>
    </td>
  `;

  return row;
}

/**
 * Create table view
 */
export function createTableView(applications: JobApplication[]): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'applications-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Company</th>
        <th>Role</th>
        <th>Date Applied</th>
        <th>Status</th>
        <th>Visa</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
    </tbody>
  `;

  const tbody = table.querySelector('tbody');
  if (tbody) {
    applications.forEach((app) => {
      const row = createTableRow(app);
      tbody.appendChild(row);
    });
  }

  return table;
}
