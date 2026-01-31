/**
 * FilterController
 * Manages all search, status, date, visa, and tag filtering logic
 */

import {
    filters,
    updateFilter,
    resetFilters
} from '../stores/applicationStore';
import { TaggingService } from '../services/taggingService';
import { eventTrackingService } from '../services/eventTracking';
import type { ApplicationStatus } from '../types';

export class FilterController {
    private searchInput: HTMLInputElement | null;
    private statusFilter: HTMLSelectElement | null;
    private dateRangeFilter: HTMLSelectElement | null;
    private visaFilter: HTMLSelectElement | null;
    private tagFilterSelect: HTMLSelectElement | null;
    private selectedTagsContainer: HTMLElement | null;
    private onFilterChange: () => void;

    constructor(callbacks: { onFilterChange: () => void }) {
        this.searchInput = document.getElementById('search-input') as HTMLInputElement;
        this.statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
        this.dateRangeFilter = document.getElementById('date-range-filter') as HTMLSelectElement;
        this.visaFilter = document.getElementById('visa-filter') as HTMLSelectElement;
        this.tagFilterSelect = document.getElementById('tag-filter-select') as HTMLSelectElement;
        this.selectedTagsContainer = document.getElementById('selected-tag-filters');
        this.onFilterChange = callbacks.onFilterChange;
    }

    /**
     * Initialize all filter event listeners
     */
    public init(): void {
        // Search input
        this.searchInput?.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            updateFilter('search', target.value);
            if (target.value.length > 0) {
                eventTrackingService.track('search_performed', { query: target.value });
            }
            this.onFilterChange();
        });

        // Status filter
        this.statusFilter?.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            updateFilter('status', target.value as ApplicationStatus | 'all');
            eventTrackingService.track('filter_applied', {
                filterType: 'status',
                value: target.value,
            });
            this.onFilterChange();
        });

        // Date range filter
        this.dateRangeFilter?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value;
            updateFilter('dateRange', value as 'all' | 'week' | 'month' | 'quarter');
            eventTrackingService.track('filter_applied', {
                filterType: 'dateRange',
                value,
            });
            this.onFilterChange();
        });

        // Visa sponsorship filter
        this.visaFilter?.addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value;
            updateFilter('visaSponsorship', value as 'all' | 'true' | 'false');
            eventTrackingService.track('filter_applied', {
                filterType: 'visaSponsorship',
                value,
            });
            this.onFilterChange();
        });

        // Initialize tagging UI
        this.initializeTagFiltering();
    }

    /**
     * Initialize tag filtering UI
     */
    private initializeTagFiltering(): void {
        if (!this.tagFilterSelect) return;

        // Populate tag filter dropdown
        this.populateTagFilterDropdown();

        // Handle tag selection
        this.tagFilterSelect.addEventListener('change', (e) => {
            const selectedTagId = (e.target as HTMLSelectElement).value;
            if (selectedTagId) {
                this.addTagFilter(selectedTagId);
                if (this.tagFilterSelect) this.tagFilterSelect.value = ''; // Reset dropdown
            }
        });

        // Initial render of active tags
        this.renderActiveTagFilters();
    }

    /**
     * Populate tag filter dropdown with available tags
     */
    private populateTagFilterDropdown(): void {
        if (!this.tagFilterSelect) return;

        // Clear existing options except the first
        while (this.tagFilterSelect.children.length > 1) {
            this.tagFilterSelect.removeChild(this.tagFilterSelect.lastChild!);
        }

        // Get all available tags from tagging service
        const allTags = TaggingService.getAllTags();

        // Add all tags to dropdown
        Object.values(allTags).forEach(categoryTags => {
            categoryTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag.id;
                option.textContent = `${tag.name} (${tag.category})`;
                this.tagFilterSelect?.appendChild(option);
            });
        });
    }

    /**
     * Add a tag to the active filters
     */
    private addTagFilter(tagId: string): void {
        const currentFilters = filters.get();
        const tagIds = (currentFilters.tags || []) as string[];

        if (!tagIds.includes(tagId)) {
            updateFilter('tags', [...tagIds, tagId]);
            this.renderActiveTagFilters();
            this.onFilterChange();
        }
    }

    /**
     * Remove a tag from the active filters
     */
    private removeTagFilter(tagId: string): void {
        const currentFilters = filters.get();
        const tagIds = (currentFilters.tags || []) as string[];

        updateFilter(
            'tags',
            tagIds.filter(id => id !== tagId)
        );
        this.renderActiveTagFilters();
        this.onFilterChange();
    }

    /**
     * Render active tag filters
     */
    private renderActiveTagFilters(): void {
        if (!this.selectedTagsContainer) return;

        this.selectedTagsContainer.innerHTML = '';

        const currentFilters = filters.get();
        const activeTagIds = (currentFilters.tags || []) as string[];

        activeTagIds.forEach(tagId => {
            const tag = TaggingService.getTagById(tagId);
            if (!tag) return;

            const tagElement = document.createElement('span');
            tagElement.className = 'filter-tag';
            tagElement.style.backgroundColor = tag.color || '#6b7280';
            tagElement.textContent = tag.name;

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'tag-filter-remove';
            removeBtn.setAttribute('data-tag-id', tag.id);
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => this.removeTagFilter(tag.id));

            tagElement.appendChild(removeBtn);
            this.selectedTagsContainer?.appendChild(tagElement);
        });
    }

    /**
     * Clear all filters
     */
    public clearAllFilters(): void {
        resetFilters();
        if (this.searchInput) this.searchInput.value = '';
        if (this.statusFilter) this.statusFilter.value = 'all';
        if (this.dateRangeFilter) this.dateRangeFilter.value = 'all';
        if (this.visaFilter) this.visaFilter.value = 'all';

        this.renderActiveTagFilters();
        this.onFilterChange();
    }

    /**
     * Public handlers for global hooks
     */
    public handleDateRangeChange(value: string): void {
        updateFilter('dateRange', value as any);
        eventTrackingService.track('filter_applied', { filterType: 'dateRange', value });
        this.onFilterChange();
    }

    public handleVisaFilterChange(value: string): void {
        updateFilter('visaSponsorship', value as any);
        eventTrackingService.track('filter_applied', { filterType: 'visaSponsorship', value });
        this.onFilterChange();
    }
}
