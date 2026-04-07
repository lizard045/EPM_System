/**
 * 傳票條件：六個下拉欄位
 */

import type { RefObject } from 'react';
import type { ProjectDateRangeFilter, ProjectStatusFilter } from '../../types';
import {
  DATE_RANGE_OPTIONS,
  STATUS_OPTIONS,
  type DashboardFilterState,
} from './types';
import styles from './SearchFilterBar.module.css';

interface DashboardFilterFieldsRowProps {
  filterFieldsRef: RefObject<HTMLDivElement | null>;
  filters: DashboardFilterState;
  onFiltersChange: (patch: Partial<DashboardFilterState>) => void;
  priorityOptions: string[];
  epmOptions: string[];
  customerOptions: string[];
  stationSelectOptions: { value: string; label: string }[];
}

export function DashboardFilterFieldsRow({
  filterFieldsRef,
  filters,
  onFiltersChange,
  priorityOptions,
  epmOptions,
  customerOptions,
  stationSelectOptions,
}: DashboardFilterFieldsRowProps) {
  return (
    <div
      ref={filterFieldsRef}
      id="dashboard-filter-fields"
      className={styles.filterFieldsRow}
    >
      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>狀態</span>
        <select
          className={styles.selectInput}
          value={filters.status}
          onChange={(e) =>
            onFiltersChange({ status: e.target.value as ProjectStatusFilter })
          }
          aria-label="狀態"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>優先度</span>
        <select
          className={styles.selectInput}
          value={filters.priority}
          onChange={(e) => onFiltersChange({ priority: e.target.value })}
          aria-label="優先度"
        >
          <option value="">優先度</option>
          {priorityOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>EPM</span>
        <select
          className={styles.selectInput}
          value={filters.epm}
          onChange={(e) => onFiltersChange({ epm: e.target.value })}
          aria-label="EPM"
        >
          <option value="">所有 EPM</option>
          {epmOptions.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>客戶</span>
        <select
          className={styles.selectInput}
          value={filters.customer}
          onChange={(e) => onFiltersChange({ customer: e.target.value })}
          aria-label="客戶"
        >
          <option value="">所有客戶</option>
          {customerOptions.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>在站站點</span>
        <select
          className={styles.selectInput}
          value={filters.station}
          onChange={(e) => onFiltersChange({ station: e.target.value })}
          aria-label="在站站點"
        >
          {stationSelectOptions.map((o) => (
            <option key={o.value === '' ? '__all__' : o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.filterField}>
        <span className={styles.visuallyHidden}>建立日期</span>
        <select
          className={styles.selectInput}
          value={filters.dateRange}
          onChange={(e) =>
            onFiltersChange({
              dateRange: e.target.value as ProjectDateRangeFilter,
            })
          }
          aria-label="建立日期"
        >
          {DATE_RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
