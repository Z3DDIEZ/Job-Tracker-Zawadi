/**
 * App Orchestrator
 * Coordinates all controllers and global application state
 */

import { getFirebaseConfig } from '../config/firebase';
import { authService } from '../services/authService';
import { ApplicationController } from './ApplicationController';
import { FormController, type FormElements } from './FormController';
import { AuthManager } from './AuthManager';
import { FilterController } from './FilterController';
import { ListController } from './ListController';
import { DashboardController } from './DashboardController';
import { ImportExportController } from './ImportExportController';
import {
    setApplications,
    applications,
} from '../stores/applicationStore';
import { CacheManager } from '../utils/cache';
import { showErrorMessage, updateFormAuthState } from '../utils/domHelpers';

export class App {
    public appController!: ApplicationController;
    public formController!: FormController;
    public authManager!: AuthManager;
    public filterController!: FilterController;
    public listController!: ListController;
    public dashboardController!: DashboardController;
    public importExportController!: ImportExportController;

    constructor() { }

    /**
     * Bootstrap the application
     */
    public async init(): Promise<void> {
        console.log('🚀 App initializing...');

        if (this.initializeFirebase()) {
            this.setupControllers();
            this.setupEventListeners();
            console.log('✅ App initialized successfully');
        }
    }

    private initializeFirebase(): boolean {
        try {
            const config = getFirebaseConfig();
            if (Object.values(config).some(v => v === 'MISSING')) {
                this.renderConfigError();
                return false;
            }

            const app = firebase.initializeApp(config);
            const database = app.database();
            const auth = (firebase as any).auth();

            authService.initialize(auth);
            this.appController = new ApplicationController(database);
            return true;
        } catch (error) {
            console.error('Firebase init failed', error);
            this.renderConfigError();
            return false;
        }
    }

    private setupControllers(): void {
        // 1. Auth Manager
        this.authManager = new AuthManager({
            onUserChange: (user) => {
                if (user) {
                    this.loadData();
                } else {
                    updateFormAuthState(null);
                    this.handleSignedOutState();
                }
            },
            onGuestMode: () => {
                this.handleGuestMode();
            }
        });
        this.authManager.init();

        // 2. Form Controller
        this.formController = new FormController(this.getFormElements(), this.appController);
        this.formController.init();

        // 3. Dashboard Controller
        this.dashboardController = new DashboardController();

        // 4. List Controller
        this.listController = new ListController({
            onEdit: (id) => this.handleEdit(id),
            onDelete: (id) => this.handleDelete(id),
            onAnalyticsView: (apps) => this.dashboardController.render(apps)
        });
        this.listController.init();

        // 5. Filter Controller
        this.filterController = new FilterController({
            onFilterChange: () => this.listController.processAndDisplay()
        });
        this.filterController.init();

        // 6. Import/Export
        this.importExportController = new ImportExportController(this.appController);
    }

    private setupEventListeners(): void {
        // Global event for clearing filters (triggered from sub-components)
        document.addEventListener('app:clear-filters', () => {
            this.filterController.clearAllFilters();
        });

        // Handle view mode styling the CSV buttons (which are dynamic in main.ts)
        // We'll move the CSV button injection into the DashboardController or similar soon
    }

    private loadData(): void {
        const cached = CacheManager.load();
        if (cached && cached.length > 0) {
            setApplications(cached);
            this.listController.processAndDisplay();
        }

        this.listController.showLoading();

        this.appController.subscribeToApplications((apps) => {
            if (apps.length === 0) {
                this.handleEmptyState();
                return;
            }
            setApplications(apps);
            CacheManager.save(apps);
            this.listController.processAndDisplay();
        });
    }

    private handleSignedOutState(): void {
        const container = document.getElementById('applications-container');
        if (container) {
            container.innerHTML = '<p class="empty-state">Sign in to view and manage your applications.</p>';
        }
    }

    private handleEmptyState(): void {
        const container = document.getElementById('applications-container');
        if (container) {
            container.innerHTML = '<p id="no-apps-message">No applications yet. Add your first one above!</p>';
        }
        setApplications([]);
        this.listController.processAndDisplay();
    }

    private handleGuestMode(): void {
        updateFormAuthState(null, true); // true for guest special handling
        this.listController.processAndDisplay();
    }

    public async handleEdit(id: string): Promise<void> {
        try {
            const app = await this.appController.getApplication(id);
            if (app) this.formController.setEditMode(app);
        } catch (e: any) {
            showErrorMessage(e.message);
        }
    }

    public async handleDelete(id: string): Promise<void> {
        const app = applications.get().find(a => a.id === id);
        if (!app || !confirm(`Delete application for ${app.company}?`)) return;

        try {
            await this.appController.deleteApplication(id);
        } catch (e: any) {
            showErrorMessage(e.message);
        }
    }

    private getFormElements(): FormElements {
        return {
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
    }

    private renderConfigError(): void {
        const section = document.getElementById('applications-section');
        if (section) section.innerHTML = '<div class="firebase-config-error"><h2>⚠️ Firebase Configuration Required</h2><p>Please check your .env file.</p></div>';
    }

    // Helper for main.ts to trigger specific actions
    public getImportExport() { return this.importExportController; }
    public getFilters() { return this.filterController; }
}
