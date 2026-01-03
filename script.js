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
 * Load and display existing applications from Firebase
 */

function loadApplications() {
    const applicationsContainer = document.getElementById('applications-container');
    const noAppsMessage = document.getElementById('no-apps-message');
    
    // Listen for data changes in Firebase
    database.ref('applications').on('value', (snapshot) => {
        const applications = snapshot.val();
        
        // If no applications exist
        if (!applications) {
            applicationsContainer.innerHTML = '<p id="no-apps-message">No applications yet. Add your first one above!</p>';
            return;
        }
        
        // Convert applications object to array
        const applicationsArray = Object.keys(applications).map(key => {
            return {
                id: key,
                ...applications[key]
            };
        });
        
        // Sort by timestamp (newest first)
        applicationsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        // Clear container
        applicationsContainer.innerHTML = '';
        
        // Display each application
        applicationsArray.forEach(app => {
            const appCard = createApplicationCard(app);
            applicationsContainer.appendChild(appCard);
        });
        
        console.log(`📊 Loaded ${applicationsArray.length} applications`);
    });
}

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
// INITIALIZE APP
// ========================================

// Load applications when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initialized');
    loadApplications();
});