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
}

export interface StationExcelImport {
  stationByWorkOrder: Record<string, string>;
  wipByWorkOrder: Record<string, WipSnapshot>;
}

/** 第 9 欄（1-based）：生產中狀態 (IPQC)，與範例 WIP.xls、location.md 一致 */
const WIP_IPQC_COL_0 = 8;

/** 第 17 欄（1-based）：在站時數(hr)；若表頭名稱不符則回退此索引 */
const WIP_HOURS_AT_STATION_COL_0 = 16;

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
      };

      const prevSnap = wipByWorkOrder[wo];
      wipByWorkOrder[wo] = prevSnap ? mergeWipSnapshots(prevSnap, snap) : snap;
    }
  });

  return { stationByWorkOrder, wipByWorkOrder };
}
