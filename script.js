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
    
    // Log to console (for debugging)
    console.log('Form data:', {
        company,
        role,
        dateApplied,
        status,
        visaSponsorship
    });
    
    // Call function to save to Firebase
    addApplication(company, role, dateApplied, status, visaSponsorship);
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

// This will be built on Day 3
// For now, we just log that the page loaded
console.log('Page loaded. Ready to add applications.');