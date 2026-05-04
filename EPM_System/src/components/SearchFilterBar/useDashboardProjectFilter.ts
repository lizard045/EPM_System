/**
 * 戰情室列表：搜尋／篩選狀態與可見傳票（供 DashboardView 使用）
 */

import { useCallback, useMemo, useState } from 'react';
import { useEPM } from '../../context/EPMContext';
import type { Project, ProjectSortMode } from '../../types';
import {
  collectStationFilterOptions,
  collectUniqueField,
  projectMatchesDateRange,
  projectMatchesStationKey,
  projectMatchesStatus,
  sortProjects,
  STATION_FILTER_NONE,
} from '../../utils';
import {
  DEFAULT_DASHBOARD_FILTERS,
  DEFAULT_SORT_MODE,
  PRIORITY_PRESETS,
  SORT_CYCLE,
  SORT_LABELS,
  type DashboardFilterState,
} from './types';

function filterProjectsBySearch<T extends { mpn: string; workOrder: string }>(
  list: T[],
  rawQuery: string
): T[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) => {
    const mpn = (p.mpn || '').toLowerCase();
    const wo = (p.workOrder || '').toLowerCase();
    return mpn.includes(q) || wo.includes(q);
  });
}

export interface UseDashboardProjectFilterResult {
  /** 通過搜尋與篩選、排序後的傳票 */
  visibleProjects: Project[];
  /** 進行中傳票總數 */
  activeCount: number;
  /** 是否有進行中傳票 */
  hasAnyActive: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filters: DashboardFilterState;
  onFiltersChange: (patch: Partial<DashboardFilterState>) => void;
  sortMode: ProjectSortMode;
  sortModeLabel: string;
  onSortCycle: () => void;
  onResetFilters: () => void;
  priorityOptions: string[];
  epmOptions: string[];
  customerOptions: string[];
  stationSelectOptions: { value: string; label: string }[];
}

export function useDashboardProjectFilter(): UseDashboardProjectFilterResult {
  const {
    projects,
    toolDeliveryMap,
    partDeliveryMap,
    stationProgressMap,
  } = useEPM();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DashboardFilterState>(
    DEFAULT_DASHBOARD_FILTERS
  );
  const [sortMode, setSortMode] = useState<ProjectSortMode>(DEFAULT_SORT_MODE);

  const activeProjects = projects.filter((p) => !p.isArchived);

  const priorityOptions = useMemo(() => {
    const fromData = collectUniqueField(activeProjects, (p) => p.priority);
    const merged = [...new Set([...PRIORITY_PRESETS, ...fromData])];
    merged.sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    return merged;
  }, [activeProjects]);

  const epmOptions = useMemo(
    () => collectUniqueField(activeProjects, (p) => p.epmName),
    [activeProjects]
  );

  const customerOptions = useMemo(
    () => collectUniqueField(activeProjects, (p) => p.customer),
    [activeProjects]
  );

  const stationSelectOptions = useMemo(() => {
    const { hasEmptyDisplay, stationLabels } = collectStationFilterOptions(
      activeProjects,
      stationProgressMap
    );
    const opts: { value: string; label: string }[] = [
      { value: '', label: '全部在站站點' },
    ];
    stationLabels.forEach((s) => opts.push({ value: s, label: s }));
    if (hasEmptyDisplay) {
      opts.push({ value: STATION_FILTER_NONE, label: '無在站資料' });
    }
    return opts;
  }, [activeProjects, stationProgressMap]);

  const visibleProjects = useMemo(() => {
    let list = filterProjectsBySearch(activeProjects, searchQuery);
    list = list.filter((p) =>
      projectMatchesStatus(p, filters.status, toolDeliveryMap, partDeliveryMap)
    );
    if (filters.priority) {
      list = list.filter((p) => (p.priority || '一般') === filters.priority);
    }
    if (filters.epm) {
      list = list.filter((p) => (p.epmName || '').trim() === filters.epm);
    }
    if (filters.customer) {
      list = list.filter((p) => (p.customer || '').trim() === filters.customer);
    }
    list = list.filter((p) =>
      projectMatchesStationKey(p, filters.station, stationProgressMap)
    );
    list = list.filter((p) => projectMatchesDateRange(p, filters.dateRange));
    return sortProjects(list, sortMode);
  }, [
    activeProjects,
    searchQuery,
    filters,
    toolDeliveryMap,
    partDeliveryMap,
    stationProgressMap,
    sortMode,
  ]);

  const onFiltersChange = useCallback((patch: Partial<DashboardFilterState>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const onSortCycle = useCallback(() => {
    setSortMode((prev) => {
      const i = SORT_CYCLE.indexOf(prev);
      return SORT_CYCLE[(i + 1) % SORT_CYCLE.length];
    });
  }, []);

  const onResetFilters = useCallback(() => {
    setSearchQuery('');
    setFilters(DEFAULT_DASHBOARD_FILTERS);
    setSortMode(DEFAULT_SORT_MODE);
  }, []);

  return {
    visibleProjects,
    activeCount: activeProjects.length,
    hasAnyActive: activeProjects.length > 0,
    searchQuery,
    setSearchQuery,
    filters,
    onFiltersChange,
    sortMode,
    sortModeLabel: SORT_LABELS[sortMode],
    onSortCycle,
    onResetFilters,
    priorityOptions,
    epmOptions,
    customerOptions,
    stationSelectOptions,
  };
}
