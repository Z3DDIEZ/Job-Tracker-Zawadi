/**
 * Job Application Tracker - Main Entry Point
 * Enhanced version with TypeScript, state management, and modern architecture
 */

import { getFirebaseConfig } from './config/firebase';
import {
  applications,
  filteredApplications,
  currentEditId,
  filters,
  sortBy,
  setApplications,
  setFilteredApplications,
  setCurrentEditId,
  updateFilter,
  resetFilters,
  setSortPreference,
} from './stores/applicationStore';
import { Validators } from './utils/validators';
import { FilterManager } from './utils/filters';
import { SortManager } from './utils/sorting';
import { CacheManager } from './utils/cache';
import type { JobApplication, ApplicationStatus } from './types';

// Firebase initialization
let database: ReturnType<typeof firebase.database>;

// Initialize Firebase
function initializeFirebase(): void {
  const config = getFirebaseConfig();
  firebase.initializeApp(config);
  database = firebase.database();
  console.log('🔥 Firebase initialized');
}

// DOM Elements
const form = document.getElementById('application-form') as HTMLFormElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
const counterText = document.getElementById('counter-text') as HTMLSpanElement;
const applicationsContainer = document.getElementById(
  'applications-container'
) as HTMLDivElement;

// ========================================
// FORM SUBMISSION WITH VALIDATION
// ========================================

form?.addEventListener('submit', function (event) {
  event.preventDefault();

  const company = (document.getElementById('company') as HTMLInputElement).value.trim();
  const role = (document.getElementById('role') as HTMLInputElement).value.trim();
  const dateApplied = (document.getElementById('date') as HTMLInputElement).value;
  const status = (document.getElementById('status') as HTMLSelectElement).value;
  const visaSponsorship = (document.getElementById('visa') as HTMLInputElement).checked;

  clearValidationErrors();

  const errors = Validators.validateApplication(company, role, dateApplied, status);

  if (errors.length > 0) {
    displayValidationErrors(errors);
    return;
  }

  const sanitizedCompany = Validators.sanitizeInput(company);
  const sanitizedRole = Validators.sanitizeInput(role);

  const editId = currentEditId.get();
  if (editId) {
    updateApplication(editId, sanitizedCompany, sanitizedRole, dateApplied, status as ApplicationStatus, visaSponsorship);
  } else {
    addApplication(sanitizedCompany, sanitizedRole, dateApplied, status as ApplicationStatus, visaSponsorship);
  }
});

function clearValidationErrors(): void {
  const existingErrors = document.querySelectorAll('.validation-error');
  existingErrors.forEach((error) => error.remove());
}

function displayValidationErrors(errors: Array<{ field: string; message: string }>): void {
  errors.forEach((error) => {
    const field = document.getElementById(error.field);
    if (!field) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.textContent = error.message;
    field.parentElement?.appendChild(errorDiv);
  });

  const firstError = document.querySelector('.validation-error');
  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ========================================
// FIREBASE OPERATIONS
// ========================================

function addApplication(
  company: string,
  role: string,
  dateApplied: string,
  status: ApplicationStatus,
  visaSponsorship: boolean
): void {
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  const newApplicationRef = database.ref('applications').push();

  const applicationData: JobApplication = {
    company,
    role,
    dateApplied,
    status,
    visaSponsorship,
    timestamp: Date.now(),
    id: newApplicationRef.key || '',
  };

  newApplicationRef
    .set(applicationData)
    .then(() => {
      console.log('✅ Application saved successfully');
      showSuccessMessage('Application added successfully!');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Application';
      CacheManager.invalidate();
    })
    .catch((error) => {
      console.error('❌ Error saving application:', error);
      showErrorMessage('Failed to save application. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Application';
    });
}

function updateApplication(
  id: string,
  company: string,
  role: string,
  dateApplied: string,
  status: ApplicationStatus,
  visaSponsorship: boolean
): void {
  if (!submitBtn) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Updating...';

  const updatedData = {
    company,
    role,
    dateApplied,
    status,
    visaSponsorship,
    updatedAt: Date.now(),
  };

  database
    .ref('applications/' + id)
    .update(updatedData)
    .then(() => {
      console.log('✅ Application updated successfully');
      showSuccessMessage(`Application for ${company} updated successfully!`);
      cancelEdit();
      submitBtn.disabled = false;
      CacheManager.invalidate();
    })
    .catch((error) => {
      console.error('❌ Error updating application:', error);
      showErrorMessage('Failed to update application. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Application';
    });
}

export function deleteApplication(id: string): void {
  console.log('Deleting application:', id);

  database
    .ref('applications/' + id)
    .once('value')
    .then((snapshot) => {
      const app = snapshot.val() as JobApplication | null;

      if (!app) {
        showErrorMessage('Application not found!');
        return;
      }

      const confirmed = confirm(
        `Are you sure you want to delete the application for ${app.company}?\n\n` +
          `Role: ${app.role}\n` +
          `This action cannot be undone.`
      );

      if (confirmed) {
        database
          .ref('applications/' + id)
          .remove()
          .then(() => {
            console.log('✅ Application deleted successfully');
            showSuccessMessage(`Application for ${app.company} deleted`);
            CacheManager.invalidate();
          })
          .catch((error) => {
            console.error('❌ Error deleting application:', error);
            showErrorMessage('Failed to delete application. Please try again.');
          });
      }
    })
    .catch((error) => {
      console.error('Error loading application:', error);
      showErrorMessage('Error loading application data');
    });
}

// ========================================
// EDIT MODE FUNCTIONS
// ========================================

export function editApplication(id: string): void {
  console.log('Editing application:', id);

  database
    .ref('applications/' + id)
    .once('value')
    .then((snapshot) => {
      const app = snapshot.val() as JobApplication | null;

      if (!app) {
        showErrorMessage('Application not found!');
        return;
      }

      // Populate form fields
      (document.getElementById('company') as HTMLInputElement).value = app.company || '';
      (document.getElementById('role') as HTMLInputElement).value = app.role || '';
      (document.getElementById('date') as HTMLInputElement).value = app.dateApplied || '';
      (document.getElementById('status') as HTMLSelectElement).value = app.status || '';
      (document.getElementById('visa') as HTMLInputElement).checked = app.visaSponsorship || false;

      // Switch to edit mode
      setCurrentEditId(id);
      if (submitBtn) {
        submitBtn.textContent = 'Update Application';
        submitBtn.style.background = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
      }

      // Scroll to form
      document.getElementById('form-section')?.scrollIntoView({
        behavior: 'smooth',
      });

      // Show edit mode indicator
      showEditModeIndicator(app.company);
    })
    .catch((error) => {
      console.error('Error loading application:', error);
      showErrorMessage('Error loading application data');
    });
}

function showEditModeIndicator(companyName: string): void {
  const existingIndicator = document.getElementById('edit-mode-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  const indicator = document.createElement('div');
  indicator.id = 'edit-mode-indicator';
  indicator.className = 'edit-mode-indicator';
  indicator.innerHTML = `
        <span>✏️ Editing: <strong>${companyName}</strong></span>
        <button onclick="cancelEdit()" class="btn-cancel-edit">Cancel</button>
    `;

  const formSection = document.getElementById('form-section');
  const form = document.getElementById('application-form');
  if (formSection && form) {
    formSection.insertBefore(indicator, form);
  }
}

export function cancelEdit(): void {
  setCurrentEditId(null);
  form.reset();
  if (submitBtn) {
    submitBtn.textContent = 'Add Application';
    submitBtn.style.background = 'linear-gradient(135deg, var(--slate-900) 0%, var(--slate-950) 100%)';
  }

  const indicator = document.getElementById('edit-mode-indicator');
  if (indicator) {
    indicator.remove();
  }

  clearValidationErrors();
  console.log('Edit cancelled - returned to add mode');
}

// ========================================
// MESSAGES
// ========================================

function showSuccessMessage(message: string): void {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.textContent = message;

  const formSection = document.getElementById('form-section');
  const form = document.getElementById('application-form');
  if (formSection && form) {
    formSection.insertBefore(messageDiv, form);
  }

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

function showErrorMessage(message: string): void {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'error-message';
  messageDiv.textContent = message;

  const formSection = document.getElementById('form-section');
  const form = document.getElementById('application-form');
  if (formSection && form) {
    formSection.insertBefore(messageDiv, form);
  }

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

// ========================================
// LOAD APPLICATIONS WITH CACHING
// ========================================

function loadApplications(): void {
  // Try to load from cache first
  const cached = CacheManager.load();
  if (cached && cached.length > 0) {
    console.log('📦 Loading from cache...');
    setApplications(cached);
    processAndDisplayApplications();
  }

  // Show loading state
  showLoadingState();

  // Listen for data changes in Firebase
  database.ref('applications').on('value', (snapshot) => {
    const applicationsData = snapshot.val();

    if (!applicationsData) {
      if (applicationsContainer) {
        applicationsContainer.innerHTML =
          '<p id="no-apps-message">No applications yet. Add your first one above!</p>';
      }
      updateCounter(0, 0);
      setApplications([]);
      setFilteredApplications([]);
      return;
    }

    // Convert to array
    const applicationsArray: JobApplication[] = Object.keys(applicationsData).map((key) => ({
      id: key,
      ...applicationsData[key],
    }));

    setApplications(applicationsArray);
    CacheManager.save(applicationsArray);
    processAndDisplayApplications();

    console.log(`📊 Loaded ${applicationsArray.length} applications from Firebase`);
  });
}

function processAndDisplayApplications(): void {
  const apps = applications.get();
  const currentFilters = filters.get();
  const currentSort = sortBy.get().value;

  // Apply filters
  const filtered = FilterManager.applyFilters(apps, currentFilters);
  setFilteredApplications(filtered);

  // Apply sorting
  const sorted = SortManager.sort(filtered, currentSort);

  // Display
  displayApplications(sorted);

  // Update counter
  updateCounter(sorted.length, apps.length);
}

// ========================================
// DISPLAY APPLICATIONS
// ========================================

function displayApplications(apps: JobApplication[]): void {
  if (!applicationsContainer) return;

  applicationsContainer.innerHTML = '';

  if (apps.length === 0) {
    applicationsContainer.innerHTML = `
            <div class="no-results">
                <p>No applications match your filters</p>
                <button onclick="clearAllFilters()" class="btn-clear-filters">Clear Filters</button>
            </div>
        `;
    return;
  }

  apps.forEach((app) => {
    const appCard = createApplicationCard(app);
    applicationsContainer.appendChild(appCard);
  });
}

function createApplicationCard(app: JobApplication): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'application-card';
  card.dataset.id = app.id;

  const statusClass = app.status
    ? app.status.toLowerCase().replace(/\s+/g, '-')
    : 'unknown';

  card.classList.add(`status-${statusClass}`);

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
    ? '<span class="visa-badge">✓ Visa Sponsorship</span>'
    : '';

  const displayStatus = app.status || 'Unknown';
  const statusBadge = `<span class="status-badge status-${statusClass}">${displayStatus}</span>`;

  const company = app.company || 'Company not set';
  const role = app.role || 'Role not set';

  card.innerHTML = `
        <div class="card-header">
            <h3 class="company-name">${company}</h3>
            ${statusBadge}
        </div>
        <div class="card-body">
            <p class="role-title">${role}</p>
            <p class="date-applied">Applied: ${formattedDate}</p>
            ${visaBadge}
        </div>
        <div class="card-footer">
            <button class="btn-edit" onclick="editApplication('${app.id}')">Edit</button>
            <button class="btn-delete" onclick="deleteApplication('${app.id}')">Delete</button>
        </div>
    `;

  return card;
}

// ========================================
// FILTER & SEARCH EVENT LISTENERS
// ========================================

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    updateFilter('search', target.value);
    processAndDisplayApplications();
  });
}

if (statusFilter) {
  statusFilter.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    updateFilter('status', target.value as ApplicationStatus | 'all');
    processAndDisplayApplications();
  });
}

export function clearAllFilters(): void {
  resetFilters();
  if (searchInput) searchInput.value = '';
  if (statusFilter) statusFilter.value = 'all';

  const dateRangeFilter = document.getElementById('date-range-filter') as HTMLSelectElement;
  const visaFilter = document.getElementById('visa-filter') as HTMLSelectElement;
  if (dateRangeFilter) dateRangeFilter.value = 'all';
  if (visaFilter) visaFilter.value = 'all';

  processAndDisplayApplications();
}

// ========================================
// COUNTER & LOADING
// ========================================

function updateCounter(filtered: number, total: number): void {
  if (!counterText) return;

  const cacheStatus = CacheManager.getCacheData().isValid ? ' (cached)' : '';

  if (filtered === total) {
    counterText.textContent = `Showing ${total} ${total === 1 ? 'application' : 'applications'}${cacheStatus}`;
  } else {
    counterText.textContent = `Showing ${filtered} of ${total} ${total === 1 ? 'application' : 'applications'}${cacheStatus}`;
  }
}

function showLoadingState(): void {
  if (!applicationsContainer) return;

  if (!CacheManager.getCacheData().isValid) {
    applicationsContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading applications...</p>
            </div>
        `;
  }
}

// ========================================
// FILTER HELPERS (for inline handlers)
// ========================================

export function handleDateRangeChange(value: string): void {
  updateFilter('dateRange', value as 'all' | 'week' | 'month' | 'quarter');
  processAndDisplayApplications();
}

export function handleVisaFilterChange(value: string): void {
  updateFilter('visaSponsorship', value as 'all' | 'true' | 'false');
  processAndDisplayApplications();
}

export function handleSortChange(value: string): void {
  setSortPreference(value as typeof sortBy.get().value);
  processAndDisplayApplications();
}

// ========================================
// INITIALIZE APP
// ========================================

window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App initialized (Enhanced v2.0 with TypeScript)');
  initializeFirebase();
  
  // Subscribe to store changes
  filters.subscribe(() => {
    processAndDisplayApplications();
  });
  
  sortBy.subscribe(() => {
    processAndDisplayApplications();
  });

  // Initialize sort dropdown
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
  if (sortSelect) {
    sortSelect.value = sortBy.get().value;
  }

  loadApplications();
});

// Make functions globally accessible for inline handlers
(window as Window & typeof globalThis & { 
  editApplication: typeof editApplication;
  deleteApplication: typeof deleteApplication;
  cancelEdit: typeof cancelEdit;
  clearAllFilters: typeof clearAllFilters;
  handleDateRangeChange: typeof handleDateRangeChange;
  handleVisaFilterChange: typeof handleVisaFilterChange;
  handleSortChange: typeof handleSortChange;
}).editApplication = editApplication;
(window as any).deleteApplication = deleteApplication;
(window as any).cancelEdit = cancelEdit;
(window as any).clearAllFilters = clearAllFilters;
(window as any).handleDateRangeChange = handleDateRangeChange;
(window as any).handleVisaFilterChange = handleVisaFilterChange;
(window as any).handleSortChange = handleSortChange;
