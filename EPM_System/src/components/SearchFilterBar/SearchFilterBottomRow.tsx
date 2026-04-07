/**
 * 底部：筆數、排序、篩選、重置
 */

import type { RefObject } from 'react';
import { FunnelIcon, SortLinesIcon } from './filterIcons';
import styles from './SearchFilterBar.module.css';

interface SearchFilterBottomRowProps {
  filterFieldsRef: RefObject<HTMLDivElement | null>;
  visibleCount: number;
  totalCount: number;
  sortModeLabel: string;
  onSortCycle: () => void;
  onResetFilters: () => void;
}

export function SearchFilterBottomRow({
  filterFieldsRef,
  visibleCount,
  totalCount,
  sortModeLabel,
  onSortCycle,
  onResetFilters,
}: SearchFilterBottomRowProps) {
  const scrollToFilters = () => {
    filterFieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const first = filterFieldsRef.current?.querySelector('select');
    if (first instanceof HTMLSelectElement) {
      first.focus();
    }
  };

  return (
    <div className={styles.bottomRow}>
      <p className={styles.countText} role="status">
        顯示 {visibleCount} 筆品目，共 {totalCount} 筆
      </p>
      <div className={styles.bottomActions}>
        <button
          type="button"
          className={styles.btnOutline}
          onClick={onSortCycle}
          title={sortModeLabel}
          aria-label={`排序：${sortModeLabel}`}
        >
          <SortLinesIcon />
          排序
          <span className={styles.sortHint}>({sortModeLabel})</span>
        </button>
        <button
          type="button"
          className={styles.btnOutline}
          onClick={scrollToFilters}
          aria-label="聚焦篩選條件"
        >
          <FunnelIcon />
          篩選
        </button>
        <button type="button" className={styles.btnReset} onClick={onResetFilters}>
          重置篩選
        </button>
      </div>
    </div>
  );
}
