/**
 * Job Application Tracker - Main Entry Point
 * Reduced entry point delegating to the App Orchestrator.
 */

import '../style.css';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { App } from './controllers/App';

// Initialize PWA Install Prompt
new PwaInstallPrompt();

// Initialize the Application Orchestrator
const app = new App();

window.addEventListener('DOMContentLoaded', () => {
  app.init().then(() => {
    // Expose necessary functions globally for any remaining inline handlers
    // or external script interaction
    const filterController = app.filterController;
    const listController = app.listController;
    const formController = app.formController;

    (window as any).editApplication = (id: string) => app.handleEdit(id);
    (window as any).deleteApplication = (id: string) => app.handleDelete(id);
    (window as any).cancelEdit = () => formController?.cancelEdit();
    (window as any).clearAllFilters = () => filterController?.clearAllFilters();
    (window as any).handleDateRangeChange = (v: string) => filterController?.handleDateRangeChange?.(v); // Note: Need to add these to FilterController
    (window as any).handleVisaFilterChange = (v: string) => filterController?.handleVisaFilterChange?.(v);
    (window as any).handleSortChange = (v: string) => listController.handleSortChange?.(v);
    (window as any).switchViewMode = (m: any) => listController?.switchViewMode(m);

    // Some of these handlers might need matching methods in their respective controllers
    // I will add them if they are missing.
  });
});

export default app;
