/**
 * ImportExportController
 * Manages CSV Import and Export operations
 */

import { applications, filters } from '../stores/applicationStore';
import { CacheManager } from '../utils/cache';
import { exportToCSV } from '../utils/exportHelpers';
import {
    triggerCSVImport,
    formatImportResult,
    generateErrorReport,
    type ImportResult,
    type ImportError
} from '../utils/importHelpers';
import { FilterManager } from '../utils/filters';
import { eventTrackingService } from '../services/eventTracking';
import { authService } from '../services/authService';
import { showSuccessMessage, showErrorMessage, showInfoMessage } from '../utils/domHelpers';
import type { ApplicationController } from './ApplicationController';
import type { ApplicationFilters, ApplicationStatus } from '../types';

export class ImportExportController {
    private appController: ApplicationController;
    private progressModal: HTMLElement | null = null;

    constructor(appController: ApplicationController) {
        this.appController = appController;
    }

    /**
     * Handle CSV Export
     */
    public export(): void {
        const allApps = applications.get();
        const currentFilters = filters.get();

        const appFilters: ApplicationFilters = {
            search: currentFilters.search || '',
            status: (currentFilters.status || 'all') as ApplicationStatus | 'all',
            dateRange: (currentFilters.dateRange || 'all') as 'all' | 'week' | 'month' | 'quarter',
            visaSponsorship: (currentFilters.visaSponsorship || 'all') as 'all' | 'true' | 'false',
            tags: (currentFilters.tags || []) as string[],
        };

        const filtered = FilterManager.applyFilters(allApps, appFilters);
        const filename = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;

        eventTrackingService.track('export_csv', { applicationCount: filtered.length });
        exportToCSV(filtered, filename);
    }

    /**
     * Handle CSV Import
     */
    public import(): void {
        const user = authService.getCurrentUser();
        if (!user) {
            showErrorMessage('Please sign in to import applications.');
            return;
        }

        triggerCSVImport(
            (result) => this.handleImportResult(result),
            (progress) => this.updateProgress(progress)
        );
    }

    private updateProgress(progress: number): void {
        if (!this.progressModal) {
            this.progressModal = this.createProgressModal();
            document.body.appendChild(this.progressModal);
        }

        const bar = this.progressModal.querySelector('.import-progress-bar') as HTMLElement;
        const text = this.progressModal.querySelector('.import-progress-text') as HTMLElement;
        if (bar) bar.style.width = `${progress}%`;
        if (text) text.textContent = `${Math.round(progress)}%`;
    }

    private handleImportResult(result: ImportResult): void {
        if (this.progressModal) {
            this.progressModal.remove();
            this.progressModal = null;
        }

        if (result.imported.length === 0 && result.errors.length === 0) return;

        if (result.imported.length > 0) {
            this.saveImported(result);
        } else {
            showErrorMessage(formatImportResult(result).message);
            if (result.errors.length > 0) this.showErrorReport(result.errors);
        }
    }

    private async saveImported(result: ImportResult): Promise<void> {
        try {
            const dbResult = await this.appController.importApplications(result.imported);
            showSuccessMessage('Import processing complete.');

            if (dbResult.skipped > 0) {
                showInfoMessage(`Skipped ${dbResult.skipped} duplicates.`);
            }

            eventTrackingService.track('application_added', {
                importedCount: result.imported.length,
                errorCount: result.errors.length,
                skippedCount: dbResult.skipped,
            });

            if (result.errors.length > 0) this.showErrorReport(result.errors);
            CacheManager.invalidate();
        } catch (error: any) {
            showErrorMessage(`Failed to save: ${error.message}`);
        }
    }

    private createProgressModal(): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'import-progress-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 12px; min-width: 300px;">
        <h3 style="margin: 0 0 1rem 0;">Importing Applications...</h3>
        <div style="background: #e2e8f0; border-radius: 8px; height: 24px; overflow: hidden; position: relative;">
          <div class="import-progress-bar" style="background: #3b82f6; height: 100%; width: 0%; transition: width 0.3s ease;"></div>
          <div class="import-progress-text" style="position: absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size: 0.875rem;">0%</div>
        </div>
      </div>
    `;
        return modal;
    }

    private showErrorReport(errors: ImportError[]): void {
        const report = generateErrorReport(errors);
        const modal = document.createElement('div');
        modal.className = 'import-error-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        modal.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
        <h3 style="color: #dc2626; margin: 0 0 1rem 0;">⚠️ Import Errors</h3>
        <p>${errors.length} rows could not be imported:</p>
        <pre style="background: #f8fafc; padding: 1rem; border-radius: 8px; white-space: pre-wrap; font-size: 0.875rem;">${report}</pre>
        <button class="btn-close" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 6px; margin-top: 1rem; cursor: pointer;">Close</button>
      </div>
    `;
        modal.querySelector('.btn-close')?.addEventListener('click', () => modal.remove());
        document.body.appendChild(modal);
    }

    /**
     * Inject buttons into UI if needed, or just handle actions
     */
    public attachHandlers(exportId: string, importId: string): void {
        document.getElementById(exportId)?.addEventListener('click', () => this.export());
        document.getElementById(importId)?.addEventListener('click', () => this.import());
    }
}
