// ========================================
// JOB APPLICATION TRACKER - ENHANCED
// Phase 1: Advanced Validation, Filtering, Sorting, Caching
// ========================================

console.log("Job Tracker initialized (Enhanced v1.1)");
console.log("Firebase connected:", firebase.apps.length > 0);

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const CACHE_KEY = 'job_tracker_cache';
const CACHE_TIMESTAMP_KEY = 'job_tracker_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SORT_PREFERENCE_KEY = 'job_tracker_sort_preference';

// ========================================
// STATE MANAGEMENT
// ========================================

const AppState = {
    applications: [],
    filteredApplications: [],
    currentEditId: null,
    sortBy: localStorage.getItem(SORT_PREFERENCE_KEY) || 'date-desc',
    filters: {
        search: '',
        status: 'all',
        dateRange: 'all',
        visaSponsorship: 'all'
    },
    cache: {
        data: null,
        timestamp: null,
        isValid: false
    }
};

// ========================================
// FORM ELEMENTS
// ========================================

const form = document.getElementById('application-form');
const submitBtn = document.getElementById('submit-btn');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const counterText = document.getElementById('counter-text');

// ========================================
// VALIDATION UTILITIES
// ========================================

const Validators = {
    isValidDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if date is valid and not in the future
        return date instanceof Date && !isNaN(date) && date <= today;
    },
    
    isValidCompanyName(name) {
        // Must be 2-100 characters, no special chars except spaces, hyphens, ampersands
        const regex = /^[a-zA-Z0-9\s\-&]{2,100}$/;
        return regex.test(name.trim());
    },
    
    isValidRole(role) {
        // Must be 2-100 characters
        const regex = /^[a-zA-Z0-9\s\-\/]{2,100}$/;
        return regex.test(role.trim());
    },
    
    sanitizeInput(input) {
        // Remove potential XSS attacks
        const temp = document.createElement('div');
        temp.textContent = input;
        return temp.innerHTML;
    }
};

// ========================================
// CACHE MANAGEMENT
// ========================================

const CacheManager = {
    save(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
            AppState.cache = {
                data: data,
                timestamp: Date.now(),
                isValid: true
            };
            console.log('📦 Cache saved:', data.length, 'applications');
        } catch (error) {
            console.error('Cache save failed:', error);
        }
    },
    
    load() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const timestamp = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || '0');
            const age = Date.now() - timestamp;
            
            if (cached && age < CACHE_DURATION) {
                AppState.cache = {
                    data: JSON.parse(cached),
                    timestamp: timestamp,
                    isValid: true
                };
                console.log('✅ Cache loaded:', AppState.cache.data.length, 'applications (age:', Math.round(age/1000), 's)');
                return AppState.cache.data;
            } else {
                console.log('⚠️ Cache expired or empty');
                return null;
            }
        } catch (error) {
            console.error('Cache load failed:', error);
            return null;
        }
    },
    
    invalidate() {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        AppState.cache.isValid = false;
        console.log('🗑️ Cache invalidated');
    }
};

// ========================================
// FORM SUBMISSION WITH VALIDATION
// ========================================

form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // Get form values
    const company = document.getElementById('company').value.trim();
    const role = document.getElementById('role').value.trim();
    const dateApplied = document.getElementById('date').value;
    const status = document.getElementById('status').value;
    const visaSponsorship = document.getElementById('visa').checked;
    
    // Clear previous error messages
    clearValidationErrors();
    
    // Validate inputs
    const errors = [];
    
    if (!Validators.isValidCompanyName(company)) {
        errors.push({ field: 'company', message: 'Company name must be 2-100 characters (letters, numbers, spaces, hyphens)' });
    }
    
    if (!Validators.isValidRole(role)) {
        errors.push({ field: 'role', message: 'Role must be 2-100 characters' });
    }
    
    if (!Validators.isValidDate(dateApplied)) {
        errors.push({ field: 'date', message: 'Date cannot be in the future' });
    }
    
    if (!status) {
        errors.push({ field: 'status', message: 'Please select a status' });
    }
    
    // Display validation errors
    if (errors.length > 0) {
        displayValidationErrors(errors);
        return;
    }
    
    // Sanitize inputs
    const sanitizedCompany = Validators.sanitizeInput(company);
    const sanitizedRole = Validators.sanitizeInput(role);
    
    // Check if we're in edit mode or add mode
    if (AppState.currentEditId) {
        updateApplication(AppState.currentEditId, sanitizedCompany, sanitizedRole, dateApplied, status, visaSponsorship);
    } else {
        addApplication(sanitizedCompany, sanitizedRole, dateApplied, status, visaSponsorship);
    }
});

function clearValidationErrors() {
    const existingErrors = document.querySelectorAll('.validation-error');
    existingErrors.forEach(error => error.remove());
}

function displayValidationErrors(errors) {
    errors.forEach(error => {
        const field = document.getElementById(error.field);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.textContent = error.message;
        field.parentElement.appendChild(errorDiv);
    });
    
    // Scroll to first error
    const firstError = document.querySelector('.validation-error');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ========================================
// FIREBASE OPERATIONS
// ========================================

function addApplication(company, role, dateApplied, status, visaSponsorship) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    const newApplicationRef = database.ref('applications').push();
    
    const applicationData = {
        company: company,
        role: role,
        dateApplied: dateApplied,
        status: status,
        visaSponsorship: visaSponsorship,
        timestamp: Date.now(),
        id: newApplicationRef.key
    };
    
    newApplicationRef.set(applicationData)
        .then(() => {
            console.log('✅ Application saved successfully');
            showSuccessMessage('Application added successfully!');
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Application';
            
            // Invalidate cache
            CacheManager.invalidate();
        })
        .catch((error) => {
            console.error('❌ Error saving application:', error);
            showErrorMessage('Failed to save application. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Application';
        });
}

function updateApplication(id, company, role, dateApplied, status, visaSponsorship) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    const updatedData = {
        company: company,
        role: role,
        dateApplied: dateApplied,
        status: status,
        visaSponsorship: visaSponsorship,
        updatedAt: Date.now()
    };
    
    database.ref('applications/' + id).update(updatedData)
        .then(() => {
            console.log('✅ Application updated successfully');
            showSuccessMessage(`Application for ${company} updated successfully!`);
            cancelEdit();
            submitBtn.disabled = false;
            
            // Invalidate cache
            CacheManager.invalidate();
        })
        .catch((error) => {
            console.error('❌ Error updating application:', error);
            showErrorMessage('Failed to update application. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Application';
        });
}

function deleteApplication(id) {
    console.log('Deleting application:', id);
    
    database.ref('applications/' + id).once('value')
        .then((snapshot) => {
            const app = snapshot.val();
            
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
                database.ref('applications/' + id).remove()
                    .then(() => {
                        console.log('✅ Application deleted successfully');
                        showSuccessMessage(`Application for ${app.company} deleted`);
                        
                        // Invalidate cache
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

function editApplication(id) {
    console.log('Editing application:', id);
    
    database.ref('applications/' + id).once('value')
        .then((snapshot) => {
            const app = snapshot.val();
            
            if (!app) {
                showErrorMessage('Application not found!');
                return;
            }
            
            // Populate form fields
            document.getElementById('company').value = app.company || '';
            document.getElementById('role').value = app.role || '';
            document.getElementById('date').value = app.dateApplied || '';
            document.getElementById('status').value = app.status || '';
            document.getElementById('visa').checked = app.visaSponsorship || false;
            
            // Switch to edit mode
            AppState.currentEditId = id;
            submitBtn.textContent = 'Update Application';
            submitBtn.style.background = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
            
            // Scroll to form
            document.getElementById('form-section').scrollIntoView({ 
                behavior: 'smooth' 
            });
            
            // Show edit mode indicator
            showEditModeIndicator(app.company);
        })
        .catch((error) => {
            console.error('Error loading application:', error);
            showErrorMessage('Error loading application data');
        });
}

function showEditModeIndicator(companyName) {
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
    formSection.insertBefore(indicator, form);
}

function cancelEdit() {
    AppState.currentEditId = null;
    form.reset();
    submitBtn.textContent = 'Add Application';
    submitBtn.style.background = 'linear-gradient(135deg, var(--slate-900) 0%, var(--slate-950) 100%)';
    
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

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    const formSection = document.getElementById('form-section');
    if (formSection && form) {
        formSection.insertBefore(messageDiv, form);
    } else {
        console.warn('Could not display success message: form section not found');
    }
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    
    const formSection = document.getElementById('form-section');
    if (formSection && form) {
        formSection.insertBefore(messageDiv, form);
    } else {
        console.warn('Could not display error message: form section not found');
    }
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// ========================================
// SORTING FUNCTIONALITY
// ========================================

const SortManager = {
    sort(applications, sortBy) {
        const sorted = [...applications];
        
        switch(sortBy) {
            case 'date-desc':
                return sorted.sort((a, b) => b.timestamp - a.timestamp);
            case 'date-asc':
                return sorted.sort((a, b) => a.timestamp - b.timestamp);
            case 'company-asc':
                return sorted.sort((a, b) => (a.company || '').localeCompare(b.company || ''));
            case 'company-desc':
                return sorted.sort((a, b) => (b.company || '').localeCompare(a.company || ''));
            case 'status':
                const statusOrder = ['Applied', 'Phone Screen', 'Technical Interview', 'Final Round', 'Offer', 'Rejected'];
                return sorted.sort((a, b) => {
                    const aIndex = statusOrder.indexOf(a.status);
                    const bIndex = statusOrder.indexOf(b.status);
                    return aIndex - bIndex;
                });
            default:
                return sorted;
        }
    },
    
    setSortPreference(sortBy) {
        AppState.sortBy = sortBy;
        localStorage.setItem(SORT_PREFERENCE_KEY, sortBy);
        console.log('📊 Sort preference saved:', sortBy);
    }
};

// ========================================
// ADVANCED FILTERING
// ========================================

const FilterManager = {
    applyFilters(applications) {
        let filtered = [...applications];
        
        // Search filter
        if (AppState.filters.search) {
            const searchTerm = AppState.filters.search.toLowerCase();
            filtered = filtered.filter(app => 
                (app.company || '').toLowerCase().includes(searchTerm) ||
                (app.role || '').toLowerCase().includes(searchTerm)
            );
        }
        
        // Status filter
        if (AppState.filters.status !== 'all') {
            filtered = filtered.filter(app => app.status === AppState.filters.status);
        }
        
        // Visa sponsorship filter
        if (AppState.filters.visaSponsorship !== 'all') {
            const requiresVisa = AppState.filters.visaSponsorship === 'true';
            filtered = filtered.filter(app => app.visaSponsorship === requiresVisa);
        }
        
        // Date range filter
        if (AppState.filters.dateRange !== 'all') {
            const now = Date.now();
            const ranges = {
                'week': 7 * 24 * 60 * 60 * 1000,
                'month': 30 * 24 * 60 * 60 * 1000,
                'quarter': 90 * 24 * 60 * 60 * 1000
            };
            
            const rangeMs = ranges[AppState.filters.dateRange];
            if (rangeMs) {
                filtered = filtered.filter(app => {
                    const appDate = new Date(app.dateApplied).getTime();
                    return (now - appDate) <= rangeMs;
                });
            }
        }
        
        return filtered;
    }
};

// ========================================
// LOAD APPLICATIONS WITH CACHING
// ========================================

function loadApplications() {
    const applicationsContainer = document.getElementById('applications-container');
    
    // Try to load from cache first
    const cached = CacheManager.load();
    if (cached && cached.length > 0) {
        console.log('📦 Loading from cache...');
        AppState.applications = cached;
        processAndDisplayApplications();
    }
    
    // Show loading state
    showLoadingState();
    
    // Listen for data changes in Firebase
    database.ref('applications').on('value', (snapshot) => {
        const applications = snapshot.val();
        
        if (!applications) {
            applicationsContainer.innerHTML = '<p id="no-apps-message">No applications yet. Add your first one above!</p>';
            updateCounter(0, 0);
            AppState.applications = [];
            AppState.filteredApplications = [];
            return;
        }
        
        // Convert to array
        const applicationsArray = Object.keys(applications).map(key => ({
            id: key,
            ...applications[key]
        }));
        
        AppState.applications = applicationsArray;
        
        // Save to cache
        CacheManager.save(applicationsArray);
        
        // Process and display
        processAndDisplayApplications();
        
        console.log(`📊 Loaded ${applicationsArray.length} applications from Firebase`);
    });
}

function processAndDisplayApplications() {
    // Apply filters
    AppState.filteredApplications = FilterManager.applyFilters(AppState.applications);
    
    // Apply sorting
    const sorted = SortManager.sort(AppState.filteredApplications, AppState.sortBy);
    
    // Display
    displayApplications(sorted);
    
    // Update counter
    updateCounter(sorted.length, AppState.applications.length);
}

// ========================================
// DISPLAY APPLICATIONS
// ========================================

function displayApplications(apps) {
    const applicationsContainer = document.getElementById('applications-container');
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
    
    apps.forEach(app => {
        const appCard = createApplicationCard(app);
        applicationsContainer.appendChild(appCard);
    });
}

function createApplicationCard(app) {
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
                day: 'numeric'
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
        AppState.filters.search = e.target.value;
        processAndDisplayApplications();
    });
}

if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
        AppState.filters.status = e.target.value;
        processAndDisplayApplications();
    });
}

function clearAllFilters() {
    AppState.filters = {
        search: '',
        status: 'all',
        dateRange: 'all',
        visaSponsorship: 'all'
    };
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    
    // Clear any additional filter UI elements
    const dateRangeFilter = document.getElementById('date-range-filter');
    const visaFilter = document.getElementById('visa-filter');
    if (dateRangeFilter) dateRangeFilter.value = 'all';
    if (visaFilter) visaFilter.value = 'all';
    
    processAndDisplayApplications();
}

// ========================================
// COUNTER & LOADING
// ========================================

function updateCounter(filtered, total) {
    if (!counterText) return;
    
    const cacheStatus = AppState.cache.isValid ? ' (cached)' : '';
    
    if (filtered === total) {
        counterText.textContent = `Showing ${total} ${total === 1 ? 'application' : 'applications'}${cacheStatus}`;
    } else {
        counterText.textContent = `Showing ${filtered} of ${total} ${total === 1 ? 'application' : 'applications'}${cacheStatus}`;
    }
}

function showLoadingState() {
    const applicationsContainer = document.getElementById('applications-container');
    
    // Only show loading if no cache
    if (!AppState.cache.isValid) {
        applicationsContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading applications...</p>
            </div>
        `;
    }
}

// ========================================
// INITIALIZE APP
// ========================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initialized (Enhanced)');
    console.log('📊 Sort preference:', AppState.sortBy);
    loadApplications();
});

// Make functions globally accessible
window.editApplication = editApplication;
window.deleteApplication = deleteApplication;
window.cancelEdit = cancelEdit;
window.clearAllFilters = clearAllFilters;