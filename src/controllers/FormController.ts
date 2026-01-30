import { Validators } from '../utils/validators';
import { TaggingService } from '../services/taggingService';
import { animationService } from '../services/animationService';
import { authService } from '../services/authService';
import { securityLogger } from '../utils/securityLogger';
import {
    sanitizeUserInput,
    escapeHtml,
} from '../utils/security';
import { setCurrentEditId } from '../stores/applicationStore';
import {
    JobApplication,
    ApplicationStatus,
    Tag,
    TagSuggestion,
    ValidationError,
} from '../types';
import { ApplicationController } from './ApplicationController';

export interface FormElements {
    form: HTMLFormElement;
    submitBtn: HTMLButtonElement;
    companyInput: HTMLInputElement;
    roleInput: HTMLInputElement;
    dateInput: HTMLInputElement;
    statusSelect: HTMLSelectElement;
    visaCheckbox: HTMLInputElement;
    tagInput: HTMLInputElement;
    addTagBtn: HTMLButtonElement;
    selectedTagsContainer: HTMLElement;
    tagSuggestionsContainer: HTMLElement;
    tagSuggestionsList: HTMLElement;
    tagCategoriesList: HTMLElement;
    formSection: HTMLElement;
}

export class FormController {
    private elements: FormElements;
    private appController: ApplicationController;
    private selectedTags: Tag[] = [];
    private tagSuggestions: TagSuggestion[] = [];
    private originalApplicationData: JobApplication | null = null;

    constructor(elements: FormElements, appController: ApplicationController) {
        this.elements = elements;
        this.appController = appController;
    }

    public init(): void {
        this.setupEventListeners();
        this.renderTagCategories();
        this.updateTagSuggestions();
    }

    private setupEventListeners(): void {
        this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Tag management
        this.elements.tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                this.addCustomTagFromInput();
            }
        });

        this.elements.addTagBtn.addEventListener('click', () => {
            this.addCustomTagFromInput();
        });

        // Update suggestions when company or role changes
        this.elements.companyInput.addEventListener('input', () => this.updateTagSuggestions());
        this.elements.roleInput.addEventListener('input', () => this.updateTagSuggestions());

        // Focus animations
        const fields = [
            this.elements.companyInput,
            this.elements.roleInput,
            this.elements.dateInput,
            this.elements.statusSelect,
            this.elements.tagInput
        ];

        fields.forEach(field => {
            field.addEventListener('focus', () => {
                animationService.animateFormFieldFocus(field);
            });
            field.addEventListener('blur', () => {
                animationService.animateFormFieldBlur(field);
            });
        });
    }

    private handleFormSubmit(event: Event): void {
        event.preventDefault();

        const user = authService.getCurrentUser();
        if (!user) {
            this.showErrorMessage(
                'Please sign in to save your applications. You can view the form, but saving requires authentication.'
            );
            return;
        }

        const company = this.elements.companyInput.value.trim();
        const role = this.elements.roleInput.value.trim();
        const dateApplied = this.elements.dateInput.value;
        const status = this.elements.statusSelect.value;
        const visaSponsorship = this.elements.visaCheckbox.checked;
        const tags = this.getSelectedTags();

        this.clearValidationErrors();

        const errors = Validators.validateApplication(company, role, dateApplied, status);

        if (errors.length > 0) {
            securityLogger.log({
                type: 'validation_failed',
                message: 'Form validation failed',
                details: { errors: errors.map(e => e.field) },
            });
            this.displayValidationErrors(errors);
            return;
        }

        const sanitizedCompany = sanitizeUserInput(company, 100);
        const sanitizedRole = sanitizeUserInput(role, 100);

        const editId = (window as any).currentEditId?.get?.() || null; // Temporary bridge until main.ts refactored

        if (editId) {
            if (this.originalApplicationData) {
                const hasChanges =
                    this.originalApplicationData.company !== sanitizedCompany ||
                    this.originalApplicationData.role !== sanitizedRole ||
                    this.originalApplicationData.dateApplied !== dateApplied ||
                    this.originalApplicationData.status !== status ||
                    this.originalApplicationData.visaSponsorship !== visaSponsorship;

                if (!hasChanges) {
                    this.showInfoMessage('No changes detected. Nothing to update.');
                    return;
                }
            }
            this.updateApplication(
                editId,
                sanitizedCompany,
                sanitizedRole,
                dateApplied,
                status as ApplicationStatus,
                visaSponsorship
            );
        } else {
            this.addApplication(
                sanitizedCompany,
                sanitizedRole,
                dateApplied,
                status as ApplicationStatus,
                visaSponsorship,
                tags
            );
        }
    }

    private async addApplication(
        company: string,
        role: string,
        dateApplied: string,
        status: ApplicationStatus,
        visaSponsorship: boolean,
        tags?: Tag[]
    ): Promise<void> {
        this.setLoading(true, 'Saving...');
        animationService.animateButtonLoading(this.elements.submitBtn);

        try {
            await this.appController.addApplication(company, role, dateApplied, status, visaSponsorship, tags);
            this.showSuccessMessage('Application added successfully!');
            this.resetForm();
        } catch (error: any) {
            this.showErrorMessage(error.message || 'Failed to save application.');
        } finally {
            this.setLoading(false, 'Add Application');
            animationService.stopButtonLoading(this.elements.submitBtn);
        }
    }

    private async updateApplication(
        id: string,
        company: string,
        role: string,
        dateApplied: string,
        status: ApplicationStatus,
        visaSponsorship: boolean
    ): Promise<void> {
        this.setLoading(true, 'Updating...');

        const updatedData = {
            company,
            role,
            dateApplied,
            status,
            visaSponsorship,
        };

        try {
            await this.appController.updateApplication(id, updatedData, this.originalApplicationData?.status);
            this.showSuccessMessage(`Application for ${company} updated successfully!`);
            this.cancelEdit();
        } catch (error: any) {
            this.showErrorMessage(error.message || 'Failed to update application.');
        } finally {
            this.setLoading(false, 'Update Application');
            animationService.stopButtonLoading(this.elements.submitBtn);
        }
    }

    public setEditMode(app: JobApplication): void {
        this.originalApplicationData = { ...app };

        // Populate form
        this.elements.companyInput.value = app.company || '';
        this.elements.roleInput.value = app.role || '';
        this.elements.dateInput.value = app.dateApplied || '';
        this.elements.statusSelect.value = app.status || '';
        this.elements.visaCheckbox.checked = app.visaSponsorship || false;

        // Populate tags
        this.selectedTags = app.tags || [];
        this.renderSelectedTags();
        this.updateTagSuggestions();

        // UI Updates
        this.elements.submitBtn.textContent = 'Update Application';
        this.elements.submitBtn.style.background = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';

        const formTitle = this.elements.formSection.querySelector('h2');
        if (formTitle) formTitle.textContent = 'Edit Application';

        setCurrentEditId(app.id);

        this.elements.formSection.scrollIntoView({ behavior: 'smooth' });
        this.showEditModeIndicator(app.company);
    }

    public cancelEdit = (): void => {
        setCurrentEditId(null);
        this.originalApplicationData = null;
        this.resetForm();

        this.elements.submitBtn.textContent = 'Add Application';
        this.elements.submitBtn.style.background = 'linear-gradient(135deg, var(--slate-900) 0%, var(--slate-950) 100%)';

        const formTitle = this.elements.formSection.querySelector('h2');
        if (formTitle) formTitle.textContent = 'Add New Application';

        const indicator = document.getElementById('edit-mode-indicator');
        if (indicator) indicator.remove();

        this.clearValidationErrors();
    };

    private resetForm(): void {
        this.elements.form.reset();
        this.clearTags();
    }

    private setLoading(isLoading: boolean, text: string): void {
        this.elements.submitBtn.disabled = isLoading;
        this.elements.submitBtn.textContent = text;
    }

    // Message Utilities
    public showSuccessMessage(message: string): void {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        this.elements.form.insertAdjacentElement('beforebegin', messageDiv);
        animationService.animateMessage(messageDiv, 'success');
        setTimeout(() => messageDiv.remove(), 3000);
    }

    public showErrorMessage(message: string): void {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.textContent = message;
        this.elements.form.insertAdjacentElement('beforebegin', messageDiv);
        animationService.animateMessage(messageDiv, 'error');
        setTimeout(() => messageDiv.remove(), 5000);
    }

    public showInfoMessage(message: string): void {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'info-message';
        messageDiv.textContent = message;
        this.elements.form.insertAdjacentElement('beforebegin', messageDiv);
        animationService.animateMessage(messageDiv, 'info');
        setTimeout(() => messageDiv.remove(), 3000);
    }

    // Validation UI
    private clearValidationErrors(): void {
        const existingErrors = this.elements.formSection.querySelectorAll('.validation-error');
        existingErrors.forEach(error => error.remove());
    }

    private displayValidationErrors(errors: ValidationError[]): void {
        errors.forEach(error => {
            const field = document.getElementById(error.field);
            if (!field) return;

            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.textContent = error.message;
            field.parentElement?.appendChild(errorDiv);
        });

        const firstError = this.elements.formSection.querySelector('.validation-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Tag Management
    private addCustomTagFromInput(): void {
        const tagText = this.elements.tagInput.value.trim();
        if (tagText) {
            this.addCustomTag(tagText);
            this.elements.tagInput.value = '';
        }
    }

    private addCustomTag(tagText: string): void {
        const customTag: Tag = {
            id: `custom-${Date.now()}`,
            name: tagText,
            category: 'seniority',
        };
        this.addTagToSelection(customTag);
    }

    private addTagToSelection(tag: Tag): void {
        if (this.selectedTags.some(t => t.id === tag.id)) return;
        this.selectedTags.push(tag);
        this.renderSelectedTags();
        this.updateTagSuggestions();
    }

    private removeTagFromSelection(tagId: string): void {
        this.selectedTags = this.selectedTags.filter(t => t.id !== tagId);
        this.renderSelectedTags();
        this.updateTagSuggestions();
    }

    private renderSelectedTags(): void {
        this.elements.selectedTagsContainer.innerHTML = '';
        this.selectedTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag selected-tag';
            tagElement.style.backgroundColor = tag.color || '#6b7280';
            tagElement.textContent = tag.name;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'tag-remove';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => this.removeTagFromSelection(tag.id));

            tagElement.appendChild(removeBtn);
            this.elements.selectedTagsContainer.appendChild(tagElement);
        });
    }

    private updateTagSuggestions(): void {
        const company = this.elements.companyInput.value.trim();
        const role = this.elements.roleInput.value.trim();

        if (!company && !role) {
            this.tagSuggestions = [];
            this.renderTagSuggestions();
            return;
        }

        const tempApp: JobApplication = {
            id: '',
            company,
            role,
            dateApplied: '',
            status: 'Applied',
            visaSponsorship: false,
            timestamp: Date.now(),
        };

        this.tagSuggestions = TaggingService.generateTagSuggestions(tempApp).filter(
            suggestion => !this.selectedTags.some(selected => selected.id === suggestion.tag.id)
        );

        this.renderTagSuggestions();
    }

    private renderTagSuggestions(): void {
        if (this.tagSuggestions.length === 0) {
            this.elements.tagSuggestionsContainer.style.display = 'none';
            return;
        }

        this.elements.tagSuggestionsContainer.style.display = 'block';
        this.elements.tagSuggestionsList.innerHTML = '';

        this.tagSuggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tag-suggestion';
            btn.style.backgroundColor = suggestion.tag.color || '#6b7280';
            btn.textContent = suggestion.tag.name;

            const confidence = document.createElement('span');
            confidence.className = 'confidence';
            confidence.textContent = `(${Math.round(suggestion.confidence * 100)}%)`;

            btn.appendChild(confidence);
            btn.addEventListener('click', () => this.addTagToSelection(suggestion.tag));
            this.elements.tagSuggestionsList.appendChild(btn);
        });
    }

    private renderTagCategories(): void {
        this.elements.tagCategoriesList.innerHTML = '';
        const categories = TaggingService.getAllTags();

        Object.entries(categories).forEach(([categoryName, tags]) => {
            if (tags.length === 0) return;

            const div = document.createElement('div');
            div.className = 'tag-category';

            const title = document.createElement('span');
            title.className = 'category-title';
            title.textContent = categoryName.replace('-', ' ').toUpperCase() + ':';
            div.appendChild(title);

            tags.slice(0, 3).forEach(tag => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'quick-tag-btn';
                btn.style.backgroundColor = tag.color || '#6b7280';
                btn.textContent = tag.name;
                btn.addEventListener('click', () => this.addTagToSelection(tag));
                div.appendChild(btn);
            });

            this.elements.tagCategoriesList.appendChild(div);
        });
    }

    private clearTags(): void {
        this.selectedTags = [];
        this.tagSuggestions = [];
        this.renderSelectedTags();
        this.renderTagSuggestions();
    }

    private getSelectedTags(): Tag[] {
        return [...this.selectedTags];
    }

    private showEditModeIndicator(companyName: string): void {
        const existing = document.getElementById('edit-mode-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.id = 'edit-mode-indicator';
        indicator.className = 'edit-mode-indicator';

        const span = document.createElement('span');
        span.innerHTML = `✏️ Editing: <strong>${escapeHtml(companyName)}</strong>`;

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel-edit';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this.cancelEdit());

        indicator.appendChild(span);
        indicator.appendChild(cancelBtn);
        this.elements.formSection.insertBefore(indicator, this.elements.form);
    }
}
