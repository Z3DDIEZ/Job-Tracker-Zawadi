/**
 * Pagination Utilities
 * Handles pagination for large lists of applications
 */

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export const PaginationManager = {
  /**
   * Calculate pagination state
   */
  calculatePagination(
    totalItems: number,
    itemsPerPage: number = 20,
    currentPage: number = 1
  ): PaginationState {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const validPage = Math.max(1, Math.min(currentPage, totalPages));

    return {
      currentPage: validPage,
      itemsPerPage,
      totalItems,
      totalPages: totalPages || 1,
    };
  },

  /**
   * Get items for current page
   */
  getPageItems<T>(items: T[], pagination: PaginationState): T[] {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return items.slice(startIndex, endIndex);
  },

  /**
   * Create pagination controls HTML
   */
  createPaginationControls(pagination: PaginationState): string {
    if (pagination.totalPages <= 1) {
      return '';
    }

    const prevDisabled = pagination.currentPage === 1 ? 'disabled' : '';
    const nextDisabled =
      pagination.currentPage === pagination.totalPages ? 'disabled' : '';

    let pageButtons = '';

    // Show page numbers (max 5 visible)
    const maxVisible = 5;
    let startPage = Math.max(
      1,
      pagination.currentPage - Math.floor(maxVisible / 2)
    );
    let endPage = Math.min(
      pagination.totalPages,
      startPage + maxVisible - 1
    );

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pageButtons += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        pageButtons += `<span class="page-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const active = i === pagination.currentPage ? 'active' : '';
      pageButtons += `<button class="page-btn ${active}" data-page="${i}">${i}</button>`;
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pageButtons += `<span class="page-ellipsis">...</span>`;
      }
      pageButtons += `<button class="page-btn" data-page="${pagination.totalPages}">${pagination.totalPages}</button>`;
    }

    return `
      <div class="pagination-controls">
        <button class="page-btn prev ${prevDisabled}" data-action="prev" ${prevDisabled ? 'disabled' : ''}>
          ← Previous
        </button>
        <div class="page-numbers">
          ${pageButtons}
        </div>
        <button class="page-btn next ${nextDisabled}" data-action="next" ${nextDisabled ? 'disabled' : ''}>
          Next →
        </button>
        <div class="pagination-info">
          Page ${pagination.currentPage} of ${pagination.totalPages}
          (${pagination.totalItems} total)
        </div>
      </div>
    `;
  },
};
