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
