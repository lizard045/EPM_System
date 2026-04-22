/**
 * Excel 檔案解析 (工具交期、零件備料、站點進度)
 */

import * as XLSX from 'xlsx';
import { normalizeWorkOrderKey } from '../utils/stationUtils';

/** 解析工具交期 Excel */
export function parseToolDeliveryExcel(buffer: ArrayBuffer): Record<string, string> {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const result: Record<string, string> = {};

  wb.SheetNames.forEach((sheetName) => {
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      defval: '',
    });
    data.forEach((row) => {
      const it = Object.keys(row).find((k) => k.includes('品目'));
      const de = Object.keys(row).find((k) => k.includes('交期'));
      if (it && de && row[it]) {
        let d = row[de];
        if (typeof d === 'number' && d > 40000) {
          const dt = new Date((d - 25569) * 86400 * 1000);
          d = `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
        }
        result[String(row[it]).trim().toUpperCase()] = String(d ?? '');
      }
    });
  });

  return result;
}

/** 解析零件備料 Excel */
export function parsePartDeliveryExcel(buffer: ArrayBuffer): Record<string, string> {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const result: Record<string, string> = {};

  wb.SheetNames.forEach((sheetName) => {
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName]);
    data.forEach((row) => {
      const no = Object.keys(row).find((k) => k.includes('傳票號碼'));
      const pr = Object.keys(row).find((k) => k.includes('進度'));
      if (no && pr && row[no]) {
        result[String(row[no]).trim().toUpperCase()] = String(row[pr] ?? '');
      }
    });
  });

  return result;
}

/** 將儲存格轉成採購交期顯示字串（空則回傳空字串） */
function cellToDeliveryString(cell: unknown): string {
  if (cell === undefined || cell === null) return '';
  if (typeof cell === 'number' && !isNaN(cell) && cell > 40000) {
    const dt = new Date((cell - 25569) * 86400 * 1000);
    return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
  }
  const s = String(cell).trim();
  return s;
}

/** 需求：第四欄 LOT NO、第十二欄採購交期；範例檔「請購新增缺料表1」中 LOT NO 在 E 欄（第 5 欄）、採購交期在 L 欄（第 12 欄）。 */
const MATERIAL_LOT_COL_1BASED = 5;
const MATERIAL_PO_COL_1BASED = 12;
/** 第 8 欄材料料號（H 欄），與 Traveler 補材 code 比對 */
const MATERIAL_PART_NO_COL_1BASED = 8;

/** 只解析「請購新增／新增缺料」主表；其餘工作表欄位配置不同，掃描會誤對料號或交期 */
function shouldParseMaterialLotSheet(sheetName: string): boolean {
  if (!/(請購新增|新增缺料)/.test(sheetName)) return false;
  if (/已入料|取消結案/.test(sheetName)) return false;
  return true;
}

/**
 * 解析新原物料異常／補材紀錄 Excel：LOT NO（第 5 欄 E）、採購交期（第 12 欄 L）。
 * 同列材料料號（第 8 欄）亦寫入同一交期，供與手順書補材編號比對。
 * 表內有該 LOT／料號但交期空白時，值為空字串（供 UI 顯示警示）。
 */
export function parseMaterialLotDeliveryExcel(buffer: ArrayBuffer): Record<string, string> {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const result: Record<string, string> = {};

  const lotIdx = MATERIAL_LOT_COL_1BASED - 1;
  const dateIdx = MATERIAL_PO_COL_1BASED - 1;
  const partNoIdx = MATERIAL_PART_NO_COL_1BASED - 1;

  const isInvalidLot = (lot: string) =>
    !lot || /^NA$/i.test(lot) || lot === 'N/A' || lot === '—' || lot === '-';

  const assignKeys = (delivery: string, lotRaw: string, partNoRaw: unknown) => {
    if (!isInvalidLot(lotRaw)) {
      result[lotRaw.toUpperCase()] = delivery;
    }
    const part = String(partNoRaw ?? '')
      .trim()
      .replace(/\.0+$/, '');
    if (part && part !== 'NA' && part !== 'N/A') {
      const pk = part.toUpperCase();
      // 同料號可能出現在「請購新增」與「已入料／結案」等多張表，後面表勿覆寫前面已建立的交期
      if (!(pk in result)) {
        result[pk] = delivery;
      }
    }
  };

  wb.SheetNames.forEach((sheetName) => {
    if (!shouldParseMaterialLotSheet(sheetName)) return;

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
      header: 1,
      defval: '',
    });

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] ?? [];
      if (row.length <= dateIdx) continue;

      const lotRaw = String(row[lotIdx] ?? '').trim();
      const partNoRaw = row.length > partNoIdx ? row[partNoIdx] ?? '' : '';
      const delivery = cellToDeliveryString(row[dateIdx]);

      if (isInvalidLot(lotRaw) && !String(partNoRaw).trim()) continue;

      if (/^LOT\s*NO$/i.test(lotRaw)) continue;

      assignKeys(delivery, lotRaw, partNoRaw);
    }
  });

  return result;
}

/** WIP／目前站點表：單筆工單快照（欄位對應見 location.md） */
export interface WipSnapshot {
  engineeringStation: string;
  hoursAtStationDisplay: string;
  atStationProcessName: string;
  completedStepCount: string;
  atStationStep: string;
  ipqcStatus: string;
  /** 第 4 欄 料號（與傳票品目比對，工單未填時仍可對到 WIP） */
  partNo: string;
  /** 第 5 欄 目標量（投料目標量），出貨安全率橫軸右端 */
  targetFeedQty: string;
  /** 第 6 欄 張數（補投 pnl 換算用） */
  sheetCount: string;
  /** 第 21 欄 Pcs（目前在站數量） */
  wipPcs: string;
}

/** 舊版 localStorage 可能缺少出貨安全率欄位 */
export function normalizeWipSnapshot(raw: Partial<WipSnapshot> | undefined): WipSnapshot {
  return {
    engineeringStation: String(raw?.engineeringStation ?? '').trim(),
    hoursAtStationDisplay: String(raw?.hoursAtStationDisplay ?? '').trim(),
    atStationProcessName: String(raw?.atStationProcessName ?? '').trim(),
    completedStepCount: String(raw?.completedStepCount ?? '').trim(),
    atStationStep: String(raw?.atStationStep ?? '').trim(),
    ipqcStatus: String(raw?.ipqcStatus ?? '').trim(),
    partNo: String(raw?.partNo ?? '').trim(),
    targetFeedQty: String(raw?.targetFeedQty ?? '').trim(),
    sheetCount: String(raw?.sheetCount ?? '').trim(),
    wipPcs: String(raw?.wipPcs ?? '').trim(),
  };
}

export interface StationExcelImport {
  stationByWorkOrder: Record<string, string>;
  wipByWorkOrder: Record<string, WipSnapshot>;
}

/** 第 9 欄（1-based）：生產中狀態 (IPQC)，與範例 WIP.xls、location.md 一致 */
const WIP_IPQC_COL_0 = 8;

/** 第 17 欄（1-based）：在站時數(hr)；若表頭名稱不符則回退此索引 */
const WIP_HOURS_AT_STATION_COL_0 = 16;

/** 第 4 欄（1-based）：料號 */
const WIP_PART_NO_COL_0 = 3;
/** 第 5 欄（1-based）：目標量 */
const WIP_TARGET_FEED_COL_0 = 4;
/** 第 6 欄（1-based）：張數 */
const WIP_SHEET_COUNT_COL_0 = 5;
/** 第 21 欄（1-based）：Pcs */
const WIP_PCS_COL_0 = 20;

function formatHoursAtStationCell(v: unknown): string {
  if (v === '' || v === undefined || v === null) return '';
  if (typeof v === 'number' && !isNaN(v)) {
    const rounded = Math.round(v * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${text} hr`;
  }
  const raw = String(v).trim().replace(/,/g, '');
  const n = parseFloat(raw);
  if (!isNaN(n) && raw !== '') {
    const rounded = Math.round(n * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${text} hr`;
  }
  return raw ? (/hr/i.test(raw) ? raw : `${raw} hr`) : '';
}

function headerRowToIndex(headerRow: unknown[]): Record<string, number> {
  const m: Record<string, number> = {};
  headerRow.forEach((cell, i) => {
    const k = String(cell ?? '').trim();
    if (k) m[k] = i;
  });
  return m;
}

function pickCol(
  row: unknown[],
  headerIndex: Record<string, number>,
  names: string[],
  fallback0: number
): unknown {
  for (const name of names) {
    const i = headerIndex[name];
    if (i !== undefined && row.length > i) return row[i];
  }
  return row.length > fallback0 ? row[fallback0] : '';
}

/** 生產中狀態以第 9 欄實體位置為準；欄位不足時再以表頭名稱回退 */
function readWipIpqcCell(row: unknown[], headerIndex: Record<string, number>): string {
  const byIndex =
    row.length > WIP_IPQC_COL_0 ? String(row[WIP_IPQC_COL_0] ?? '').trim() : '';
  if (byIndex) return byIndex;
  return String(
    pickCol(
      row,
      headerIndex,
      [
        '生產中狀態 (IPQC)',
        '生產中狀態(IPQC)',
        '生產中狀態',
      ],
      WIP_IPQC_COL_0
    ) ?? ''
  ).trim();
}

/** 僅接受純數量字串，避免「2D」等工作表欄位錯位把 IPQC 文字寫進目標量／張數 */
function looksLikeNonNegativeQtyCell(s: string): boolean {
  const t = String(s ?? '')
    .trim()
    .replace(/,/g, '');
  if (!t) return false;
  return /^\d+(?:\.\d+)?$/.test(t);
}

function pickQtyMerge(existing: string, incoming: string): string {
  const bt = String(incoming ?? '').trim();
  if (!bt) return existing;
  if (!looksLikeNonNegativeQtyCell(bt)) return existing;
  return bt;
}

function mergeWipSnapshots(exists: WipSnapshot, incoming: WipSnapshot): WipSnapshot {
  const pick = (a: string, b: string) => {
    const bt = String(b ?? '').trim();
    return bt ? b : a;
  };
  return {
    engineeringStation: pick(exists.engineeringStation, incoming.engineeringStation),
    hoursAtStationDisplay: pick(exists.hoursAtStationDisplay, incoming.hoursAtStationDisplay),
    atStationProcessName: pick(exists.atStationProcessName, incoming.atStationProcessName),
    completedStepCount: pick(exists.completedStepCount, incoming.completedStepCount),
    atStationStep: pick(exists.atStationStep, incoming.atStationStep),
    ipqcStatus: pick(exists.ipqcStatus, incoming.ipqcStatus),
    partNo: pick(exists.partNo, incoming.partNo),
    targetFeedQty: pickQtyMerge(exists.targetFeedQty, incoming.targetFeedQty),
    sheetCount: pickQtyMerge(exists.sheetCount, incoming.sheetCount),
    wipPcs: pickQtyMerge(exists.wipPcs, incoming.wipPcs),
  };
}

/** 再次匯入 WIP 時合併同工單，避免空列覆蓋既有 IPQC／在站時數 */
export function mergeWipByWorkOrderInto(
  prev: Record<string, WipSnapshot>,
  incoming: Record<string, WipSnapshot>
): Record<string, WipSnapshot> {
  const next = { ...prev };
  for (const [wo, snap] of Object.entries(incoming)) {
    const ex = next[wo];
    next[wo] = ex ? mergeWipSnapshots(ex, snap) : snap;
  }
  return next;
}

/**
 * 解析目前站點／WIP Excel：工程站對照 + 工單快照（含第 17 欄在站時數）。
 */
export function parseStationExcel(buffer: ArrayBuffer): StationExcelImport {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const stationByWorkOrder: Record<string, string> = {};
  const wipByWorkOrder: Record<string, WipSnapshot> = {};

  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
      header: 1,
      defval: '',
    });
    if (!rows.length) return;

    const headerIndex = headerRowToIndex(rows[0] ?? []);
    /** 「Data」主表才有目標量／張數等；「2D」等欄位順序不同，勿寫入 WIP 快照以免覆蓋正確數值 */
    const canParseWipSnapshot =
      headerIndex['目標量'] !== undefined ||
      headerIndex['投料目標量'] !== undefined ||
      headerIndex['張數'] !== undefined;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const woRaw = pickCol(row, headerIndex, ['工單'], 2);
      const wo = normalizeWorkOrderKey(String(woRaw ?? ''));
      if (!wo) continue;

      const engStation = String(
        pickCol(row, headerIndex, ['工程站'], 9) ?? ''
      ).trim();

      if (engStation) {
        stationByWorkOrder[wo] = engStation;
      }

      if (!canParseWipSnapshot) continue;

      const hoursRaw = pickCol(
        row,
        headerIndex,
        ['在站時數(hr)', '在站時數（hr）', '在站時數', '在站時數(Hr)'],
        WIP_HOURS_AT_STATION_COL_0
      );

      const snap: WipSnapshot = {
        engineeringStation: engStation,
        hoursAtStationDisplay: formatHoursAtStationCell(hoursRaw),
        atStationProcessName: String(
          pickCol(row, headerIndex, ['在站製程名'], 14) ?? ''
        ).trim(),
        completedStepCount: String(
          pickCol(row, headerIndex, ['已完工步驟'], 11) ?? ''
        ).trim(),
        atStationStep: String(
          pickCol(row, headerIndex, ['在站步驟'], 13) ?? ''
        ).trim(),
        ipqcStatus: readWipIpqcCell(row, headerIndex),
        partNo: String(
          pickCol(row, headerIndex, ['料號', '品目', '品目番號'], WIP_PART_NO_COL_0) ?? ''
        ).trim(),
        targetFeedQty: String(
          pickCol(row, headerIndex, ['目標量', '投料目標量'], WIP_TARGET_FEED_COL_0) ?? ''
        ).trim(),
        sheetCount: String(
          pickCol(row, headerIndex, ['張數'], WIP_SHEET_COUNT_COL_0) ?? ''
        ).trim(),
        wipPcs: String(
          pickCol(row, headerIndex, ['Pcs', 'PCS', '目前Pcs', '目前 PCS'], WIP_PCS_COL_0) ??
            ''
        ).trim(),
      };

      const prevSnap = wipByWorkOrder[wo];
      wipByWorkOrder[wo] = prevSnap ? mergeWipSnapshots(prevSnap, snap) : snap;
    }
  });

  return { stationByWorkOrder, wipByWorkOrder };
}
