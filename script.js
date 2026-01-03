// ========================================
// JOB APPLICATION TRACKER - MAIN SCRIPT
// ========================================

console.log("Job Tracker initialized");
console.log("Firebase connected:", firebase.apps.length > 0);

// ========================================
// FORM SUBMISSION
// ========================================

// Get the form element
const form = document.getElementById('application-form');
const submitBtn = document.getElementById('submit-btn');

// Listen for form submission
form.addEventListener('submit', function(event) {
    // Prevent page reload
    event.preventDefault();
    
    // Get form values
    const company = document.getElementById('company').value;
    const role = document.getElementById('role').value;
    const dateApplied = document.getElementById('date').value;
    const status = document.getElementById('status').value;
    const visaSponsorship = document.getElementById('visa').checked;
    
    // Validate that all required fields are filled
    if (!company || !role || !dateApplied || !status) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Check if we're in edit mode or add mode
    if (currentEditId) {
        // UPDATE MODE
        updateApplication(currentEditId, company, role, dateApplied, status, visaSponsorship);
    } else {
        // ADD MODE
        addApplication(company, role, dateApplied, status, visaSponsorship);
    }
});

// ========================================
// FIREBASE FUNCTIONS
// ========================================

/**
 * Add a new application to Firebase
 */
function addApplication(company, role, dateApplied, status, visaSponsorship) {
    // Disable submit button while saving
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    // Create a new unique ID for this application
    const newApplicationRef = database.ref('applications').push();
    
    // Data to save
    const applicationData = {
        company: company,
        role: role,
        dateApplied: dateApplied,
        status: status,
        visaSponsorship: visaSponsorship,
        timestamp: Date.now(),
        id: newApplicationRef.key
    };
    
    // Save to Firebase
    newApplicationRef.set(applicationData)
        .then(() => {
            console.log('✅ Application saved successfully');
            
            // Show success message
            showSuccessMessage('Application added successfully!');
            
            // Clear the form
            form.reset();
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Application';
        })
        .catch((error) => {
            console.error('❌ Error saving application:', error);
            alert('Error saving application. Check console for details.');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Add Application';
        });
}

/**
 * Update an existing application in Firebase
 */
function updateApplication(id, company, role, dateApplied, status, visaSponsorship) {
    // Disable submit button while updating
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    // Data to update
    const updatedData = {
        company: company,
        role: role,
        dateApplied: dateApplied,
        status: status,
        visaSponsorship: visaSponsorship,
        // Keep original timestamp, add updated timestamp
        updatedAt: Date.now()
    };
    
    // Update in Firebase
    database.ref('applications/' + id).update(updatedData)
        .then(() => {
            console.log('✅ Application updated successfully');
            
            // Show success message
            showSuccessMessage(`Application for ${company} updated successfully!`);
            
            // Reset form and exit edit mode
            cancelEdit();
            
            // Re-enable submit button
            submitBtn.disabled = false;
        })
        .catch((error) => {
            console.error('❌ Error updating application:', error);
            alert('Error updating application. Check console for details.');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Update Application';
        });
}

/**
 * Show a success message to the user
 */
function showSuccessMessage(message) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    // Add to page (before the form)
    const formSection = document.getElementById('add-application-section');
    formSection.insertBefore(messageDiv, form);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// ========================================
// LOAD APPLICATIONS ON PAGE LOAD
// ========================================

console.log('Page loaded. Ready to add applications.');


/**
 * Create an application card HTML element
 */
function createApplicationCard(app) {
    const card = document.createElement('div');
    card.className = 'application-card';
    card.dataset.id = app.id;
    
    // SAFE: Check if status exists before using toLowerCase
    const statusClass = app.status 
        ? app.status.toLowerCase().replace(/\s+/g, '-') 
        : 'unknown';
    
    card.classList.add(`status-${statusClass}`);
    
    // SAFE: Format the date with fallback
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
    
    // SAFE: Visa sponsorship badge with fallback
    const visaBadge = app.visaSponsorship 
        ? '<span class="visa-badge">✓ Visa Sponsorship</span>' 
        : '';
    
    // SAFE: Status badge with fallback
    const displayStatus = app.status || 'Unknown';
    const statusBadge = `<span class="status-badge status-${statusClass}">${displayStatus}</span>`;
    
    // SAFE: Company and role with fallbacks
    const company = app.company || 'Company not set';
    const role = app.role || 'Role not set';
    
    // Build the card HTML
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
// EDIT & DELETE FUNCTIONS
// ========================================

// Track which application we're currently editing
let currentEditId = null;

/**
 * Edit application - populate form with existing data
 */
function editApplication(id) {
    console.log('Editing application:', id);
    
    // Get the application data from Firebase
    database.ref('applications/' + id).once('value')
        .then((snapshot) => {
            const app = snapshot.val();
            
            if (!app) {
                alert('Application not found!');
                return;
            }
            
            // Populate form fields
            document.getElementById('company').value = app.company || '';
            document.getElementById('role').value = app.role || '';
            document.getElementById('date').value = app.dateApplied || '';
            document.getElementById('status').value = app.status || '';
            document.getElementById('visa').checked = app.visaSponsorship || false;
            
            // Switch to edit mode
            currentEditId = id;
            submitBtn.textContent = 'Update Application';
            submitBtn.style.background = 'linear-gradient(135deg, #f57c00 0%, #ff6f00 100%)';
            
            // Scroll to form
            document.getElementById('add-application-section').scrollIntoView({ 
                behavior: 'smooth' 
            });
            
            // Show edit mode indicator
            showEditModeIndicator(app.company);
        })
        .catch((error) => {
            console.error('Error loading application:', error);
            alert('Error loading application data');
        });
}

/**
 * Delete application with confirmation
 */
function deleteApplication(id) {
    console.log('Deleting application:', id);
    
    // Get application data to show company name in confirmation
    database.ref('applications/' + id).once('value')
        .then((snapshot) => {
            const app = snapshot.val();
            
            if (!app) {
                alert('Application not found!');
                return;
            }
            
            // Confirmation dialog
            const confirmed = confirm(
                `Are you sure you want to delete the application for ${app.company}?\n\n` +
                `Role: ${app.role}\n` +
                `This action cannot be undone.`
            );
            
            if (confirmed) {
                // Delete from Firebase
                database.ref('applications/' + id).remove()
                    .then(() => {
                        console.log('✅ Application deleted successfully');
                        showSuccessMessage(`Application for ${app.company} deleted`);
                    })
                    .catch((error) => {
                        console.error('❌ Error deleting application:', error);
                        alert('Error deleting application. Check console.');
                    });
            } else {
                console.log('Delete cancelled by user');
            }
        })
        .catch((error) => {
            console.error('Error loading application:', error);
            alert('Error loading application data');
        });
}

/**
 * Show edit mode indicator above form
 */
function showEditModeIndicator(companyName) {
    // Remove existing indicator if any
    const existingIndicator = document.getElementById('edit-mode-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'edit-mode-indicator';
    indicator.className = 'edit-mode-indicator';
    indicator.innerHTML = `
        <span>✏️ Editing: <strong>${companyName}</strong></span>
        <button onclick="cancelEdit()" class="btn-cancel-edit">Cancel</button>
    `;
    
    // Insert before form
    const formSection = document.getElementById('add-application-section');
    const form = document.getElementById('application-form');
    formSection.insertBefore(indicator, form);
}

/**
 * Cancel edit mode and return to add mode
 */
function cancelEdit() {
    currentEditId = null;
    form.reset();
    submitBtn.textContent = 'Add Application';
    submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    // Remove edit indicator
    const indicator = document.getElementById('edit-mode-indicator');
    if (indicator) {
        indicator.remove();
    }
    
    console.log('Edit cancelled - returned to add mode');
}

// ========================================
// SEARCH & FILTER FUNCTIONALITY
// ========================================

// Store all applications for filtering
let allApplications = [];

// Get filter elements
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const counterText = document.getElementById('counter-text');

/**
 *  loadApplications with filter support
 */
function loadApplications() {
    const applicationsContainer = document.getElementById('applications-container');
    
    //Show loading state
    showLoadingState();
    
    // Listen for data changes in Firebase
    database.ref('applications').on('value', (snapshot) => {
        const applications = snapshot.val();
        
        // If no applications exist
        if (!applications) {
            applicationsContainer.innerHTML = '<p id="no-apps-message">No applications yet. Add your first one above!</p>';
            updateCounter(0, 0);
            allApplications = [];
            return;
        }
        
        // Convert applications object to array
        allApplications = Object.keys(applications).map(key => {
            return {
                id: key,
                ...applications[key]
            };
        });
        
        // Sort by timestamp (newest first)
        allApplications.sort((a, b) => b.timestamp - a.timestamp);
        
        // Apply current filters
        applyFilters();
        
        console.log(`📊 Loaded ${allApplications.length} applications`);
    });
}

/**
 * Apply search and status filters
 */
function applyFilters() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    
    // Filter applications
    let filteredApps = allApplications;
    
    // Apply search filter
    if (searchTerm) {
        filteredApps = filteredApps.filter(app => 
            (app.company || '').toLowerCase().includes(searchTerm) ||
            (app.role || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply status filter
    if (statusValue !== 'all') {
        filteredApps = filteredApps.filter(app => app.status === statusValue);
    }
    
    // Display filtered applications
    displayFilteredApplications(filteredApps);
    
    // Update counter
    updateCounter(filteredApps.length, allApplications.length);
}

/**
 * Display filtered applications
 */
function displayFilteredApplications(apps) {
    const applicationsContainer = document.getElementById('applications-container');
    
    // Clear container
    applicationsContainer.innerHTML = '';
    
    // If no apps match filters
    if (apps.length === 0) {
        applicationsContainer.innerHTML = `
            <div class="no-results">
                <p>No applications match your filters</p>
                <button onclick="clearFilters()" class="btn-clear-filters">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    // Display each application
    apps.forEach(app => {
        const appCard = createApplicationCard(app);
        applicationsContainer.appendChild(appCard);
    });
}

/**
 * Update the counter text
 */
function updateCounter(filtered, total) {
    if (!counterText) return;
    
    if (filtered === total) {
        counterText.textContent = `Showing ${total} ${total === 1 ? 'application' : 'applications'}`;
    } else {
        counterText.textContent = `Showing ${filtered} of ${total} ${total === 1 ? 'application' : 'applications'}`;
    }
}
/**
 * Show loading state
 */
function showLoadingState() {
    const applicationsContainer = document.getElementById('applications-container');
    applicationsContainer.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading applications...</p>
        </div>
    `;
}

/**
 * Clear all filters
 */
function clearFilters() {
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    applyFilters();
}

// ========================================
// EVENT LISTENERS FOR FILTERS
// ========================================

// Search input - filter as user types
if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
}

// Status filter - filter when selection changes
if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
}
// ========================================
// INITIALIZE APP
// ========================================

// Load applications when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initialized');
    loadApplications();
});