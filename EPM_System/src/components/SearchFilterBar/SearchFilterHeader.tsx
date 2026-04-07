/**
 * 標題列：篩選圖示、標題、卡片／表格切換
 */

import { useEPM } from '../../context/EPMContext';
import type { ViewMode } from '../../types';
import { FilterSlidersIcon, GridIcon, TableIcon } from './filterIcons';
import styles from './SearchFilterBar.module.css';

interface SearchFilterHeaderProps {
  onFocusSearch: () => void;
}

export function SearchFilterHeader({ onFocusSearch }: SearchFilterHeaderProps) {
  const { viewMode, setViewMode } = useEPM();

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className={styles.topRow}>
      <div className={styles.titleGroup}>
        <button
          type="button"
          className={styles.filterIconBtn}
          onClick={onFocusSearch}
          title="聚焦搜尋"
          aria-label="聚焦搜尋欄位"
        >
          <FilterSlidersIcon />
        </button>
        <h2 className={styles.sectionTitle}>搜尋與篩選</h2>
      </div>
      <div className={styles.segmented} role="group" aria-label="檢視方式">
        <button
          type="button"
          className={`${styles.segmentBtn} ${viewMode === 'card' ? styles.active : ''}`}
          onClick={() => setMode('card')}
          aria-pressed={viewMode === 'card'}
        >
          <GridIcon />
          卡片
        </button>
        <button
          type="button"
          className={`${styles.segmentBtn} ${viewMode === 'table' ? styles.active : ''}`}
          onClick={() => setMode('table')}
          aria-pressed={viewMode === 'table'}
        >
          <TableIcon />
          表格
        </button>
      </div>
    </div>
  );
}
