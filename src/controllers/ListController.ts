/**
 * ListController
 * Manages application list rendering, view toggling, and pagination
 */

import {
    applications,
    filters,
    sortBy,
    setFilteredApplications,
    setSortPreference
} from '../stores/applicationStore';
import { FilterManager } from '../utils/filters';
import { SortManager } from '../utils/sorting';
import { PaginationManager } from '../utils/pagination';
import { createTableView, type ViewMode } from '../utils/viewModes';
import { animationService } from '../services/animationService';
import { eventTrackingService } from '../services/eventTracking';
import { createApplicationCardSafe, showErrorMessage } from '../utils/domHelpers';
import { validateApplicationId } from '../utils/security';
import { CacheManager } from '../utils/cache';
import type { JobApplication, ApplicationFilters, ApplicationStatus, SortOption } from '../types';

export class ListController {
    private container: HTMLElement | null;
    private counterText: HTMLElement | null;
    private currentViewMode: ViewMode = 'cards';
    private currentPage = 1;
    private itemsPerPage = 20;

    private onEdit: (id: string) => void;
    private onDelete: (id: string) => void;
    private onAnalyticsView: (apps: JobApplication[]) => void;

    constructor(callbacks: {
        onEdit: (id: string) => void;
        onDelete: (id: string) => void;
        onAnalyticsView: (apps: JobApplication[]) => void;
    }) {
        this.container = document.getElementById('applications-container');
        this.counterText = document.getElementById('counter-text');
        this.onEdit = callbacks.onEdit;
        this.onDelete = callbacks.onDelete;
        this.onAnalyticsView = callbacks.onAnalyticsView;
    }

    /**
     * Initialize list listeners and UI
     */
    public init(): void {
        // Initialize view toggle buttons
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = (btn as HTMLElement).dataset.view as ViewMode;
                if (mode) this.switchViewMode(mode);
            });
        });

        // Initialize sort select
        const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
        if (sortSelect) {
            sortSelect.value = sortBy.get().value;
            sortSelect.addEventListener('change', (e) => {
                const value = (e.target as HTMLSelectElement).value as SortOption;
                setSortPreference(value);
                this.processAndDisplay();
            });
        }

        // Subscribe to store changes
        filters.subscribe(() => this.processAndDisplay());
        sortBy.subscribe(() => this.processAndDisplay());
    }

    /**
     * Main entry point for filtering, sorting and displaying
     */
    public processAndDisplay(): void {
        const apps = applications.get();
        const currentFilters = filters.get();
        const currentSort = sortBy.get().value;

        const appFilters: ApplicationFilters = {
            search: currentFilters.search || '',
            status: (currentFilters.status || 'all') as ApplicationStatus | 'all',
            dateRange: (currentFilters.dateRange || 'all') as 'all' | 'week' | 'month' | 'quarter',
            visaSponsorship: (currentFilters.visaSponsorship || 'all') as 'all' | 'true' | 'false',
            tags: (currentFilters.tags || []) as string[],
        };

        const filtered = FilterManager.applyFilters(apps, appFilters);
        setFilteredApplications(filtered);

        if (this.currentViewMode === 'analytics') {
            this.onAnalyticsView(filtered);
            this.updateCounter(filtered.length, apps.length);
            return;
        }

        const sorted = SortManager.sort(filtered, currentSort);
        this.renderList(sorted);
        this.updateCounter(sorted.length, apps.length);
    }

    /**
     * Switch between cards, table and analytics
     */
    public switchViewMode(mode: ViewMode): void {
        const previousMode = this.currentViewMode;
        const analyticsSection = document.getElementById('analytics-section');
        const appsSection = this.container?.parentElement;

        this.currentViewMode = mode;
        this.currentPage = 1;

        // Update button states
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', (btn as HTMLElement).dataset.view === mode);
        });

        if (mode === 'analytics') {
            eventTrackingService.track('analytics_viewed');
            if (previousMode !== 'analytics') {
                animationService.transitionView(appsSection || null, analyticsSection, {
                    duration: 300,
                    direction: 'horizontal',
                });
            }
            if (analyticsSection) analyticsSection.style.display = 'block';
            const sortSection = document.querySelector('.sort-controls')?.parentElement;
            if (sortSection) (sortSection as HTMLElement).style.display = 'none';
        } else {
            if (previousMode === 'analytics') {
                animationService.transitionView(analyticsSection, appsSection || null, {
                    duration: 300,
                    direction: 'horizontal',
                });
            }
            if (analyticsSection) analyticsSection.style.display = 'none';
            if (appsSection) appsSection.style.display = 'block';

            const filtersSection = document.querySelector('.advanced-filters')?.parentElement;
            const sortSection = document.querySelector('.sort-controls')?.parentElement;
            if (filtersSection) (filtersSection as HTMLElement).style.display = 'block';
            if (sortSection) (sortSection as HTMLElement).style.display = 'block';
        }

        this.processAndDisplay();
    }

    /**
     * Public handler for global hooks
     */
    public handleSortChange(value: string): void {
        setSortPreference(value as SortOption);
        this.processAndDisplay();
    }

    /**
     * Render the actual application list
     */
    private renderList(apps: JobApplication[]): void {
        if (!this.container) return;
        this.container.innerHTML = '';

        if (apps.length === 0) {
            this.renderEmptyState();
            return;
        }

        const pagination = PaginationManager.calculatePagination(apps.length, this.itemsPerPage, this.currentPage);
        const paginatedApps = PaginationManager.getPageItems(apps, pagination);

        if (this.currentViewMode === 'table') {
            this.renderTable(paginatedApps);
        } else {
            this.renderCards(paginatedApps);
        }

        if (pagination.totalPages > 1) {
            this.renderPagination(pagination);
        }
    }

    private renderEmptyState(): void {
        if (!this.container) return;
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
      <p>No applications match your filters</p>
      <button class="btn-clear-filters" id="list-clear-filters">Clear Filters</button>
    `;
        this.container.appendChild(noResults);
        document.getElementById('list-clear-filters')?.addEventListener('click', () => {
            // This will be handled by the orchestrator
            document.dispatchEvent(new CustomEvent('app:clear-filters'));
        });
    }

    private renderTable(apps: JobApplication[]): void {
        if (!this.container) return;
        const table = createTableView(apps);
        this.container.appendChild(table);
        setTimeout(() => {
            const rows = table.querySelectorAll('tbody tr');
            animationService.animateCardEntrance(rows as NodeListOf<HTMLElement>, { delay: 30 });
        }, 50);
    }

    private renderCards(apps: JobApplication[]): void {
        if (!this.container) return;
        const cards: HTMLElement[] = [];
        apps.forEach(app => {
            const card = this.createCard(app);
            this.container?.appendChild(card);
            cards.push(card);
        });
        setTimeout(() => {
            animationService.animateCardEntrance(cards, { delay: 50, startDelay: 100 });
        }, 50);
    }

    private createCard(app: JobApplication): HTMLDivElement {
        const card = createApplicationCardSafe(app);
        const editBtn = card.querySelector('.btn-edit[data-action="edit"]');
        const deleteBtn = card.querySelector('.btn-delete[data-action="delete"]');

        editBtn?.addEventListener('click', () => {
            const appId = (editBtn as HTMLElement).dataset.appId;
            if (appId) {
                try { validateApplicationId(appId); this.onEdit(appId); }
                catch (e) { showErrorMessage('Invalid app ID'); }
            }
        });

        deleteBtn?.addEventListener('click', () => {
            const appId = (deleteBtn as HTMLElement).dataset.appId;
            if (appId) {
                try { validateApplicationId(appId); this.onDelete(appId); }
                catch (e) { showErrorMessage('Invalid app ID'); }
            }
        });

        return card;
    }

    private renderPagination(pagination: any): void {
        if (!this.container) return;
        const nav = document.createElement('div');
        nav.className = 'pagination-controls';

        // Simplification for brevitiy, reuse main logic normally
        // For now lets just create the container and buttons
        nav.innerHTML = `
      <button class="page-btn prev ${pagination.currentPage === 1 ? 'disabled' : ''}" data-action="prev" ${pagination.currentPage === 1 ? 'disabled' : ''}>← Previous</button>
      <div class="page-numbers"></div>
      <button class="page-btn next ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}" data-action="next" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}>Next →</button>
      <div class="pagination-info">Page ${pagination.currentPage} of ${pagination.totalPages}</div>
    `;

        const numbers = nav.querySelector('.page-numbers')!;
        for (let i = 1; i <= pagination.totalPages; i++) {
            if (i > 5 && i < pagination.totalPages) {
                if (i === 6) numbers.innerHTML += '<span>...</span>';
                continue;
            }
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === pagination.currentPage ? 'active' : ''}`;
            btn.textContent = String(i);
            btn.dataset.page = String(i);
            btn.addEventListener('click', () => { this.currentPage = i; this.processAndDisplay(); });
            numbers.appendChild(btn);
        }

        nav.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
            if (this.currentPage > 1) { this.currentPage--; this.processAndDisplay(); }
        });
        nav.querySelector('[data-action="next"]')?.addEventListener('click', () => {
            if (this.currentPage < pagination.totalPages) { this.currentPage++; this.processAndDisplay(); }
        });

        this.container.appendChild(nav);
    }

    private updateCounter(filtered: number, total: number): void {
        if (!this.counterText) return;
        const cacheStatus = CacheManager.getCacheData().isValid ? ' (cached)' : '';
        this.counterText.textContent = filtered === total
            ? `Showing ${total} ${total === 1 ? 'application' : 'applications'}${cacheStatus}`
            : `Showing ${filtered} of ${total} ${total === 1 ? 'application' : 'applications'}${cacheStatus}`;
    }

    public showLoading(): void {
        if (!this.container || CacheManager.getCacheData().isValid) return;
        this.container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading applications...</p></div>';
    }

    public setPage(page: number): void {
        this.currentPage = page;
    }

    public getCurrentViewMode(): ViewMode {
        return this.currentViewMode;
    }
}
