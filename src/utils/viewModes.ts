/**
 * View Mode Utilities
 * Handles switching between card view and table view for better scalability
 * SECURITY: Uses safe DOM methods to prevent XSS
 */

import type { JobApplication } from '@/types';
import { validateApplicationId } from './security';

export type ViewMode = 'cards' | 'table' | 'analytics';

/**
 * Create table row for an application (safe - no innerHTML)
 */
export function createTableRow(app: JobApplication): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.className = 'application-row';
  
  // Validate ID before setting
  try {
    validateApplicationId(app.id);
    row.dataset.id = app.id;
  } catch (error) {
    console.error('Invalid application ID in table row:', error);
    return row; // Return empty row if ID invalid
  }

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
      formattedDate = 'Invalid date';
    }
  }

  // Company cell
  const companyCell = document.createElement('td');
  companyCell.className = 'table-company';
  const companyStrong = document.createElement('strong');
  companyStrong.textContent = app.company || 'Company not set';
  companyCell.appendChild(companyStrong);

  // Role cell
  const roleCell = document.createElement('td');
  roleCell.className = 'table-role';
  roleCell.textContent = app.role || 'Role not set';

  // Date cell
  const dateCell = document.createElement('td');
  dateCell.className = 'table-date';
  dateCell.textContent = formattedDate;

  // Status cell
  const statusCell = document.createElement('td');
  statusCell.className = 'table-status';
  const statusBadge = document.createElement('span');
  statusBadge.className = `status-badge status-${statusClass}`;
  statusBadge.textContent = app.status || 'Unknown';
  statusCell.appendChild(statusBadge);

  // Visa cell
  const visaCell = document.createElement('td');
  visaCell.className = 'table-visa';
  if (app.visaSponsorship) {
    const visaBadge = document.createElement('span');
    visaBadge.className = 'visa-badge-small';
    visaBadge.textContent = '✓ Visa';
    visaCell.appendChild(visaBadge);
  }

  // Actions cell
  const actionsCell = document.createElement('td');
  actionsCell.className = 'table-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-edit-small';
  editBtn.title = 'Edit';
  editBtn.textContent = '✏️';
  editBtn.type = 'button'; // Prevent form submission
  editBtn.dataset.action = 'edit';
  editBtn.dataset.appId = app.id;

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete-small';
  deleteBtn.title = 'Delete';
  deleteBtn.textContent = '🗑️';
  deleteBtn.type = 'button'; // Prevent form submission
  deleteBtn.dataset.action = 'delete';
  deleteBtn.dataset.appId = app.id;

  actionsCell.appendChild(editBtn);
  actionsCell.appendChild(deleteBtn);

  // Assemble row
  row.appendChild(companyCell);
  row.appendChild(roleCell);
  row.appendChild(dateCell);
  row.appendChild(statusCell);
  row.appendChild(visaCell);
  row.appendChild(actionsCell);

  return row;
}

/**
 * Create table view (safe - no innerHTML)
 */
export function createTableView(applications: JobApplication[]): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'applications-table';

  // Create thead safely
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  const headers = ['Company', 'Role', 'Date Applied', 'Status', 'Visa', 'Actions'];
  headers.forEach((headerText) => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);

  // Create tbody
  const tbody = document.createElement('tbody');
  
  applications.forEach((app) => {
    const row = createTableRow(app);
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  return table;
}
