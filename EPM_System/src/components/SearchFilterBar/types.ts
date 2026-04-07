/**
 * 戰情室搜尋／篩選：型別與常數
 */

import type {
  ProjectDateRangeFilter,
  ProjectSortMode,
  ProjectStatusFilter,
} from '../../types';

export interface DashboardFilterState {
  status: ProjectStatusFilter;
  priority: string;
  epm: string;
  customer: string;
  station: string;
  dateRange: ProjectDateRangeFilter;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  status: 'all',
  priority: '',
  epm: '',
  customer: '',
  station: '',
  dateRange: 'all',
};

export const DEFAULT_SORT_MODE: ProjectSortMode = 'created_desc';

export const PRIORITY_PRESETS = ['一般', '急件', '特急'];

export const STATUS_OPTIONS: { value: ProjectStatusFilter; label: string }[] = [
  { value: 'all', label: '所有狀態' },
  { value: 'no_traveler', label: '未匯入手順書' },
  { value: 'traveler_ok', label: '已匯入手順書' },
  { value: 'tool_warn', label: '模治具未齊' },
  { value: 'part_warn', label: '零件／備料未齊' },
];

export const DATE_RANGE_OPTIONS: {
  value: ProjectDateRangeFilter;
  label: string;
}[] = [
  { value: 'all', label: '全部日期' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本週' },
  { value: 'month', label: '本月' },
  { value: 'last30', label: '近 30 天' },
];

export const SORT_CYCLE: ProjectSortMode[] = [
  'created_desc',
  'created_asc',
  'mpn_asc',
  'mpn_desc',
  'wo_asc',
  'deadline_asc',
  'deadline_desc',
];

export const SORT_LABELS: Record<ProjectSortMode, string> = {
  created_desc: '建立日期（新→舊）',
  created_asc: '建立日期（舊→新）',
  mpn_asc: '品目（A→Z）',
  mpn_desc: '品目（Z→A）',
  wo_asc: '工單號碼',
  deadline_asc: '交期（近→遠）',
  deadline_desc: '交期（遠→近）',
};
