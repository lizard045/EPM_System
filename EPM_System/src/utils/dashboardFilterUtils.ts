/**
 * 戰情室列表：依傳票資訊篩選與排序
 */

import { computeProjectAlerts } from './projectAlertsCompute';
import { getCurrentStationDisplay } from './stationUtils';
import type {
  Project,
  ProjectDateRangeFilter,
  ProjectSortMode,
  ProjectStatusFilter,
} from '../types';

/** 在站篩選：無在站資料 */
export const STATION_FILTER_NONE = '__none__';

export function getEffectiveCreatedMs(p: Project): number {
  if (p.createdAt) {
    const t = Date.parse(p.createdAt);
    if (!isNaN(t)) return t;
  }
  if (typeof p.id === 'number' && p.id > 1e12) return p.id;
  return 0;
}

function startOfDayMs(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function inCreatedRange(t: number, range: ProjectDateRangeFilter): boolean {
  if (range === 'all') return true;
  const now = new Date();
  const startToday = startOfDayMs(now);
  const endToday = startOfDayMs(new Date(now.getTime() + 86400000)) - 1;

  if (range === 'today') {
    return t >= startToday && t <= endToday;
  }
  if (range === 'week') {
    const day = now.getDay();
    const diffFromMon = day === 0 ? 6 : day - 1;
    const monday = startToday - diffFromMon * 86400000;
    return t >= monday && t <= endToday;
  }
  if (range === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return t >= first && t <= endToday + 1;
  }
  if (range === 'last30') {
    return t >= now.getTime() - 30 * 86400000;
  }
  return true;
}

export function projectMatchesStatus(
  p: Project,
  status: ProjectStatusFilter,
  toolDeliveryMap: Record<string, string>,
  partDeliveryMap: Record<string, string>
): boolean {
  if (status === 'all') return true;
  const alerts = computeProjectAlerts(p, toolDeliveryMap, partDeliveryMap);
  if (status === 'no_traveler') return !p.pdfParsed;
  if (status === 'traveler_ok') return p.pdfParsed;
  if (status === 'tool_warn') return alerts.toolingIncomplete;
  if (status === 'part_warn') return alerts.partsIncomplete;
  return true;
}

export function projectMatchesDateRange(
  p: Project,
  range: ProjectDateRangeFilter
): boolean {
  const t = getEffectiveCreatedMs(p);
  return inCreatedRange(t, range);
}

export function projectMatchesStationKey(
  p: Project,
  stationKey: string,
  stationProgressMap: Record<string, string>
): boolean {
  if (!stationKey) return true;
  const display = getCurrentStationDisplay(
    p.workOrder,
    p.pdfData?.stations,
    stationProgressMap
  );
  if (stationKey === STATION_FILTER_NONE) return !display;
  return display === stationKey;
}

function parseDeadlineMs(deadline: string): number {
  const s = (deadline || '').trim();
  if (!s || s === '未定') return Number.MAX_SAFE_INTEGER;
  const nums = s
    .split(/[\/\-\.年月日\s]+/)
    .filter(Boolean)
    .map((x) => parseInt(x, 10))
    .filter((n) => !isNaN(n));
  if (nums.length >= 3) {
    const y = nums[0] > 1000 ? nums[0] : nums[0] + 2000;
    return new Date(y, nums[1] - 1, nums[2]).getTime();
  }
  if (nums.length === 2) {
    const y = new Date().getFullYear();
    return new Date(y, nums[0] - 1, nums[1]).getTime();
  }
  return Number.MAX_SAFE_INTEGER;
}

export function sortProjects(list: Project[], mode: ProjectSortMode): Project[] {
  const copy = [...list];
  const byCreated = (a: Project, b: Project) =>
    getEffectiveCreatedMs(a) - getEffectiveCreatedMs(b);
  const byMpn = (a: Project, b: Project) =>
    (a.mpn || '').localeCompare(b.mpn || '', 'zh-Hant');
  const byWo = (a: Project, b: Project) =>
    (a.workOrder || '').localeCompare(b.workOrder || '', 'zh-Hant', {
      numeric: true,
    });
  const byDl = (a: Project, b: Project) =>
    parseDeadlineMs(a.deadline || '') - parseDeadlineMs(b.deadline || '');

  copy.sort((a, b) => {
    switch (mode) {
      case 'created_desc':
        return byCreated(b, a);
      case 'created_asc':
        return byCreated(a, b);
      case 'mpn_desc':
        return byMpn(b, a);
      case 'mpn_asc':
        return byMpn(a, b);
      case 'wo_asc':
        return byWo(a, b);
      case 'deadline_desc':
        return byDl(b, a);
      case 'deadline_asc':
        return byDl(a, b);
      default:
        return byCreated(b, a);
    }
  });
  return copy;
}

export function collectStationFilterOptions(
  projects: Project[],
  stationProgressMap: Record<string, string>
): { hasEmptyDisplay: boolean; stationLabels: string[] } {
  const stationLabels = new Set<string>();
  let hasEmptyDisplay = false;
  for (const p of projects) {
    const d = getCurrentStationDisplay(
      p.workOrder,
      p.pdfData?.stations,
      stationProgressMap
    );
    if (!d) hasEmptyDisplay = true;
    else stationLabels.add(d);
  }
  return {
    hasEmptyDisplay,
    stationLabels: Array.from(stationLabels).sort((a, b) =>
      a.localeCompare(b, 'zh-Hant')
    ),
  };
}

export function collectUniqueField(
  projects: Project[],
  pick: (p: Project) => string | undefined
): string[] {
  const s = new Set<string>();
  for (const p of projects) {
    const v = (pick(p) || '').trim();
    if (v) s.add(v);
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
}
