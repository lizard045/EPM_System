/**
 * Excel 檔案解析 (工具交期、零件備料、站點進度)
 */

import * as XLSX from 'xlsx';

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

/** 解析站點進度 Excel */
export function parseStationExcel(buffer: ArrayBuffer): Record<string, string> {
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const result: Record<string, string> = {};

  wb.SheetNames.forEach((sheetName) => {
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName], {
      defval: '',
    });
    data.forEach((row) => {
      const woKey = Object.keys(row).find((k) => k === '工單');
      const stKey = Object.keys(row).find((k) => k === '工程站');
      if (woKey && stKey && row[woKey]) {
        result[String(row[woKey]).trim()] = String(row[stKey]).trim();
      }
    });
  });

  return result;
}
