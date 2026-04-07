/**
 * 關鍵字搜尋列
 */

import { forwardRef } from 'react';
import { SearchIcon } from './filterIcons';
import styles from './SearchFilterBar.module.css';

interface SearchFilterSearchInputProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const SearchFilterSearchInput = forwardRef<
  HTMLInputElement,
  SearchFilterSearchInputProps
>(function SearchFilterSearchInput({ searchQuery, onSearchChange }, ref) {
  return (
    <div className={styles.searchWrap}>
      <SearchIcon className={styles.searchIcon} />
      <input
        ref={ref}
        type="search"
        className={styles.searchInput}
        placeholder="搜尋品目名稱或工單號碼"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
});
