/**
 * Job Application Tracker - Main Entry Point
 * Enhanced version with TypeScript, state management, and modern architecture
 */

import { getFirebaseConfig } from './config/firebase';
import {
  applications,
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
import { analyticsService } from './services/analytics';
import { eventTrackingService } from './services/eventTracking';
import { createStatCard } from './components/stats/StatCard';
import { createStatusDistributionChart } from './components/charts/StatusDistributionChart';
import { createApplicationFunnelChart } from './components/charts/ApplicationFunnelChart';
import { createVelocityChart } from './components/charts/VelocityChart';
import { createTimeInStatusChart } from './components/charts/TimeInStatusChart';
import { createVisaImpactChart } from './components/charts/VisaImpactChart';
import { createDropOffChart } from './components/charts/DropOffChart';
import { createDayOfWeekChart, createWeekOfMonthChart } from './components/charts/TimingAnalysisChart';
import { PaginationManager } from './utils/pagination';
import { createTableView, type ViewMode } from './utils/viewModes';
import {
  validateApplicationId,
  escapeHtml,
  sanitizeUserInput,
  rateLimiter,
} from './utils/security';
import { securityLogger } from './utils/securityLogger';
import {
  secureFirebaseRef,
  secureFirebaseUpdate,
  secureFirebaseDelete,
  secureFirebaseRead,
} from './utils/firebaseSecurity';
import { createApplicationCardSafe } from './utils/domHelpers';
import { exportToCSV, exportChartAsPNG } from './utils/exportHelpers';
import { animationService } from './services/animationService';
import type { Chart } from 'chart.js';
import type { JobApplication, ApplicationStatus, SortOption } from './types';

// Firebase initialization
let database: firebase.database.Database | undefined;

// Initialize Firebase
function initializeFirebase(): boolean {
  try {
    const config = getFirebaseConfig();
    
    // Check if config is valid (not all MISSING)
    const hasMissingConfig = Object.values(config).some((value) => value === 'MISSING');
    
    if (hasMissingConfig) {
      showFirebaseConfigError();
      database = undefined;
      return false;
    }
    
    const app = firebase.initializeApp(config);
    database = app.database();
    console.log('🔥 Firebase initialized');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    showFirebaseConfigError();
    database = undefined;
    return false;
  }
}

// Check if Firebase is ready
function isFirebaseReady(): boolean {
  return database !== undefined;
}

// Show user-friendly Firebase config error
function showFirebaseConfigError(): void {
  const applicationsSection = document.getElementById('applications-section');
  if (!applicationsSection) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'firebase-config-error';
  errorDiv.style.cssText = `
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    padding: 2rem;
    border-radius: 12px;
    margin: 2rem auto;
    max-width: 600px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  `;
  
  errorDiv.innerHTML = `
    <h2 style="margin: 0 0 1rem 0; font-size: 1.5rem;">⚠️ Firebase Configuration Required</h2>
    <p style="margin: 0 0 1rem 0; line-height: 1.6;">
      To use this application, you need to configure Firebase credentials.
    </p>
    <ol style="margin: 0 0 1rem 0; padding-left: 1.5rem; line-height: 1.8;">
      <li>Create a <code style="background: rgba(0,0,0,0.2); padding: 0.2rem 0.4rem; border-radius: 4px;">.env</code> file in the project root</li>
      <li>Get your Firebase config from <a href="https://console.firebase.google.com" target="_blank" style="color: #fbbf24; text-decoration: underline;">Firebase Console</a></li>
      <li>Fill in the values in <code style="background: rgba(0,0,0,0.2); padding: 0.2rem 0.4rem; border-radius: 4px;">.env</code></li>
      <li>Restart the dev server: <code style="background: rgba(0,0,0,0.2); padding: 0.2rem 0.4rem; border-radius: 4px;">npm run dev</code></li>
    </ol>
    <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
      See <code style="background: rgba(0,0,0,0.2); padding: 0.2rem 0.4rem; border-radius: 4px;">README.md</code> or <code style="background: rgba(0,0,0,0.2); padding: 0.2rem 0.4rem; border-radius: 4px;">AI Markdown Assistance/SETUP.md</code> for detailed instructions.
    </p>
  `;
  
  // Clear existing content and show error
  applicationsSection.innerHTML = '';
  applicationsSection.appendChild(errorDiv);
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
const analyticsSection = document.getElementById('analytics-section') as HTMLElement;
const statsGrid = document.getElementById('stats-grid') as HTMLDivElement;
const chartsContainer = document.getElementById('charts-container') as HTMLDivElement;

// View Mode & Pagination State
let currentViewMode: ViewMode = 'cards';
let currentPage = 1;
const itemsPerPage = 20;

// Edit Mode - Store original data for comparison
let originalApplicationData: JobApplication | null = null;

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
    // Log validation failures
    securityLogger.log({
      type: 'validation_failed',
      message: 'Form validation failed',
      details: { errors: errors.map((e) => e.field) },
    });
    displayValidationErrors(errors);
    return;
  }

  // Sanitize inputs (length limit and clean)
  const sanitizedCompany = sanitizeUserInput(company, 100);
  const sanitizedRole = sanitizeUserInput(role, 100);

  const editId = currentEditId.get();
  if (editId) {
    // Validate that something actually changed
    if (originalApplicationData) {
      const hasChanges = 
        originalApplicationData.company !== sanitizedCompany ||
        originalApplicationData.role !== sanitizedRole ||
        originalApplicationData.dateApplied !== dateApplied ||
        originalApplicationData.status !== status ||
        originalApplicationData.visaSponsorship !== visaSponsorship;

      if (!hasChanges) {
        showInfoMessage('No changes detected. Nothing to update.');
        return;
      }
    }
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

  // Rate limiting check
  if (!rateLimiter.isAllowed('add-application')) {
    securityLogger.log({
      type: 'rate_limited',
      message: 'Rate limit exceeded for add-application',
      details: { operation: 'add-application' },
    });
    showErrorMessage('Too many requests. Please wait a moment before adding another application.');
    return;
  }

  if (!isFirebaseReady()) {
    showErrorMessage('Firebase not configured. Please set up your .env file.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Application';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';
  animationService.animateButtonLoading(submitBtn);

  // Use secure Firebase reference (no ID needed for push)
  const newApplicationRef = secureFirebaseRef(database!, 'applications').push();

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
      eventTrackingService.track('application_added', {
        company,
        status,
        visaSponsorship,
      });
      showSuccessMessage('Application added successfully!');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add Application';
      CacheManager.invalidate();
    })
    .catch((error: unknown) => {
      console.error('❌ Error saving application:', error);
      showErrorMessage('Failed to save application. Please try again.');
      animationService.stopButtonLoading(submitBtn);
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

  if (!isFirebaseReady()) {
    showErrorMessage('Firebase not configured. Please set up your .env file.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Update Application';
    return;
  }

  // Use secure Firebase wrapper
  secureFirebaseUpdate(database!, 'applications', id, updatedData)
    .then(() => {
      console.log('✅ Application updated successfully');
      const oldStatus = originalApplicationData?.status;
      if (oldStatus && oldStatus !== status) {
        eventTrackingService.track('status_changed', {
          applicationId: id,
          fromStatus: oldStatus,
          toStatus: status,
        });
        
        // Animate status change
        const statusBadge = document.querySelector(`[data-app-id="${id}"] .status-badge`) as HTMLElement;
        const card = document.querySelector(`[data-app-id="${id}"]`) as HTMLElement;
        if (statusBadge) {
          // Get status color from CSS or use default
          const statusColors: Record<string, string> = {
            'Applied': '#dbeafe',
            'Phone Screen': '#fef3c7',
            'Technical Interview': '#fce7f3',
            'Final Round': '#e0e7ff',
            'Offer': '#d1fae5',
            'Rejected': '#fee2e2',
          };
          const newColor = statusColors[status] || '#dbeafe';
          animationService.animateStatusChange(statusBadge, newColor);
        }
        if (card) {
          animationService.animateHighlight(card);
        }
      }
      eventTrackingService.track('application_updated', {
        applicationId: id,
        company,
      });
      showSuccessMessage(`Application for ${company} updated successfully!`);
      originalApplicationData = null; // Clear stored data after successful update
      cancelEdit();
      animationService.stopButtonLoading(submitBtn);
      submitBtn.disabled = false;
      CacheManager.invalidate();
    })
    .catch((error: unknown) => {
      console.error('❌ Error updating application:', error);
      
      securityLogger.log({
        type: 'unauthorized_access',
        message: 'Failed to update application',
        details: { operation: 'update-application', id, error: String(error).substring(0, 100) },
      });
      
      showErrorMessage('Failed to update application. Please try again.');
      animationService.stopButtonLoading(submitBtn);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Application';
    });
}

export function deleteApplication(id: string): void {
  // Validate application ID to prevent injection
  try {
    validateApplicationId(id);
  } catch (error) {
    showErrorMessage('Invalid application ID. Operation cancelled.');
    console.error('Security: Invalid ID attempted:', error);
    return;
  }

  // Rate limiting check
  if (!rateLimiter.isAllowed('delete-application')) {
    showErrorMessage('Too many requests. Please wait a moment before deleting again.');
    return;
  }

  if (!isFirebaseReady()) {
    showErrorMessage('Firebase not configured. Please set up your .env file.');
    return;
  }

  console.log('Deleting application:', id);

  // Use secure Firebase read
  secureFirebaseRead(database!, 'applications', id)
    .then((snapshot: firebase.database.DataSnapshot) => {
      const app = snapshot.val() as JobApplication | null;

      if (!app) {
        showErrorMessage('Application not found!');
        return;
      }

      const confirmed = confirm(
        `Are you sure you want to delete the application for ${escapeHtml(app.company || 'Unknown')}?\n\n` +
          `Role: ${escapeHtml(app.role || 'Unknown')}\n` +
          `This action cannot be undone.`
      );

      if (confirmed) {
        // Find and animate card deletion
        const card = document.querySelector(`[data-app-id="${id}"], [data-id="${id}"]`) as HTMLElement;
        
        // Use secure Firebase delete
        secureFirebaseDelete(database!, 'applications', id)
          .then(() => {
            console.log('✅ Application deleted successfully');
            eventTrackingService.track('application_deleted', {
              applicationId: id,
              company: app.company,
            });
            
            // Animate deletion
            if (card) {
              animationService.animateCardDeletion(card, () => {
                showSuccessMessage(`Application for ${escapeHtml(app.company || 'Unknown')} deleted`);
                CacheManager.invalidate();
              });
            } else {
              showSuccessMessage(`Application for ${escapeHtml(app.company || 'Unknown')} deleted`);
              CacheManager.invalidate();
            }
          })
          .catch((error: unknown) => {
            console.error('❌ Error deleting application:', error);
            
            securityLogger.log({
              type: 'unauthorized_access',
              message: 'Failed to delete application',
              details: { operation: 'delete-application', id, error: String(error).substring(0, 100) },
            });
            
            showErrorMessage('Failed to delete application. Please try again.');
          });
      }
    })
    .catch((error: unknown) => {
      console.error('Error loading application:', error);
      
      securityLogger.log({
        type: 'unauthorized_access',
        message: 'Failed to load application for deletion',
        details: { operation: 'delete-application', id, error: String(error).substring(0, 100) },
      });
      
      showErrorMessage('Error loading application data');
    });
}

// ========================================
// EDIT MODE FUNCTIONS
// ========================================

export function editApplication(id: string): void {
  if (!database) {
    showErrorMessage('Firebase not configured. Please set up your .env file.');
    return;
  }

  // Validate application ID to prevent injection
  try {
    validateApplicationId(id);
  } catch (error) {
    showErrorMessage('Invalid application ID. Operation cancelled.');
    console.error('Security: Invalid ID attempted:', error);
    return;
  }

  console.log('Editing application:', id);

  // Use secure Firebase read
  secureFirebaseRead(database!, 'applications', id)
    .then((snapshot: firebase.database.DataSnapshot) => {
      const app = snapshot.val() as JobApplication | null;

      if (!app) {
        showErrorMessage('Application not found!');
        return;
      }

      // Store original data for change detection
      originalApplicationData = {
        ...app,
        id: id,
      };

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
    .catch((error: unknown) => {
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

  const span = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = escapeHtml(companyName);
  span.appendChild(document.createTextNode('✏️ Editing: '));
  span.appendChild(strong);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-cancel-edit';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', cancelEdit);

  indicator.appendChild(span);
  indicator.appendChild(cancelBtn);

  const formSection = document.getElementById('form-section');
  const form = document.getElementById('application-form');
  if (formSection && form) {
    formSection.insertBefore(indicator, form);
  }
}

export function cancelEdit(): void {
  setCurrentEditId(null);
  originalApplicationData = null; // Clear stored original data
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
    animationService.animateMessage(messageDiv, 'error');
  }

  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

function showInfoMessage(message: string): void {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'info-message';
  messageDiv.textContent = message;

  const formSection = document.getElementById('form-section');
  const form = document.getElementById('application-form');
  if (formSection && form) {
    formSection.insertBefore(messageDiv, form);
    animationService.animateMessage(messageDiv, 'info');
  }

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// ========================================
// LOAD APPLICATIONS WITH CACHING
// ========================================

function loadApplications(): void {
  // Check if Firebase is initialized
  if (!isFirebaseReady()) {
    console.warn('⚠️ Cannot load applications: Firebase not initialized');
    // Try to load from cache only
    const cached = CacheManager.load();
    if (cached && cached.length > 0) {
      console.log('📦 Loading from cache only (Firebase not configured)...');
      setApplications(cached);
      processAndDisplayApplications();
    }
    return;
  }

  // Try to load from cache first
  const cached = CacheManager.load();
  if (cached && cached.length > 0) {
    console.log('📦 Loading from cache...');
    setApplications(cached);
    processAndDisplayApplications();
  }

  // Show loading state
  showLoadingState();

  // Listen for data changes in Firebase (path is whitelisted, no user input)
  const applicationsRef = secureFirebaseRef(database!, 'applications');
  applicationsRef.on('value', (snapshot: firebase.database.DataSnapshot) => {
    const applicationsData = snapshot.val() as Record<string, Omit<JobApplication, 'id'>> | null;

  if (!applicationsData) {
    if (applicationsContainer) {
      applicationsContainer.innerHTML = '';
      const message = document.createElement('p');
      message.id = 'no-apps-message';
      message.textContent = 'No applications yet. Add your first one above!';
      applicationsContainer.appendChild(message);
    }
    updateCounter(0, 0);
    setApplications([]);
    setFilteredApplications([]);
    return;
  }

    // Convert to array
    const applicationsArray: JobApplication[] = Object.keys(applicationsData)
      .map((key) => {
        const appData = (applicationsData as Record<string, Partial<JobApplication>>)[key];
        return {
          id: key,
          company: appData?.company || '',
          role: appData?.role || '',
          dateApplied: appData?.dateApplied || '',
          status: (appData?.status || 'Applied') as ApplicationStatus,
          visaSponsorship: appData?.visaSponsorship || false,
          timestamp: appData?.timestamp || Date.now(),
          updatedAt: appData?.updatedAt,
        } as JobApplication;
      });

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

  // Convert filter store to ApplicationFilters
  const appFilters = {
    search: currentFilters.search || '',
    status: (currentFilters.status || 'all') as ApplicationStatus | 'all',
    dateRange: (currentFilters.dateRange || 'all') as 'all' | 'week' | 'month' | 'quarter',
    visaSponsorship: (currentFilters.visaSponsorship || 'all') as 'all' | 'true' | 'false',
  };

  // Apply filters
  const filtered = FilterManager.applyFilters(apps, appFilters);
  setFilteredApplications(filtered);

  // For analytics view, use filtered data (respects filters)
  // For cards/table view, apply sorting
  if (currentViewMode === 'analytics') {
    displayApplications(filtered);
    updateCounter(filtered.length, apps.length);
  } else {
    // Apply sorting for cards/table view
    const sorted = SortManager.sort(filtered, currentSort);
    displayApplications(sorted);
    updateCounter(sorted.length, apps.length);
  }
}

// ========================================
// DISPLAY APPLICATIONS
// ========================================

function displayApplications(apps: JobApplication[]): void {
  if (!applicationsContainer) return;

  // Handle view mode switching
  if (currentViewMode === 'analytics') {
    displayAnalyticsDashboard(apps);
    return;
  }

  applicationsContainer.innerHTML = '';

  if (apps.length === 0) {
    applicationsContainer.innerHTML = '';
    
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    
    const message = document.createElement('p');
    message.textContent = 'No applications match your filters';
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-clear-filters';
    clearBtn.textContent = 'Clear Filters';
    clearBtn.addEventListener('click', clearAllFilters);
    
    noResults.appendChild(message);
    noResults.appendChild(clearBtn);
    applicationsContainer.appendChild(noResults);
    return;
  }

  // Pagination
  const pagination = PaginationManager.calculatePagination(
    apps.length,
    itemsPerPage,
    currentPage
  );
  const paginatedApps = PaginationManager.getPageItems(apps, pagination);

  // Display based on view mode
  if (currentViewMode === 'table') {
    const table = createTableView(paginatedApps);
    applicationsContainer.appendChild(table);
    // Animate table rows entrance
    setTimeout(() => {
      const rows = table.querySelectorAll('tbody tr');
      animationService.animateCardEntrance(rows as NodeListOf<HTMLElement>, { delay: 30 });
    }, 50);
  } else {
    // Card view (default)
    const cards: HTMLElement[] = [];
    paginatedApps.forEach((app) => {
      const appCard = createApplicationCard(app);
      applicationsContainer.appendChild(appCard);
      cards.push(appCard);
    });
    // Animate card entrance with stagger
    setTimeout(() => {
      animationService.animateCardEntrance(cards, { delay: 50, startDelay: 100 });
    }, 50);
  }

  // Add pagination controls if needed
  if (pagination.totalPages > 1) {
    const paginationDiv = createPaginationControlsSafe(pagination);
    applicationsContainer.appendChild(paginationDiv);

    // Attach pagination event listeners
    attachPaginationListeners(pagination);
  }
}

function createPaginationControlsSafe(pagination: ReturnType<typeof PaginationManager.calculatePagination>): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'pagination-controls';

  const prevBtn = document.createElement('button');
  prevBtn.className = `page-btn prev ${pagination.currentPage === 1 ? 'disabled' : ''}`;
  prevBtn.textContent = '← Previous';
  prevBtn.dataset.action = 'prev';
  if (pagination.currentPage === 1) {
    prevBtn.disabled = true;
  }
  container.appendChild(prevBtn);

  const pageNumbers = document.createElement('div');
  pageNumbers.className = 'page-numbers';

  // Calculate visible page range
  const maxVisible = 5;
  let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First page
  if (startPage > 1) {
    const firstBtn = document.createElement('button');
    firstBtn.className = 'page-btn';
    firstBtn.textContent = '1';
    firstBtn.dataset.page = '1';
    pageNumbers.appendChild(firstBtn);

    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-ellipsis';
      ellipsis.textContent = '...';
      pageNumbers.appendChild(ellipsis);
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `page-btn ${i === pagination.currentPage ? 'active' : ''}`;
    pageBtn.textContent = String(i);
    pageBtn.dataset.page = String(i);
    if (i === pagination.currentPage) {
      pageBtn.classList.add('active');
    }
    pageNumbers.appendChild(pageBtn);
  }

  // Last page
  if (endPage < pagination.totalPages) {
    if (endPage < pagination.totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'page-ellipsis';
      ellipsis.textContent = '...';
      pageNumbers.appendChild(ellipsis);
    }

    const lastBtn = document.createElement('button');
    lastBtn.className = 'page-btn';
    lastBtn.textContent = String(pagination.totalPages);
    lastBtn.dataset.page = String(pagination.totalPages);
    pageNumbers.appendChild(lastBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = `page-btn next ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`;
  nextBtn.textContent = 'Next →';
  nextBtn.dataset.action = 'next';
  if (pagination.currentPage === pagination.totalPages) {
    nextBtn.disabled = true;
  }

  const info = document.createElement('div');
  info.className = 'pagination-info';
  info.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalItems} total)`;

  container.appendChild(pageNumbers);
  container.appendChild(nextBtn);
  container.appendChild(info);

  return container;
}

function displayAnalyticsDashboard(apps: JobApplication[]): void {
  if (!analyticsSection || !statsGrid || !chartsContainer) return;

  // Show analytics section, hide applications section
  analyticsSection.style.display = 'block';
  if (applicationsContainer) {
    applicationsContainer.innerHTML = '';
  }

  // Add CSV export button to analytics section header
  addCSVExportButton(apps);

  // Calculate metrics from filtered applications
  // This allows analytics to respect current filters
  const metrics = analyticsService.calculateMetrics(apps);

  // Display stat cards
  displayStatCards(metrics);

  // Display charts
  displayCharts(metrics);

  // Show insights if available
  const insights = analyticsService.getInsights(metrics);
  if (insights.length > 0) {
    displayInsights(insights);
  }
}

function addCSVExportButton(_apps: JobApplication[]): void {
  // Remove existing export button if any
  const existingBtn = document.getElementById('csv-export-btn');
  if (existingBtn) {
    existingBtn.remove();
  }

  // Find analytics section header
  const analyticsHeader = analyticsSection?.querySelector('h2');
  if (!analyticsHeader) return;

  // Create export button
  const exportBtn = document.createElement('button');
  exportBtn.id = 'csv-export-btn';
  exportBtn.className = 'csv-export-btn';
  exportBtn.textContent = '📊 Export CSV';
  exportBtn.title = 'Export all applications as CSV';
  exportBtn.addEventListener('click', () => {
    const filteredApps = applications.get();
    const currentFilters = filters.get();
    
    // Apply current filters to determine what to export
    const appFilters = {
      search: currentFilters.search || '',
      status: (currentFilters.status || 'all') as ApplicationStatus | 'all',
      dateRange: (currentFilters.dateRange || 'all') as 'all' | 'week' | 'month' | 'quarter',
      visaSponsorship: (currentFilters.visaSponsorship || 'all') as 'all' | 'true' | 'false',
    };
    
    const filtered = FilterManager.applyFilters(filteredApps, appFilters);
    const filename = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    eventTrackingService.track('export_csv', {
      applicationCount: filtered.length,
    });
    exportToCSV(filtered, filename);
  });

  // Insert button after header
  analyticsHeader.insertAdjacentElement('afterend', exportBtn);
}

function displayInsights(insights: string[]): void {
  if (!chartsContainer) return;

  // Remove existing insights if any
  const existingInsights = document.getElementById('analytics-insights');
  if (existingInsights) {
    existingInsights.remove();
  }

  const insightsDiv = document.createElement('div');
  insightsDiv.id = 'analytics-insights';
  insightsDiv.className = 'analytics-insights';

  const title = document.createElement('div');
  title.className = 'chart-title';
  title.textContent = '💡 Insights';

  const list = document.createElement('ul');
  list.className = 'insights-list';

  insights.forEach((insight) => {
    const li = document.createElement('li');
    li.textContent = insight; // Safe - insights come from our service, not user input
    list.appendChild(li);
  });

  insightsDiv.appendChild(title);
  insightsDiv.appendChild(list);
  chartsContainer.appendChild(insightsDiv);
}

function displayStatCards(metrics: ReturnType<typeof analyticsService.calculateMetrics>): void {
  if (!statsGrid) return;

  statsGrid.innerHTML = '';

  const statCards = [
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

  statCards.forEach((card) => statsGrid.appendChild(card));
}

// Store chart instances for export
const chartInstances: Map<string, Chart> = new Map();

function displayCharts(metrics: ReturnType<typeof analyticsService.calculateMetrics>): void {
  if (!chartsContainer) return;

  chartsContainer.innerHTML = '';
  chartInstances.clear(); // Clear previous chart instances

  // Helper function to create a chart container with export button
  const createChartContainer = (
    id: string,
    title: string,
    filename: string,
    description?: string
  ): { container: HTMLDivElement; wrapper: HTMLDivElement; canvas: HTMLCanvasElement } => {
    const container = document.createElement('div');
    container.className = 'chart-container';

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
    container.appendChild(header);
    container.appendChild(wrapper);
    chartsContainer.appendChild(container);

    return { container, wrapper, canvas };
  };

  // Status Distribution Chart
  createChartContainer(
    'status-chart',
    'Status Distribution',
    'status-distribution.png',
    'Breakdown of applications across all status stages'
  );

  // Application Funnel Chart
  createChartContainer(
    'funnel-chart',
    'Application Funnel',
    'application-funnel.png',
    'Conversion rates through each stage of the application process'
  );

  // Velocity Chart
  createChartContainer(
    'velocity-chart',
    'Weekly Application Velocity',
    'weekly-velocity.png',
    'Number of applications submitted per week over time'
  );

  // Time in Status Chart
  createChartContainer(
    'time-status-chart',
    'Average Time in Status',
    'time-in-status.png',
    'Average days spent in each application status'
  );

  // Visa Impact Chart (only if we have visa data)
  if (metrics.visaImpact && (metrics.visaImpact.withVisa.total > 0 || metrics.visaImpact.withoutVisa.total > 0)) {
    createChartContainer(
      'visa-impact-chart',
      'Visa Sponsorship Impact',
      'visa-impact.png',
      'Comparison of success and response rates for applications with and without visa sponsorship'
    );
  }

  // Drop-off Analysis Chart (only if we have drop-off data)
  if (metrics.dropOffAnalysis && metrics.dropOffAnalysis.length > 0) {
    createChartContainer(
      'dropoff-chart',
      'Drop-off Analysis Between Stages',
      'dropoff-analysis.png',
      'Percentage of applications that drop off between each stage transition'
    );
  }

  // Timing Analysis Charts (only if we have timing data)
  if (metrics.timingAnalysis) {
    const hasDayOfWeekData = Object.keys(metrics.timingAnalysis.byDayOfWeek).length > 0;
    const hasWeekOfMonthData = Object.keys(metrics.timingAnalysis.byWeekOfMonth).length > 0;
    
    if (hasDayOfWeekData) {
      createChartContainer(
        'timing-day-chart',
        'Success Rate by Day of Week',
        'timing-day-of-week.png',
        'Optimal days to submit applications based on historical success rates'
      );
    }
    if (hasWeekOfMonthData) {
      createChartContainer(
        'timing-week-chart',
        'Success Rate by Week of Month',
        'timing-week-of-month.png',
        'Best weeks of the month to submit applications for better outcomes'
      );
    }
  }

  // Render all charts after DOM is ready
  setTimeout(() => {
    // Animate chart containers entrance
    const chartContainers = chartsContainer.querySelectorAll('.chart-container');
    if (chartContainers.length > 0) {
      animationService.animateChartEntrance(chartContainers as NodeListOf<HTMLElement>, { delay: 100 });
    }
    
    // Render charts
    // Status Distribution
    const statusCanvas = document.getElementById('status-chart') as HTMLCanvasElement;
    if (statusCanvas) {
      const chart = createStatusDistributionChart(statusCanvas, {
        statusDistribution: metrics.statusDistribution,
      });
      chartInstances.set('status-chart', chart);
    }

    // Funnel Chart
    const funnelCanvas = document.getElementById('funnel-chart') as HTMLCanvasElement;
    if (funnelCanvas) {
      const chart = createApplicationFunnelChart(funnelCanvas, {
        funnelData: metrics.funnelData,
      });
      chartInstances.set('funnel-chart', chart);
    }

    // Velocity Chart
    const velocityCanvas = document.getElementById('velocity-chart') as HTMLCanvasElement;
    if (velocityCanvas) {
      const chart = createVelocityChart(velocityCanvas, {
        weeklyVelocity: metrics.weeklyVelocity,
      });
      chartInstances.set('velocity-chart', chart);
    }

    // Time in Status Chart
    const timeStatusCanvas = document.getElementById('time-status-chart') as HTMLCanvasElement;
    if (timeStatusCanvas) {
      const chart = createTimeInStatusChart(timeStatusCanvas, {
        averageTimeInStatus: metrics.averageTimeInStatus,
      });
      chartInstances.set('time-status-chart', chart);
    }

    // Visa Impact Chart
    if (metrics.visaImpact && (metrics.visaImpact.withVisa.total > 0 || metrics.visaImpact.withoutVisa.total > 0)) {
      const visaCanvas = document.getElementById('visa-impact-chart') as HTMLCanvasElement;
      if (visaCanvas) {
        const chart = createVisaImpactChart(visaCanvas, {
          withVisa: metrics.visaImpact.withVisa,
          withoutVisa: metrics.visaImpact.withoutVisa,
        });
        chartInstances.set('visa-impact-chart', chart);
      }
    }

    // Drop-off Analysis Chart
    if (metrics.dropOffAnalysis && metrics.dropOffAnalysis.length > 0) {
      const dropOffCanvas = document.getElementById('dropoff-chart') as HTMLCanvasElement;
      if (dropOffCanvas) {
        const chart = createDropOffChart(dropOffCanvas, {
          dropOffAnalysis: metrics.dropOffAnalysis,
        });
        chartInstances.set('dropoff-chart', chart);
      }
    }

    // Timing Analysis Charts
    if (metrics.timingAnalysis) {
      // Day of Week Chart
      const dayCanvas = document.getElementById('timing-day-chart') as HTMLCanvasElement;
      if (dayCanvas && Object.keys(metrics.timingAnalysis.byDayOfWeek).length > 0) {
        const chart = createDayOfWeekChart(dayCanvas, {
          byDayOfWeek: metrics.timingAnalysis.byDayOfWeek,
          byWeekOfMonth: metrics.timingAnalysis.byWeekOfMonth,
        });
        chartInstances.set('timing-day-chart', chart);
      }

      // Week of Month Chart
      const weekCanvas = document.getElementById('timing-week-chart') as HTMLCanvasElement;
      if (weekCanvas && Object.keys(metrics.timingAnalysis.byWeekOfMonth).length > 0) {
        const chart = createWeekOfMonthChart(weekCanvas, {
          byDayOfWeek: metrics.timingAnalysis.byDayOfWeek,
          byWeekOfMonth: metrics.timingAnalysis.byWeekOfMonth,
        });
        chartInstances.set('timing-week-chart', chart);
      }
    }
  }, 100);
}

function attachPaginationListeners(pagination: ReturnType<typeof PaginationManager.calculatePagination>): void {
  const pageButtons = document.querySelectorAll('.page-btn[data-page]');
  const prevButton = document.querySelector('.page-btn[data-action="prev"]');
  const nextButton = document.querySelector('.page-btn[data-action="next"]');

  pageButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = parseInt((btn as HTMLElement).dataset.page || '1');
      currentPage = page;
      processAndDisplayApplications();
    });
  });

  prevButton?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      processAndDisplayApplications();
    }
  });

  nextButton?.addEventListener('click', () => {
    if (currentPage < pagination.totalPages) {
      currentPage++;
      processAndDisplayApplications();
    }
  });
}

export function switchViewMode(mode: ViewMode): void {
  const previousMode = currentViewMode;
  currentViewMode = mode;
  currentPage = 1; // Reset to first page

  // Update button states
  document.querySelectorAll('.view-toggle-btn').forEach((btn) => {
    btn.classList.remove('active');
    if ((btn as HTMLElement).dataset.view === mode) {
      btn.classList.add('active');
    }
  });

  // Get elements for transition
  const applicationsSectionElement = applicationsContainer?.parentElement as HTMLElement | null;
  
  // Show/hide sections with animation
  if (mode === 'analytics') {
    eventTrackingService.track('analytics_viewed');
    
    // Animate transition to analytics view
    if (previousMode !== 'analytics') {
      animationService.transitionView(
        applicationsSectionElement || null,
        analyticsSection,
        { duration: 300, direction: 'horizontal' }
      );
    }
    
    if (analyticsSection) analyticsSection.style.display = 'block';
    if (applicationsSectionElement) {
      // Will be hidden by animation
    }
    // Keep filters visible in analytics view (they apply to analytics data)
    // Hide sort controls as they don't apply to analytics
    const sortSection = document.querySelector('.sort-controls')?.parentElement;
    if (sortSection) (sortSection as HTMLElement).style.display = 'none';
  } else {
    // Animate transition to cards/table view
    if (previousMode === 'analytics') {
      animationService.transitionView(
        analyticsSection,
        applicationsSectionElement || null,
        { duration: 300, direction: 'horizontal' }
      );
    }
    
    if (analyticsSection) analyticsSection.style.display = 'none';
    if (applicationsSectionElement) {
      applicationsSectionElement.style.display = 'block';
    }
    // Show filters and sort when in cards/table view
    const filtersSection = document.querySelector('.advanced-filters')?.parentElement;
    const sortSection = document.querySelector('.sort-controls')?.parentElement;
    if (filtersSection) (filtersSection as HTMLElement).style.display = 'block';
    if (sortSection) (sortSection as HTMLElement).style.display = 'block';
  }

  processAndDisplayApplications();
}

function createApplicationCard(app: JobApplication): HTMLDivElement {
  // Use safe DOM creation (no innerHTML)
  const card = createApplicationCardSafe(app);
  
  // Attach event listeners using event delegation pattern
  const editBtn = card.querySelector('.btn-edit[data-action="edit"]');
  const deleteBtn = card.querySelector('.btn-delete[data-action="delete"]');
  
  if (editBtn && editBtn instanceof HTMLElement) {
    const appId = editBtn.dataset.appId;
    if (appId) {
      editBtn.addEventListener('click', () => {
        try {
          validateApplicationId(appId);
          editApplication(appId);
        } catch (error) {
          showErrorMessage('Invalid application ID');
          console.error('Security: Invalid edit attempt', error);
        }
      });
    }
  }
  
  if (deleteBtn && deleteBtn instanceof HTMLElement) {
    const appId = deleteBtn.dataset.appId;
    if (appId) {
      deleteBtn.addEventListener('click', () => {
        try {
          validateApplicationId(appId);
          deleteApplication(appId);
        } catch (error) {
          showErrorMessage('Invalid application ID');
          console.error('Security: Invalid delete attempt', error);
        }
      });
    }
  }

  return card;
}

// ========================================
// FILTER & SEARCH EVENT LISTENERS
// ========================================

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    updateFilter('search', target.value);
    if (target.value.length > 0) {
      eventTrackingService.track('search_performed', { query: target.value });
    }
    processAndDisplayApplications();
  });
}

if (statusFilter) {
  statusFilter.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    updateFilter('status', target.value as ApplicationStatus | 'all');
    eventTrackingService.track('filter_applied', {
      filterType: 'status',
      value: target.value,
    });
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
    applicationsContainer.innerHTML = '';
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-state';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    const message = document.createElement('p');
    message.textContent = 'Loading applications...';

    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(message);
    applicationsContainer.appendChild(loadingDiv);
  }
}

// ========================================
// FILTER HELPERS (for inline handlers)
// ========================================

export function handleDateRangeChange(value: string): void {
  updateFilter('dateRange', value as 'all' | 'week' | 'month' | 'quarter');
  eventTrackingService.track('filter_applied', {
    filterType: 'dateRange',
    value,
  });
  processAndDisplayApplications();
}

export function handleVisaFilterChange(value: string): void {
  updateFilter('visaSponsorship', value as 'all' | 'true' | 'false');
  eventTrackingService.track('filter_applied', {
    filterType: 'visaSponsorship',
    value,
  });
  processAndDisplayApplications();
}

export function handleSortChange(value: string): void {
  setSortPreference(value as SortOption);
  processAndDisplayApplications();
}

// ========================================
// INITIALIZE APP
// ========================================

window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App initialized (Enhanced v2.4.0 with TypeScript)');
  
  // Initialize Firebase and only load applications if successful
  const firebaseInitialized = initializeFirebase();
  
  if (firebaseInitialized) {
    loadApplications();
  }
  
  // Subscribe to store changes
  filters.subscribe(() => {
    processAndDisplayApplications();
  });
  
  sortBy.subscribe(() => {
    processAndDisplayApplications();
  });

  // Initialize view mode buttons
  document.querySelectorAll('.view-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.view as ViewMode;
      if (mode) {
        switchViewMode(mode);
      }
    });
  });

  // Initialize filter event listeners (replacing inline handlers)
  const dateRangeFilter = document.getElementById('date-range-filter') as HTMLSelectElement;
  const visaFilter = document.getElementById('visa-filter') as HTMLSelectElement;
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
  const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
  
  // Add form field focus animations
  const formFields = form?.querySelectorAll('input, select, textarea');
  formFields?.forEach((field) => {
    field.addEventListener('focus', () => {
      animationService.animateFormFieldFocus(field as HTMLElement);
    });
    field.addEventListener('blur', () => {
      animationService.animateFormFieldBlur(field as HTMLElement);
    });
  });

  // Initialize sort dropdown
  if (sortSelect) {
    sortSelect.value = sortBy.get().value;
  }

  if (dateRangeFilter) {
    dateRangeFilter.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      handleDateRangeChange(target.value);
    });
  }

  if (visaFilter) {
    visaFilter.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      handleVisaFilterChange(target.value);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      handleSortChange(target.value);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelEdit);
  }

  // Event delegation for table actions (handles dynamically created buttons)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    // Handle table row actions
    if (target.classList.contains('btn-edit-small') || target.classList.contains('btn-delete-small')) {
      const action = target.dataset.action;
      const appId = target.dataset.appId;
      
      if (appId) {
        try {
          validateApplicationId(appId);
          if (action === 'edit') {
            editApplication(appId);
          } else if (action === 'delete') {
            deleteApplication(appId);
          }
        } catch (error) {
          showErrorMessage('Invalid application ID');
          console.error('Security: Invalid action attempt', error);
        }
      }
    }
  });
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
(window as any).switchViewMode = switchViewMode;
