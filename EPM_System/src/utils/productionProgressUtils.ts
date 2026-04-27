/**
 * 生產進度：WIP 表 + 手順書站點數
 */

import type { WipSnapshot } from '../parsers/excelParser';
import type { Project } from '../types';
import { findMatchingPdfStation, matchWipToTravelerStation } from './stationUtils';

export type ProductionStepperIndex = 0 | 1 | 2;

export interface ProductionProgressViewModel {
  /** 手順書內目前站序（1-based）；與總站數同座標系 */
  currentStep: number;
  totalSteps: number;
  percent: number;
  startDateDisplay: string;
  endDateDisplay: string;
  processName: string;
  hoursDisplay: string;
  ipqcStatus: string;
  /**
   * standard：WIP 第 9 欄可對應「待投入／生產中／產出待移出」三階（含 (TR)待移轉＝產出待移出）；
   * override：非上列三階之狀態，僅以 ipqcStatus 原文呈現，不顯示三階條。
   */
  ipqcUiMode: 'standard' | 'override';
  /** 僅 standard 有效：0=待投入、1=生產中、2=產出待移出（(TR)待移轉 亦為 2） */
  ipqcStandardStep: 0 | 1 | 2 | null;
  hasTotalFromTraveler: boolean;
  /**
   * 已用手順書站點清單比對 WIP（在站製程名／工程站）成功，百分比與「目前/總站數」才有效。
   * WIP「在站步驟」為 MES 全系統序號，不可與手順書站數相除。
   */
  travelerProgressMatched: boolean;
}

function parseStepNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const n = parseInt(String(raw).replace(/[^\d]/g, ''), 10);
  return !isNaN(n) && n >= 0 ? n : 0;
}

/** 傳票開立（左）／交期（右），與附圖相同為 MM/DD */
export function formatMonthDayDisplay(value: string | undefined): string {
  if (!value || !String(value).trim()) return '—';
  const s = String(value).trim();
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}`;
  }
  const parts = s.split(/[\/\-\sT]/).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    const day = parseInt(last, 10);
    const month = parseInt(secondLast, 10);
    if (!isNaN(month) && !isNaN(day) && month >= 1 && month <= 12) {
      return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    }
  }
  return s.length > 8 ? s.slice(0, 10) : s;
}

function normalizeIpqcForStepper(ipqc: string): string {
  return String(ipqc ?? '')
    .replace(/[\uFEFF\u200B-\u200D\u2060]/g, '')
    .normalize('NFKC')
    .trim()
    .replace(/（/g, '(')
    .replace(/）/g, ')');
}

/**
 * 依 WIP 第 9 欄 (IPQC) 決定 UI：
 * - standard + step：可對三階段（(TR)待移轉 ＝ 產出待移出＝第 3 階）；
 * - override：(QH)(OS) 等不屬三階者，以原文覆蓋、不顯示三階條。
 */
export function resolveIpqcUi(
  ipqc: string
): { mode: 'standard'; step: 0 | 1 | 2 } | { mode: 'override' } {
  const t = normalizeIpqcForStepper(ipqc);
  if (!t) return { mode: 'override' };

  if (/\(TR\)待移轉/.test(t)) {
    return { mode: 'standard', step: 2 };
  }
  if (/\(SI\)待投入/.test(t)) {
    return { mode: 'standard', step: 0 };
  }
  if (/\(SI\)/.test(t) && t.includes('待投入')) {
    return { mode: 'standard', step: 0 };
  }
  if (t.includes('待投入') && !t.includes('待生產') && !t.includes('待移轉')) {
    return { mode: 'standard', step: 0 };
  }

  if (/\(SO\)產出待移出/.test(t) || (t.includes('產出') && t.includes('移出'))) {
    return { mode: 'standard', step: 2 };
  }

  if (/\(RN\)生產中/.test(t)) {
    return { mode: 'standard', step: 1 };
  }
  if (/\(HD\)/.test(t) && t.includes('暫停')) {
    return { mode: 'standard', step: 1 };
  }
  if (/\(SB\)待生產/.test(t)) {
    return { mode: 'standard', step: 1 };
  }

  if (/\(QH\)/.test(t) || /暫定Hold|IPQC暫定/i.test(t)) {
    return { mode: 'override' };
  }
  if (/\(OS\)/.test(t)) {
    return { mode: 'override' };
  }

  return { mode: 'override' };
}

/** @deprecated 請用 resolveIpqcUi + ipqcUiMode */
export function ipqcToStepperIndex(ipqc: string): ProductionStepperIndex | null {
  const r = resolveIpqcUi(ipqc);
  if (r.mode === 'override') return null;
  return r.step;
}

export function buildProductionProgressViewModel(
  project: Project,
  wip: WipSnapshot | undefined
): ProductionProgressViewModel | null {
  if (!wip) return null;

  const stations = project.pdfData?.stations;
  const totalSteps = stations?.length ?? 0;
  const hasTotalFromTraveler = totalSteps > 0;

  let travelerProgressMatched = false;
  let currentStep = 0;
  let percent = 0;

  if (hasTotalFromTraveler && stations) {
    const matched = matchWipToTravelerStation(wip, stations);
    if (matched) {
      travelerProgressMatched = true;
      currentStep = stations.indexOf(matched) + 1;
      percent = Math.min(100, Math.round((currentStep / totalSteps) * 100));
    }
  } else {
    const fromAtStep = parseStepNumber(wip.atStationStep);
    const fromDone = parseStepNumber(wip.completedStepCount);
    currentStep = fromAtStep > 0 ? fromAtStep : fromDone;
  }

  const ipqcRaw = wip.ipqcStatus || '—';
  const ipqcUi = resolveIpqcUi(String(wip.ipqcStatus ?? ''));
  const ipqcUiMode = ipqcUi.mode;
  const ipqcStandardStep = ipqcUi.mode === 'standard' ? ipqcUi.step : null;

  return {
    currentStep,
    totalSteps: hasTotalFromTraveler ? totalSteps : Math.max(currentStep, 0),
    percent,
    startDateDisplay: formatMonthDayDisplay(project.createdAt),
    endDateDisplay: formatMonthDayDisplay(project.deadline),
    processName: wip.atStationProcessName || '—',
    hoursDisplay: wip.hoursAtStationDisplay || '—',
    ipqcStatus: ipqcRaw,
    ipqcUiMode,
    ipqcStandardStep,
    hasTotalFromTraveler,
    travelerProgressMatched,
  };
}

/**
 * 僅有站點表工程站字串、尚無 WIP 快照時：用手順書站點順序推算進度條（與卡片「目前站點」同源）。
 */
export function buildProductionProgressFromEngineeringStationOnly(
  project: Project,
  engineeringStation: string
): ProductionProgressViewModel | null {
  const eng = String(engineeringStation ?? '').trim();
  if (!eng) return null;

  const stations = project.pdfData?.stations;
  const hasTotalFromTraveler = Boolean(stations?.length);
  let currentStep = 0;
  let travelerProgressMatched = false;
  if (stations?.length) {
    const matched = findMatchingPdfStation(eng, stations);
    if (matched) {
      travelerProgressMatched = true;
      currentStep = stations.indexOf(matched) + 1;
    }
  }

  const totalSteps = stations?.length ?? 0;
  const percent =
    travelerProgressMatched && totalSteps > 0
      ? Math.min(100, Math.round((currentStep / totalSteps) * 100))
      : 0;

  return {
    currentStep,
    totalSteps: hasTotalFromTraveler ? totalSteps : 0,
    percent,
    startDateDisplay: formatMonthDayDisplay(project.createdAt),
    endDateDisplay: formatMonthDayDisplay(project.deadline),
    processName: eng,
    hoursDisplay: '—',
    ipqcStatus: '—',
    ipqcUiMode: 'override',
    ipqcStandardStep: null,
    hasTotalFromTraveler,
    travelerProgressMatched,
  };
}
