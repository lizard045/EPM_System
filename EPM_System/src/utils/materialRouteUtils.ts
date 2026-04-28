/**
 * WIP「在站製程名」與手順書(材)站點比對、材料完工站判斷
 */

import type { WipSnapshot } from '../parsers/excelParser';
import type { MaterialRouteGroup, StationItem } from '../types';
import { findMatchingPdfStation } from './stationUtils';

export function isMaterialCompletionStation(st: StationItem): boolean {
  const n = String(st.name ?? '').trim();
  return n.includes('材料完工站');
}

export interface MaterialWipResolution {
  wipProcessRaw: string;
  matchedStation: StationItem | null;
  matchedSegmentCode: string | null;
  isCompletion: boolean;
}

function formatStationLine(s: StationItem): string {
  const c = String(s.code ?? '').trim();
  const n = String(s.name ?? '').trim();
  return c ? (n && n !== c ? `${c} ${n}` : c) : n;
}

/** 卡片／標籤用：工程碼 + 製程名（無對應站點時為 null） */
export function formatMaterialStationDisplay(res: MaterialWipResolution): string | null {
  if (!res.matchedStation) return null;
  return formatStationLine(res.matchedStation);
}

/**
 * 以 WIP「在站製程名」在 手順書(材) 各段中尋找對應站點；若為材料完工站則 isCompletion。
 */
export function resolveMaterialWipAgainstRoutes(
  wip: WipSnapshot | undefined,
  routes: MaterialRouteGroup[] | undefined
): MaterialWipResolution {
  const raw = String(wip?.atStationProcessName ?? '').trim();
  const list = routes ?? [];

  if (!raw || list.length === 0) {
    return {
      wipProcessRaw: raw,
      matchedStation: null,
      matchedSegmentCode: null,
      isCompletion: false,
    };
  }

  for (const g of list) {
    const m = findMatchingPdfStation(raw, g.stations);
    if (m) {
      return {
        wipProcessRaw: raw,
        matchedStation: m,
        matchedSegmentCode: g.segmentCode,
        isCompletion: isMaterialCompletionStation(m),
      };
    }
  }

  return {
    wipProcessRaw: raw,
    matchedStation: null,
    matchedSegmentCode: null,
    isCompletion: false,
  };
}

