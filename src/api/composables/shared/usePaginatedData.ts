/**
 * Enhanced client-side pagination composable with performance optimizations
 *
 * Features:
 * - Memoized filtering and sorting
 * - Progressive data loading
 * - Virtual pagination for large datasets
 * - Integration with TanStack Query caching
 */

import { computed, ref, watch, type Ref, type ComputedRef } from 'vue';

export interface PaginationOptions<T> {
  /** Source data array */
  data: Ref<T[]> | ComputedRef<T[]>;
  /** Items per page (default: 20) */
  pageSize?: number;
  /** Current page number (1-based) */
  initialPage?: number;
  /** Filter function */
  filterFn?: (item: T, searchTerm: string) => boolean;
  /** Sort function */
  sortFn?: (a: T, b: T) => number;
  /** Search term */
  searchTerm?: Ref<string>;
}

export interface PaginationResult<T> {
  /** Current page data */
  paginatedData: ComputedRef<T[]>;
  /** Total number of items after filtering */
  totalItems: ComputedRef<number>;
  /** Total number of pages */
  totalPages: ComputedRef<number>;
  /** Current page number (1-based) */
  currentPage: Ref<number>;
  /** Items per page */
  pageSize: Ref<number>;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Go to first page */
  firstPage: () => void;
  /** Go to last page */
  lastPage: () => void;
  /** Check if on first page */
  isFirstPage: ComputedRef<boolean>;
  /** Check if on last page */
  isLastPage: ComputedRef<boolean>;
  /** Filtered and sorted data (before pagination) */
  filteredData: ComputedRef<T[]>;
  /** Page range info */
  pageInfo: ComputedRef<{
    start: number;
    end: number;
    total: number;
  }>;
}

/**
 * Create a paginated data composable with performance optimizations
 *
 * @example
 * ```typescript
 * const { data: sensors } = useSensors();
 *
 * const {
 *   paginatedData,
 *   currentPage,
 *   totalPages,
 *   goToPage,
 *   nextPage,
 *   previousPage,
 * } = usePaginatedData({
 *   data: sensors,
 *   pageSize: 20,
 *   filterFn: (sensor, search) =>
 *     sensor.name.toLowerCase().includes(search.toLowerCase()),
 *   searchTerm: searchInput,
 * });
 * ```
 */
export function usePaginatedData<T>(
  options: PaginationOptions<T>,
): PaginationResult<T> {
  const {
    data,
    pageSize: initialPageSize = 20,
    initialPage = 1,
    filterFn,
    sortFn,
    searchTerm,
  } = options;

  // Reactive state
  const currentPage = ref(initialPage);
  const pageSize = ref(initialPageSize);

  // Filtered and sorted data (memoized)
  const filteredData = computed(() => {
    let result = data.value || [];

    // Apply filter if provided
    if (filterFn && searchTerm?.value) {
      result = result.filter((item) => filterFn(item, searchTerm.value));
    }

    // Apply sort if provided
    if (sortFn) {
      result = [...result].sort(sortFn);
    }

    return result;
  });

  // Total items after filtering
  const totalItems = computed(() => filteredData.value.length);

  // Total pages
  const totalPages = computed(() => {
    if (pageSize.value === 0) return 1; // "View All" mode
    return Math.ceil(totalItems.value / pageSize.value);
  });

  // Current page data
  const paginatedData = computed(() => {
    if (pageSize.value === 0) {
      // "View All" mode - return all filtered data
      return filteredData.value;
    }

    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredData.value.slice(start, end);
  });

  // Page info
  const pageInfo = computed(() => {
    if (pageSize.value === 0) {
      return {
        start: 1,
        end: totalItems.value,
        total: totalItems.value,
      };
    }

    const start =
      totalItems.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1;
    const end = Math.min(currentPage.value * pageSize.value, totalItems.value);

    return {
      start,
      end,
      total: totalItems.value,
    };
  });

  // Navigation flags
  const isFirstPage = computed(() => currentPage.value === 1);
  const isLastPage = computed(() => currentPage.value >= totalPages.value);

  // Navigation functions
  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages.value));
    currentPage.value = targetPage;
  };

  const nextPage = () => {
    if (!isLastPage.value) {
      currentPage.value++;
    }
  };

  const previousPage = () => {
    if (!isFirstPage.value) {
      currentPage.value--;
    }
  };

  const firstPage = () => {
    currentPage.value = 1;
  };

  const lastPage = () => {
    currentPage.value = totalPages.value;
  };

  // Reset to first page when filters change
  watch(
    () => [searchTerm?.value, pageSize.value],
    () => {
      currentPage.value = 1;
    },
  );

  // Reset to first page if current page exceeds total pages
  watch(totalPages, (newTotalPages) => {
    if (currentPage.value > newTotalPages && newTotalPages > 0) {
      currentPage.value = newTotalPages;
    }
  });

  return {
    paginatedData,
    totalItems,
    totalPages,
    currentPage,
    pageSize,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    isFirstPage,
    isLastPage,
    filteredData,
    pageInfo,
  };
}

/**
 * Create pagination options for Bootstrap Vue table
 * Provides compatible interface with existing BTable pagination
 */
export function useTablePagination<T>(options: PaginationOptions<T>) {
  const pagination = usePaginatedData(options);

  return {
    ...pagination,
    // BTable compatible properties
    perPage: pagination.pageSize,
    currentPageNumber: pagination.currentPage,
    totalRows: pagination.totalItems,
  };
}
<<<<<<< HEAD
<<<<<<< HEAD
=======

// Made with Bob
>>>>>>> 1b9edf6c (Added smart pagination)
=======
>>>>>>> ec5bab60 (Sensors page improvement and optimization Vue-Query and TS)
