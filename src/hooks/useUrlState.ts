import { useSearchParams } from 'react-router-dom';

interface UseUrlStateOptions {
  defaultPerPage?: number;
  defaultPage?: number;
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
}

export function useUrlState(options: UseUrlStateOptions = {}) {
  const {
    defaultPerPage = 50,
    defaultPage = 1,
    defaultSortField = '',
    defaultSortDirection = 'desc'
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Get values from URL or use defaults
  const perPage = parseInt(searchParams.get('perPage') || defaultPerPage.toString());
  const currentPage = parseInt(searchParams.get('page') || defaultPage.toString());
  const sortField = searchParams.get('sortField') || defaultSortField;
  const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || defaultSortDirection;
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const searchTerm = searchParams.get('search') || '';

  const updateUrl = (updates: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });

    setSearchParams(newParams);
  };

  const setPerPage = (newPerPage: number) => {
    updateUrl({ perPage: newPerPage, page: 1 }); // Reset to first page when changing per page
  };

  const setCurrentPage = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const setSortField = (newSortField: string | number) => {
    updateUrl({ sortField: newSortField.toString(), page: 1 }); // Reset to first page when sorting
  };

  const setSortDirection = (newSortDirection: 'asc' | 'desc') => {
    updateUrl({ sortDirection: newSortDirection, page: 1 }); // Reset to first page when sorting
  };

  const setStartDate = (newStartDate: string) => {
    updateUrl({ startDate: newStartDate, page: 1 }); // Reset to first page when filtering
  };

  const setEndDate = (newEndDate: string) => {
    updateUrl({ endDate: newEndDate, page: 1 }); // Reset to first page when filtering
  };

  const setSearchTerm = (newSearchTerm: string) => {
    updateUrl({ search: newSearchTerm, page: 1 }); // Reset to first page when searching
  };

  const clearFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set('perPage', defaultPerPage.toString());
    newParams.set('page', '1');
    if (defaultSortField) {
      newParams.set('sortField', defaultSortField);
      newParams.set('sortDirection', defaultSortDirection);
    }
    setSearchParams(newParams);
  };

  return {
    // State values
    perPage,
    currentPage,
    sortField,
    sortDirection,
    startDate,
    endDate,
    searchTerm,
    
    // Setters
    setPerPage,
    setCurrentPage,
    setSortField,
    setSortDirection,
    setStartDate,
    setEndDate,
    setSearchTerm,
    clearFilters,
    
    // Utility
    updateUrl
  };
} 