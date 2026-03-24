/**
 * 站點比對與顯示邏輯
 */

import type { StationItem } from '../types';

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

/**
 * 取得目前站點顯示文字
 */
export function getCurrentStationDisplay(
  workOrder: string | undefined,
  pdfStations: StationItem[] | undefined,
  stationProgressMap: Record<string, string>
): string {
  if (!workOrder || !String(workOrder).trim()) return '';
  if (Object.keys(stationProgressMap).length === 0) return '';

  const wo = String(workOrder).trim();
  const wipStation = stationProgressMap[wo];

  if (wipStation === undefined || wipStation === '') return '工單錯誤';

  if (pdfStations?.length) {
    const matched = findMatchingPdfStation(wipStation, pdfStations);
    if (matched) {
      const codePart = matched.code ?? '';
      const namePart = matched.name ?? '';
      return codePart ? (namePart ? `${codePart} ${namePart}` : codePart) : namePart;
    }
    return '工單錯誤';
  }

  return wipStation;
}
