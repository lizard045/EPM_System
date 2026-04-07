/**
 * 戰情室：搜尋與篩選面板（組合子元件）
 */

import { useRef } from 'react';
import { DashboardFilterFieldsRow } from './DashboardFilterFieldsRow';
import { SearchFilterBottomRow } from './SearchFilterBottomRow';
import { SearchFilterHeader } from './SearchFilterHeader';
import { SearchFilterSearchInput } from './SearchFilterSearchInput';
import type { DashboardFilterState } from './types';
import styles from './SearchFilterBar.module.css';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: DashboardFilterState;
  onFiltersChange: (patch: Partial<DashboardFilterState>) => void;
  priorityOptions: string[];
  epmOptions: string[];
  customerOptions: string[];
  stationSelectOptions: { value: string; label: string }[];
  sortModeLabel: string;
  onSortCycle: () => void;
  visibleCount: number;
  totalCount: number;
  onResetFilters: () => void;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  priorityOptions,
  epmOptions,
  customerOptions,
  stationSelectOptions,
  sortModeLabel,
  onSortCycle,
  visibleCount,
  totalCount,
  onResetFilters,
}: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filterFieldsRef = useRef<HTMLDivElement>(null);

  const focusSearch = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchFilterBar}>
      <SearchFilterHeader onFocusSearch={focusSearch} />
      <SearchFilterSearchInput
        ref={inputRef}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
      <DashboardFilterFieldsRow
        filterFieldsRef={filterFieldsRef}
        filters={filters}
        onFiltersChange={onFiltersChange}
        priorityOptions={priorityOptions}
        epmOptions={epmOptions}
        customerOptions={customerOptions}
        stationSelectOptions={stationSelectOptions}
      />
      <SearchFilterBottomRow
        filterFieldsRef={filterFieldsRef}
        visibleCount={visibleCount}
        totalCount={totalCount}
        sortModeLabel={sortModeLabel}
        onSortCycle={onSortCycle}
        onResetFilters={onResetFilters}
      />
    </div>
  );
}
