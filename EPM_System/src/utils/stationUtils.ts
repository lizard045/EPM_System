/**
 * 站點比對與顯示邏輯
 */

import type { StationItem } from '../types';

/**
 * 匯入表與傳票工單比對用：隱藏字元、全形字元 NFKC、大寫（與 parseStationExcel 鍵一致）。
 */
export function normalizeWorkOrderKey(workOrder: string | undefined): string {
  return String(workOrder ?? '')
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '')
    .normalize('NFKC')
    .trim()
    .toUpperCase();
}

/**
 * 以工單查詢匯入表；相容大小寫、全形字元、Excel 數字格式。
 */
export function lookupWorkOrderMap<T>(
  map: Record<string, T>,
  workOrder: string | undefined
): T | undefined {
  const raw = String(workOrder ?? '').trim();
  if (!raw) return undefined;
  if (Object.prototype.hasOwnProperty.call(map, raw)) return map[raw];
  const up = raw.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(map, up)) return map[up];
  const low = raw.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(map, low)) return map[low];
  const n = Number(raw.replace(/,/g, ''));
  if (!isNaN(n) && Number.isFinite(n)) {
    const asInt = String(Math.trunc(n));
    if (Object.prototype.hasOwnProperty.call(map, asInt)) return map[asInt];
  }
  const norm = normalizeWorkOrderKey(workOrder);
  if (norm && Object.prototype.hasOwnProperty.call(map, norm)) return map[norm];
  return undefined;
}

/**
 * 從 WIP 站點字串找出對應的 PDF 站點
 */
export function findMatchingPdfStation(
  wipStation: string,
  pdfStations: StationItem[] | undefined
): StationItem | null {
  if (!wipStation || !pdfStations?.length) return null;

  const w = String(wipStation).trim();
  const codePrefix = w.match(/\(([^)]+)\)/)?.[1] ?? '';

  for (const s of pdfStations) {
    const code = String(s.code ?? '').trim();
    const name = String(s.name ?? '').trim();
    const codeBase = code ? code.split('-')[0] : '';

    if (
      w.includes(code) ||
      w.includes(name) ||
      w.includes(codeBase) ||
      (codePrefix && (code.includes(codePrefix) || codeBase === codePrefix))
    ) {
      return s;
    }
  }
  return null;
}

/** WIP：先「在站製程名」再「工程站」，與手順書站序／生產進度條一致 */
export function matchWipToTravelerStation(
  wip: { atStationProcessName?: string; engineeringStation?: string },
  pdfStations: StationItem[] | undefined
): StationItem | null {
  if (!pdfStations?.length) return null;
  const processName = String(wip.atStationProcessName ?? '').trim();
  const eng = String(wip.engineeringStation ?? '').trim();
  if (processName) {
    const m = findMatchingPdfStation(processName, pdfStations);
    if (m) return m;
  }
  if (eng) {
    return findMatchingPdfStation(eng, pdfStations);
  }
  return null;
}

function formatStationItemDisplay(matched: StationItem): string {
  const codePart = matched.code ?? '';
  const namePart = matched.name ?? '';
  return codePart ? (namePart ? `${codePart} ${namePart}` : codePart) : namePart;
}

/**
 * 取得目前站點顯示文字。
 * 若有 WIP 快照，優先依「在站製程名／工程站」對手順書（與生產進度相同）。
 * 工單未填時，若有 WIP 快照（例如依料號對到），改用快照內工程站字串。
 */
export function getCurrentStationDisplay(
  workOrder: string | undefined,
  pdfStations: StationItem[] | undefined,
  stationProgressMap: Record<string, string>,
  wipSnapshot?: { atStationProcessName?: string; engineeringStation?: string } | null
): string {
  const wo = String(workOrder ?? '').trim();
  const hasStationMap = Object.keys(stationProgressMap).length > 0;

  let wipStation: string | undefined;
  if (wo) {
    if (!hasStationMap) return '';
    wipStation = lookupWorkOrderMap(stationProgressMap, workOrder);
  } else if (wipSnapshot) {
    wipStation = String(wipSnapshot.engineeringStation ?? '').trim() || undefined;
    if (!wipStation && !hasStationMap) return '';
  } else {
    return '';
  }

  if (wipStation === undefined || wipStation === '') {
    if (wo) return '工單錯誤';
    return '';
  }

  if (pdfStations?.length) {
    if (wipSnapshot) {
      const byWip = matchWipToTravelerStation(wipSnapshot, pdfStations);
      if (byWip) return formatStationItemDisplay(byWip);
    }
    const matched = findMatchingPdfStation(wipStation, pdfStations);
    if (matched) {
      return formatStationItemDisplay(matched);
    }
    return '工單錯誤';
  }

  return wipStation;
}
