/**
 * Job Application Tracker - Main Entry Point
 * Enhanced version with TypeScript, state management, and modern architecture
 */

import '../style.css';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { getFirebaseConfig } from './config/firebase';
import {
  applications,
  filters,
  sortBy,
  setApplications,
  setFilteredApplications,
  updateFilter,
  resetFilters,
  setSortPreference,
} from './stores/applicationStore';
import { FilterManager } from './utils/filters';
import { TaggingService } from './services/taggingService';
import { SortManager } from './utils/sorting';
import { CacheManager } from './utils/cache';
import { analyticsService } from './services/analytics';
import { eventTrackingService } from './services/eventTracking';
import { createStatCard } from './components/stats/StatCard';
// Chart imports removed for lazy loading
import { PaginationManager } from './utils/pagination';
import { createTableView, type ViewMode } from './utils/viewModes';
import {
  validateApplicationId,
  escapeHtml,
} from './utils/security';
import { ApplicationController } from './controllers/ApplicationController';
import { FormController, FormElements } from './controllers/FormController';
import {
  createApplicationCardSafe,
  showSuccessMessage,
  showErrorMessage,
  showInfoMessage
} from './utils/domHelpers';
import { generateDemoData } from './utils/demoData';
import { exportToCSV } from './utils/exportHelpers';
import {
  triggerCSVImport,
  formatImportResult,
  ImportError,
  generateErrorReport,
  type ImportResult,
} from './utils/importHelpers';
import { animationService } from './services/animationService';
import { authService } from './services/authService';
import { createLoginForm } from './components/auth/LoginForm';
import { createSignUpForm } from './components/auth/SignUpForm';
import { createUserProfile } from './components/auth/UserProfile';

import type { JobApplication, ApplicationStatus, SortOption, ApplicationFilters } from './types';

// Initialize PWA Install Prompt
new PwaInstallPrompt();

// Firebase initialization
let database: firebase.database.Database | undefined;

let auth: firebase.auth.Auth | undefined;
let appController: ApplicationController | undefined;
let formController: FormController | undefined;

// Initialize Firebase
function initializeFirebase(): boolean {
  try {
    const config = getFirebaseConfig();

    // Check if config is valid (not all MISSING)
    const hasMissingConfig = Object.values(config).some(value => value === 'MISSING');

    if (hasMissingConfig) {
      showFirebaseConfigError();
      database = undefined;
      auth = undefined;
      return false;
    }

    const app = firebase.initializeApp(config);
    database = app.database();

    // In Firebase compat mode, auth is accessed via firebase.auth(), not app.auth()
    // Type assertion needed because TypeScript doesn't fully understand the compat API
    auth = (firebase as any).auth() as firebase.auth.Auth;

    if (!auth) {
      throw new Error('Firebase Auth failed to initialize');
    }

    // Initialize auth service
    authService.initialize(auth);

    // Initialize Application Controller
    appController = new ApplicationController(database!);

    // Initialize Form Controller
    const formElements: FormElements = {
      form: document.getElementById('application-form') as HTMLFormElement,
      submitBtn: document.getElementById('submit-btn') as HTMLButtonElement,
      companyInput: document.getElementById('company') as HTMLInputElement,
      roleInput: document.getElementById('role') as HTMLInputElement,
      dateInput: document.getElementById('date') as HTMLInputElement,
      statusSelect: document.getElementById('status') as HTMLSelectElement,
      visaCheckbox: document.getElementById('visa') as HTMLInputElement,
      tagInput: document.getElementById('tag-input') as HTMLInputElement,
      addTagBtn: document.getElementById('add-tag-btn') as HTMLButtonElement,
      selectedTagsContainer: document.getElementById('selected-tags') as HTMLElement,
      tagSuggestionsContainer: document.getElementById('tag-suggestions') as HTMLElement,
      tagSuggestionsList: document.getElementById('suggestions-list') as HTMLElement,
      tagCategoriesList: document.getElementById('tag-categories-list') as HTMLElement,
      formSection: document.getElementById('form-section') as HTMLElement,
    };

    formController = new FormController(formElements, appController);
    formController.init();

    console.log('🔥 Firebase initialized');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    showFirebaseConfigError();
    database = undefined;
    auth = undefined;
    return false;
  }
}

// Check if Firebase is ready
function isFirebaseReady(): boolean {
  return database !== undefined && auth !== undefined;
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
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
const counterText = document.getElementById('counter-text') as HTMLSpanElement;
const applicationsContainer = document.getElementById('applications-container') as HTMLDivElement;
const analyticsSection = document.getElementById('analytics-section') as HTMLElement;
const statsGrid = document.getElementById('stats-grid') as HTMLDivElement;
const chartsContainer = document.getElementById('charts-container') as HTMLDivElement;

// View Mode & Pagination State
let currentViewMode: ViewMode = 'cards';
let currentPage = 1;
const itemsPerPage = 20;

// ========================================
// FORM SUBMISSION WITH VALIDATION
// ========================================

// Form logic moved to FormController


// Logic moved to FormController
// ========================================
// EDIT / DELETE HANDLERS
// ========================================

export async function editApplication(id: string): Promise<void> {
  if (!formController || !appController) return;

  try {
    validateApplicationId(id);
    const app = await appController.getApplication(id);
    if (app) {
      formController.setEditMode(app);
    }
  } catch (error: any) {
    showErrorMessage(error.message || 'Failed to fetch application for editing.');
  }
}

export function cancelEdit(): void {
  formController?.cancelEdit();
}

export async function deleteApplication(id: string): Promise<void> {
  if (!appController) return;

  try {
    validateApplicationId(id);

    // Get app details from store for confirmation dialog
    const allApps = applications.get();
    const app = allApps.find(a => a.id === id);
    const companyName = app ? app.company : 'Unknown Application';

    if (!confirm(`Are you sure you want to delete the application for ${escapeHtml(companyName)}?`)) {
      return;
    }

    await appController.deleteApplication(id);
    showSuccessMessage('Application deleted successfully!');
  } catch (error: any) {
    showErrorMessage(error.message || 'Failed to delete application.');
  }
}


// ========================================
// LOAD APPLICATIONS WITH CACHING
// ========================================

function loadApplications(): void {
  // Check if Firebase is initialized
  if (!isFirebaseReady() || !appController) {
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

  // Check if user is authenticated
  const user = authService.getCurrentUser();
  if (!user) {
    console.log('⚠️ Cannot load applications: User not authenticated');
    showLoadingState();
    return;
  }

  // Subscribe using controller
  // Note: We are not storing the unsubscribe function here as this is a top-level listener.
  // In a component refactor, we would handle cleanup.
  appController.subscribeToApplications((apps) => {
    if (apps.length === 0) {
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

    setApplications(apps);
    CacheManager.save(apps);
    processAndDisplayApplications();

    console.log(`📊 Loaded ${apps.length} applications from Firebase`);
  });
}

function processAndDisplayApplications(): void {
  const apps = applications.get();
  const currentFilters = filters.get();
  const currentSort = sortBy.get().value;

  // Convert filter store to ApplicationFilters
  const appFilters: ApplicationFilters = {
    search: currentFilters.search || '',
    status: (currentFilters.status || 'all') as ApplicationStatus | 'all',
    dateRange: (currentFilters.dateRange || 'all') as 'all' | 'week' | 'month' | 'quarter',
    visaSponsorship: (currentFilters.visaSponsorship || 'all') as 'all' | 'true' | 'false',
    tags: (currentFilters.tags || []) as string[],
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
  const pagination = PaginationManager.calculatePagination(apps.length, itemsPerPage, currentPage);
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
    paginatedApps.forEach(app => {
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

function createPaginationControlsSafe(
  pagination: ReturnType<typeof PaginationManager.calculatePagination>
): HTMLDivElement {
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
  const endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

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

  // Display charts (Lazy Loaded)
  import('./components/charts/LazyChartLoader')
    .then(({ renderCharts }) => {
      if (chartsContainer) {
        renderCharts(metrics, chartsContainer);
      }
    })
    .catch(err => console.error('Failed to load charts', err));

  // Show insights if available
  const insights = analyticsService.getInsights(metrics);
  if (insights.length > 0) {
    displayInsights(insights);
  }
}

function addCSVExportButton(_apps: JobApplication[]): void {
  // Remove existing export/import buttons if any
  const existingExportBtn = document.getElementById('csv-export-btn');
  const existingImportBtn = document.getElementById('csv-import-btn');
  if (existingExportBtn) existingExportBtn.remove();
  if (existingImportBtn) existingImportBtn.remove();

  // Find analytics section header
  const analyticsHeader = analyticsSection?.querySelector('h2');
  if (!analyticsHeader) return;

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'csv-buttons-container';
  buttonContainer.style.cssText = 'display: flex; gap: 0.75rem; margin-top: 0.5rem;';

  // Create export button
  const exportBtn = document.createElement('button');
  exportBtn.id = 'csv-export-btn';
  exportBtn.className = 'csv-export-btn';
  exportBtn.textContent = '📊 Export CSV';
  exportBtn.title = 'Export all applications as CSV';
  exportBtn.addEventListener('click', () => {
    const filteredApps = applications.get();
    const currentFilters = filters.get();

    const appFilters: ApplicationFilters = {
      search: currentFilters.search || '',
      status: (currentFilters.status || 'all') as ApplicationStatus | 'all',
      dateRange: (currentFilters.dateRange || 'all') as 'all' | 'week' | 'month' | 'quarter',
      visaSponsorship: (currentFilters.visaSponsorship || 'all') as 'all' | 'true' | 'false',
      tags: (currentFilters.tags || []) as string[],
    };

    const filtered = FilterManager.applyFilters(filteredApps, appFilters);
    const filename = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    eventTrackingService.track('export_csv', {
      applicationCount: filtered.length,
    });
    exportToCSV(filtered, filename);
  });

  // Create import button
  const importBtn = document.createElement('button');
  importBtn.id = 'csv-import-btn';
  importBtn.className = 'csv-import-btn';
  importBtn.textContent = '📥 Import CSV';
  importBtn.title = 'Import applications from CSV file';
  importBtn.addEventListener('click', () => {
    handleCSVImport();
  });

  buttonContainer.appendChild(exportBtn);
  buttonContainer.appendChild(importBtn);

  // Insert button container after header
  analyticsHeader.insertAdjacentElement('afterend', buttonContainer);
}

/**
 * Handle CSV import with progress indication and error handling
 */
function handleCSVImport(): void {
  const user = authService.getCurrentUser();
  if (!user) {
    showErrorMessage('Please sign in to import applications.');
    return;
  }

  let progressModal: HTMLElement | null = null;

  triggerCSVImport(
    (result: ImportResult) => {
      // Remove progress modal if it exists
      if (progressModal) {
        progressModal.remove();
        progressModal = null;
      }

      // Only process if user actually selected a file and it has results
      if (result.imported.length === 0 && result.errors.length === 0) {
        // User cancelled - do nothing
        return;
      }

      // Handle result
      handleImportResult(result);
    },
    (progress: number) => {
      // Only create modal when progress actually starts
      if (!progressModal) {
        progressModal = createImportProgressModal();
        document.body.appendChild(progressModal);
      }

      // Update progress bar
      const progressBar = progressModal.querySelector('.import-progress-bar') as HTMLElement;
      const progressText = progressModal.querySelector('.import-progress-text') as HTMLElement;

      if (progressBar) progressBar.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    }
  );
}

function createImportProgressModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'import-progress-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7); display: flex;
    align-items: center; justify-content: center; z-index: 10000;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white; padding: 2rem; border-radius: 12px;
    min-width: 300px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;

  const title = document.createElement('h3');
  title.textContent = 'Importing Applications...';
  title.style.cssText = 'margin: 0 0 1rem 0; color: #1e293b;';

  const progressContainer = document.createElement('div');
  progressContainer.style.cssText = `
    background: #e2e8f0; border-radius: 8px; height: 24px;
    overflow: hidden; position: relative;
  `;

  const progressBar = document.createElement('div');
  progressBar.className = 'import-progress-bar';
  progressBar.style.cssText = `
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    height: 100%; width: 0%; transition: width 0.3s ease;
  `;

  const progressText = document.createElement('div');
  progressText.className = 'import-progress-text';
  progressText.textContent = '0%';
  progressText.style.cssText = `
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    color: #1e293b; font-weight: 600; font-size: 0.875rem;
  `;

  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressText);
  content.appendChild(title);
  content.appendChild(progressContainer);
  modal.appendChild(content);

  return modal;
}

function handleImportResult(result: ImportResult): void {
  const formatted = formatImportResult(result);

  if (result.imported.length > 0) {
    saveImportedApplications(result.imported)
      .then(() => {
        // Success handling moved to saveImportedApplications mostly,
        // but we can add a generic success message here if needed.
        // Wait, saveImportedApplications returns void now. 
        // We relying on it to show "Skipped X duplicates".
        // Use a generic "Import complete" message?
        showSuccessMessage('Import processing complete.');

        eventTrackingService.track('application_added', {
          importedCount: result.imported.length,
          errorCount: result.errors.length,
          skippedCount: result.skipped,
        });

        if (result.errors.length > 0) {
          showImportErrorReport(result.errors);
        }

        CacheManager.invalidate();
      })
      .catch(error => {
        showErrorMessage(`Failed to save imported applications: ${error.message}`);
      });
  } else {
    showErrorMessage(formatted.message);
    if (result.errors.length > 0) {
      showImportErrorReport(result.errors);
    }
  }
}

async function saveImportedApplications(applications: JobApplication[]): Promise<void> {
  if (!isFirebaseReady() || !appController) {
    throw new Error('Firebase not configured');
  }

  const user = authService.getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const result = await appController.importApplications(applications);

    if (result.skipped > 0) {
      showInfoMessage(
        `Skipped ${result.skipped} duplicate application${result.skipped !== 1 ? 's' : ''} (same company, role, and date already exist)`
      );
    }

    if (result.added === 0 && result.skipped > 0) {
      // All skipped
      return;
    }

    // Success handling is done by caller usually, but here we just return promise.
    // eventTrackingService lines in caller (handleImportResult) might need updating via result return?
    // handleImportResult calls this. 
    // We need to return valid promise.
  } catch (error) {
    throw error;
  }
}


function showImportErrorReport(errors: ImportError[]): void {
  const errorReport = generateErrorReport(errors);

  const modal = document.createElement('div');
  modal.className = 'import-error-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7); display: flex;
    align-items: center; justify-content: center; z-index: 10000;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: white; padding: 2rem; border-radius: 12px;
    max-width: 600px; max-height: 80vh; overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;

  const title = document.createElement('h3');
  title.textContent = '⚠️ Import Errors';
  title.style.cssText = 'margin: 0 0 1rem 0; color: #dc2626;';

  const description = document.createElement('p');
  description.textContent = `${errors.length} row${errors.length !== 1 ? 's' : ''} could not be imported:`;
  description.style.cssText = 'margin: 0 0 1rem 0; color: #64748b;';

  const errorList = document.createElement('pre');
  errorList.textContent = errorReport;
  errorList.style.cssText = `
    background: #f8fafc; padding: 1rem; border-radius: 8px;
    overflow-x: auto; font-size: 0.875rem; color: #1e293b;
    white-space: pre-wrap; margin: 0 0 1rem 0;
  `;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = `
    background: #3b82f6; color: white; border: none;
    padding: 0.5rem 1.5rem; border-radius: 6px;
    cursor: pointer; font-size: 1rem;
  `;
  closeBtn.addEventListener('click', () => modal.remove());

  content.appendChild(title);
  content.appendChild(description);
  content.appendChild(errorList);
  content.appendChild(closeBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
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

  insights.forEach(insight => {
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

  statCards.forEach(card => statsGrid.appendChild(card));
}

function attachPaginationListeners(
  pagination: ReturnType<typeof PaginationManager.calculatePagination>
): void {
  const pageButtons = document.querySelectorAll('.page-btn[data-page]');
  const prevButton = document.querySelector('.page-btn[data-action="prev"]');
  const nextButton = document.querySelector('.page-btn[data-action="next"]');

  pageButtons.forEach(btn => {
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
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
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
      animationService.transitionView(applicationsSectionElement || null, analyticsSection, {
        duration: 300,
        direction: 'horizontal',
      });
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
      animationService.transitionView(analyticsSection, applicationsSectionElement || null, {
        duration: 300,
        direction: 'horizontal',
      });
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
  searchInput.addEventListener('input', e => {
    const target = e.target as HTMLInputElement;
    updateFilter('search', target.value);
    if (target.value.length > 0) {
      eventTrackingService.track('search_performed', { query: target.value });
    }
    processAndDisplayApplications();
  });
}

if (statusFilter) {
  statusFilter.addEventListener('change', e => {
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

  // Clear tag filters
  clearTagFilters();

  processAndDisplayApplications();
}

// ========================================
// TAG FILTERING FUNCTIONS
// ========================================

/**
 * Initialize tag filtering UI
 */
function initializeTagFiltering(): void {
  const tagFilterSelect = document.getElementById('tag-filter-select') as HTMLSelectElement;

  if (!tagFilterSelect) return;

  // Populate tag filter dropdown
  populateTagFilterDropdown();

  // Handle tag selection
  tagFilterSelect.addEventListener('change', e => {
    const selectedTagId = (e.target as HTMLSelectElement).value;
    if (selectedTagId) {
      addTagFilter(selectedTagId);
      tagFilterSelect.value = ''; // Reset dropdown
    }
  });
}

/**
 * Populate tag filter dropdown with available tags
 */
function populateTagFilterDropdown(): void {
  const tagFilterSelect = document.getElementById('tag-filter-select') as HTMLSelectElement;

  if (!tagFilterSelect) return;

  // Clear existing options except the first
  while (tagFilterSelect.children.length > 1) {
    tagFilterSelect.removeChild(tagFilterSelect.lastChild!);
  }

  // Get all available tags from tagging service
  const allTags = TaggingService.getAllTags();

  // Add all tags to dropdown
  Object.values(allTags).forEach(categoryTags => {
    categoryTags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag.id;
      option.textContent = `${tag.name} (${tag.category})`;
      tagFilterSelect.appendChild(option);
    });
  });
}

/**
 * Add a tag to the active filters
 */
function addTagFilter(tagId: string): void {
  const currentFilters = filters.get();
  const tagIds = (currentFilters.tags || []) as string[];

  if (!tagIds.includes(tagId)) {
    updateFilter('tags', [...tagIds, tagId]);
    renderActiveTagFilters();
  }
}

/**
 * Remove a tag from the active filters
 */
function removeTagFilter(tagId: string): void {
  const currentFilters = filters.get();
  const tagIds = (currentFilters.tags || []) as string[];

  updateFilter(
    'tags',
    tagIds.filter(id => id !== tagId)
  );
  renderActiveTagFilters();
}

/**
 * Render active tag filters
 */
function renderActiveTagFilters(): void {
  const container = document.getElementById('selected-tag-filters');
  if (!container) return;

  container.innerHTML = '';

  const currentFilters = filters.get();
  const activeTagIds = (currentFilters.tags || []) as string[];

  activeTagIds.forEach(tagId => {
    const tag = TaggingService.getTagById(tagId);
    if (!tag) return;

    const tagElement = document.createElement('span');
    tagElement.className = 'filter-tag';
    tagElement.style.backgroundColor = tag.color || '#6b7280';

    // Safely add tag name as text content to avoid HTML interpretation
    tagElement.textContent = tag.name;

    // Create remove button element explicitly instead of using innerHTML
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tag-filter-remove';
    removeBtn.setAttribute('data-tag-id', tag.id);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => removeTagFilter(tag.id));

    tagElement.appendChild(removeBtn);

    container.appendChild(tagElement);
  });
}

/**
 * Clear all tag filters
 */
function clearTagFilters(): void {
  updateFilter('tags', []);
  renderActiveTagFilters();
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
// AUTHENTICATION UI
// ========================================

let currentAuthView: 'login' | 'signup' = 'login';
let authContainer: HTMLElement | null = null;

/**
 * Render authentication UI
 */
function renderAuthUI(): void {
  const header = document.querySelector('header');
  if (!header) return;

  // Create auth container
  authContainer = document.createElement('div');
  authContainer.id = 'auth-container';
  authContainer.className = 'auth-container';

  // Add to header
  header.appendChild(authContainer);

  // Initial render
  updateAuthUI();
}

/**
 * Update auth UI based on current state
 */
function updateAuthUI(): void {
  if (!authContainer) return;

  const user = authService.getCurrentUser();

  if (user) {
    // User is authenticated - show profile
    authContainer.innerHTML = '';
    authContainer.classList.remove('is-modal'); // Switch to inline mode
    const profile = createUserProfile(user, {
      onSignOut: () => {
        handleSignOut();
      },
    });
    authContainer.appendChild(profile);
    animationService.animateCardEntrance([profile]);
  } else {
    // User is not authenticated - show login/signup
    authContainer.innerHTML = '';
    authContainer.classList.add('is-modal'); // Switch to modal mode
    const form =
      currentAuthView === 'login'
        ? createLoginForm({
          onSuccess: () => {
            // Auth state change will update UI automatically
          },
          onSwitchToSignUp: () => {
            currentAuthView = 'signup';
            updateAuthUI();
          },

          onContinueAsGuest: () => {
            console.log('👤 Continuing as Guest');
            // Generate demo data if empty
            const currentApps = applications.get();
            if (currentApps.length === 0) {
              const demoApps = generateDemoData(100);
              setApplications(demoApps);
              CacheManager.save(demoApps);
              console.log('🎉 Demo data generated');
              showSuccessMessage('Demo data loaded! You are in Guest Mode.');
            } else {
              showInfoMessage('Welcome back! You are in Guest Mode.');
            }

            // Hide Auth UI and switch to Guest Header
            if (authContainer) {
              authContainer.innerHTML = '';
              authContainer.classList.remove('is-modal'); // Remove modal overlay

              // Render Guest Header with Exit button
              const guestHeader = document.createElement('div');
              guestHeader.style.display = 'flex';
              guestHeader.style.gap = '1rem';
              guestHeader.style.alignItems = 'center';

              guestHeader.innerHTML = `
              <div style="display: flex; align-items: center; gap: 0.5rem; background: #f1f5f9; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #e2e8f0;">
                <span style="font-size: 1.2rem;">👤</span>
                <span style="font-size: 0.875rem; font-weight: 600; color: #475569;">Guest Mode</span>
              </div>
              <button id="exit-guest-btn" style="background: none; border: none; color: #dc2626; font-weight: 600; font-size: 0.875rem; cursor: pointer; padding: 0.5rem; transition: opacity 0.2s;">
                Exit
              </button>
            `;

              authContainer.appendChild(guestHeader);

              // Add Exit Listener
              document.getElementById('exit-guest-btn')?.addEventListener('click', () => {
                window.location.reload();
              });
            }

            // Enable app (read-only mostly, but allow interaction)
            updateFormAuthState(null); // Guest is null user

            // In guest mode, we want to allow form interaction but maybe warn on save?
            // For now, let's just enable the UI so they can see data.
            // Override form disabled state for guest viewing
            const form = document.getElementById('application-form') as HTMLFormElement;
            const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
            if (form && submitBtn) {
              form.classList.remove('form-disabled');
              form.style.opacity = '1';
              form.style.pointerEvents = 'auto';
              submitBtn.textContent = 'Sign In to Save';
            }

            processAndDisplayApplications();
          },
        })
        : createSignUpForm({
          onSuccess: () => {
            // Auth state change will update UI automatically
          },
          onSwitchToLogin: () => {
            currentAuthView = 'login';
            updateAuthUI();
          },
        });

    authContainer.appendChild(form);
    animationService.animateCardEntrance([form]);
  }
}

/**
 * Update form state based on authentication status
 */
export function updateFormAuthState(user: any): void {
  const form = document.getElementById('application-form') as HTMLFormElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

  if (!form || !submitBtn) return;

  if (user) {
    // User is authenticated - enable form
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Application';
    submitBtn.style.opacity = '1';
    form.style.opacity = '1';
    form.style.pointerEvents = 'auto';

    // Remove any auth-related styling
    form.classList.remove('form-disabled');
  } else {
    // User is not authenticated - disable form submission
    submitBtn.disabled = false; // Allow clicking to show error
    submitBtn.textContent = 'Sign In Required';
    submitBtn.style.opacity = '0.7';
    form.style.opacity = '0.8';
    form.style.pointerEvents = 'auto'; // Allow interaction but show error on submit

    // Add visual indication
    form.classList.add('form-disabled');
  }
}

/**
 * Handle sign out
 */
function handleSignOut(): void {
  // Clear applications from store
  setApplications([]);
  setFilteredApplications([]);

  // Clear UI
  if (applicationsContainer) {
    applicationsContainer.innerHTML = '';
  }

  // Reload will happen via auth state change
}

/**
 * Initialize authentication
 */
function initializeAuth(): void {
  // Listen for auth state changes
  authService.onAuthStateChanged(user => {
    if (user) {
      console.log('✅ User authenticated:', user.email);
      // User is signed in - load their applications
      loadApplications();
    } else {
      console.log('👤 User not authenticated');
      // User is signed out - clear applications but show empty state
      setApplications([]);
      setFilteredApplications([]);
      if (applicationsContainer) {
        applicationsContainer.innerHTML =
          '<p class="empty-state">Sign in to view and manage your applications.</p>';
      }
      updateCounter(0, 0);
    }

    // Update auth UI
    updateAuthUI();

    // Update form state based on authentication
    updateFormAuthState(user);
  });
}

// ========================================
// INITIALIZE APP
// ========================================

window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 App initialized (Enhanced v4.0.0 with Authentication)');

  // Initialize Firebase and only load applications if successful
  const firebaseInitialized = initializeFirebase();

  if (firebaseInitialized) {
    // Render auth UI
    renderAuthUI();

    // Initialize auth state listener
    initializeAuth();

    // Note: loadApplications() will be called automatically when user signs in
  }

  // Subscribe to store changes
  filters.subscribe(() => {
    processAndDisplayApplications();
  });

  sortBy.subscribe(() => {
    processAndDisplayApplications();
  });

  // Initialize view mode buttons
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.view as ViewMode;
      if (mode) {
        switchViewMode(mode);
      }
    });
  });

  // Dashboard Animations
  const statsCards = document.querySelectorAll('.stats-card');
  if (statsCards.length > 0) {
    animationService.animateCardEntrance(statsCards as NodeListOf<HTMLElement>, { delay: 50 });
  }

  // Initialize filter event listeners (replacing inline handlers)
  const dateRangeFilter = document.getElementById('date-range-filter') as HTMLSelectElement;
  const visaFilter = document.getElementById('visa-filter') as HTMLSelectElement;
  const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
  const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;

  // Initialize filter event listeners
  if (dateRangeFilter) {
    dateRangeFilter.value = filters.get().dateRange || 'all';
    dateRangeFilter.addEventListener('change', (e: Event) => {
      handleDateRangeChange((e.target as HTMLSelectElement).value);
    });
  }

  if (visaFilter) {
    visaFilter.value = String(filters.get().visaSponsorship) || 'all';
    visaFilter.addEventListener('change', (e: Event) => {
      handleVisaFilterChange((e.target as HTMLSelectElement).value);
    });
  }

  if (sortSelect) {
    sortSelect.value = sortBy.get().value;
    sortSelect.addEventListener('change', (e: Event) => {
      handleSortChange((e.target as HTMLSelectElement).value);
    });
  }

  // Initialize tag filtering
  initializeTagFiltering();

  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelEdit);
  }

  // Event delegation for table actions (handles dynamically created buttons)
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;

    // Handle table row actions
    if (
      target.classList.contains('btn-edit-small') ||
      target.classList.contains('btn-delete-small')
    ) {
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
(
  window as Window &
  typeof globalThis & {
    editApplication: typeof editApplication;
    deleteApplication: typeof deleteApplication;
    cancelEdit: typeof cancelEdit;
    clearAllFilters: typeof clearAllFilters;
    handleDateRangeChange: typeof handleDateRangeChange;
    handleVisaFilterChange: typeof handleVisaFilterChange;
    handleSortChange: typeof handleSortChange;
  }
).editApplication = editApplication;
(window as any).deleteApplication = deleteApplication;
(window as any).cancelEdit = cancelEdit;
(window as any).clearAllFilters = clearAllFilters;
(window as any).handleDateRangeChange = handleDateRangeChange;
(window as any).handleVisaFilterChange = handleVisaFilterChange;
(window as any).handleSortChange = handleSortChange;
(window as any).switchViewMode = switchViewMode;
