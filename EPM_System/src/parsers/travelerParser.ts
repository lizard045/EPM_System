/**
 * Traveler 手順書 Excel 解析
 */

import * as XLSX from 'xlsx';
import type { MaterialRouteGroup, PdfData } from '../types';

const MATERIAL_SECTION_RE = /^([A-Z]\d{2,3}):\s*(.*)$/;
/** 工程代碼如 L314-16、L430-01（手順書(材)第 2 欄） */
const MATERIAL_ENGINEERING_CODE_RE = /^[A-Z]\d{3}-\d{2}(?:-[A-Za-z0-9]+)?$/;

/**
 * 解析「手順書(材)」：製程段（F03、P04…）及各段站點（含材料完工站）。
 */
export function parseTravelerMaterialRoutes(wb: XLSX.WorkBook): MaterialRouteGroup[] {
  const sheetName = wb.SheetNames.find((n) => /^手順書\(材\)/.test(n));
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
    header: 1,
    defval: '',
  });

  const groups: MaterialRouteGroup[] = [];
  let cur: MaterialRouteGroup | null = null;

  const pushCur = () => {
    if (cur && cur.stations.length > 0) {
      groups.push(cur);
    }
    cur = null;
  };

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const col0 = String(row[0] ?? '').trim();
    const col1 = String(row[1] ?? '').trim().replace(/\s+/g, '');
    const col2 = String(row[2] ?? '').trim();

    const sec = col0.match(MATERIAL_SECTION_RE);
    if (sec) {
      pushCur();
      cur = {
        segmentCode: sec[1],
        titleLine: col0,
        stations: [],
      };
      continue;
    }

    if (!cur) continue;

    const isCompletionRow =
      col0 === '材料完工站' || col2 === '材料完工站';
    const hasEngineeringCode = MATERIAL_ENGINEERING_CODE_RE.test(col1);

    if (hasEngineeringCode || isCompletionRow) {
      if (!col1 && !col2) continue;
      const code = col1;
      const name =
        col2 ||
        (isCompletionRow ? col0 || '材料完工站' : '');
      if (code || name) {
        cur.stations.push({
          code,
          name: name || code,
        });
      }
    }
  }

  pushCur();
  return groups;
}

/**
 * 從 Traveler Excel 解析出 parts, jigs, consumables, stations
 */
export function parseTravelerExcel(buffer: ArrayBuffer): {
  data: PdfData;
  excelItemNo: string;
} {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const materialRoutes = parseTravelerMaterialRoutes(wb);
  const jigs: PdfData['jigs'] = [];
  const parts: PdfData['parts'] = [];
  const consumables: PdfData['consumables'] = [];
  const stations: PdfData['stations'] = [];
  const seenStationCodes = new Set<string>();
  const seenMaterialIds = new Set<string>();

  // 手順書(主) - 站點與模治具
  const procSheetNames = wb.SheetNames.filter((n) => /^手順書\(主\)/.test(n));
  for (const sheetName of procSheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
    for (let r = 5; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const col1 = String(row[1] ?? '').trim();
      const col2 = String(row[2] ?? '').trim();
      const col6 = String(row[6] ?? '').trim();

      if (/^[A-Z]\d{3}-\d{2}$/.test(col1) && col2 && !seenStationCodes.has(col1)) {
        seenStationCodes.add(col1);
        stations.push({ code: col1, name: col2 });
      }

      if (['穴拔(形狀)', '裁斷拔(形狀)', '自動印刷'].includes(col2) && col6) {
        const codes = col6.split(/\r?\n/).map((c) => c.trim()).filter((c) => /^ZT/.test(c));
        if (codes.length) {
          jigs.push({ station: col2, code: codes.join('\n') });
        }
      }
    }
  }

  // 手順書(BOM) - 零件與補材
  const bomSheetNames = wb.SheetNames.filter((n) => /^手順書\(BOM\)/.test(n));
  for (const sheetName of bomSheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' });
    for (let r = 5; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const col0 = String(row[0] ?? '').trim();
      const col1 = String(row[1] ?? '').trim();
      const col3 = row[3];
      const code = String(col3 !== undefined && col3 !== null ? col3 : '').trim();

      if (/^T\d+/.test(col0)) {
        if (!seenMaterialIds.has('P:' + col0)) {
          seenMaterialIds.add('P:' + col0);
          if (/^\d{7,10}$/.test(code)) {
            parts.push({ id: col0, name: col1, code });
          }
        }
      } else if (col1.includes('購入部品') && code) {
        if (!seenMaterialIds.has('C:' + col0)) {
          seenMaterialIds.add('C:' + col0);
          consumables.push({ name: col1, code });
        }
      }
    }
  }

  // 找出 Excel 品目番號
  let excelItemNo = '';
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
    for (let r = 0; r < Math.min(6, rows.length); r++) {
      const row = rows[r] ?? [];
      for (let c = 0; c < row.length; c++) {
        const v = String(row[c] ?? '');
        if (/^[A-Z]{2}\d{4}-\d{2}[A-Z]?$/.test(v)) {
          excelItemNo = v;
          break;
        }
      }
      if (excelItemNo) break;
    }
    if (excelItemNo) break;
  }

  return {
    data: { jigs, parts, consumables, stations, materialRoutes },
    excelItemNo,
  };
}
