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
   * DEPRECATED: Use createPaginationControlsSafe() instead for security
   * Kept for backward compatibility but returns empty
   */
  createPaginationControls(_pagination: PaginationState): string {
    // This method is deprecated - use DOM creation instead
    // Returning empty string to force use of safe method
    console.warn('createPaginationControls() is deprecated. Use DOM creation instead.');
    return '';
  },
};
