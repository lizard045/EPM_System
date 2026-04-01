/**
 * 戰情室：搜尋與篩選列（卡片／表格切換 + 關鍵字搜尋）
 */

import { useRef } from 'react';
import { useEPM } from '../../context/EPMContext';
import type { ViewMode } from '../../types';
import styles from './SearchFilterBar.module.css';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

function FilterSlidersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h10M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="18" cy="7" r="2.5" fill="currentColor" />
      <circle cx="14" cy="12" r="2.5" fill="currentColor" />
      <circle cx="20" cy="17" r="2.5" fill="currentColor" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
        fill="currentColor"
      />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h16v3H4V5zm0 5h16v4H4v-4zm0 6h16v4H4v-4z"
        fill="currentColor"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className={styles.searchIcon}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM16.5 16.5L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
}: SearchFilterBarProps) {
  const { viewMode, setViewMode } = useEPM();
  const inputRef = useRef<HTMLInputElement>(null);

  const focusSearch = () => {
    inputRef.current?.focus();
  };

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className={styles.searchFilterBar}>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <button
            type="button"
            className={styles.filterIconBtn}
            onClick={focusSearch}
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
      <div className={styles.searchWrap}>
        <SearchIcon />
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder="搜尋品目名稱或工單號碼"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
