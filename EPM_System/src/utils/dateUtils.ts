/**
 * 日期相關工具函數
 */

/** 判斷日期是否為未來日期 (尚未到) */
export function isFutureDate(dateStr: string | number | null | undefined): boolean {
  if (!dateStr) return false;

  if (typeof dateStr === 'number' && !isNaN(dateStr) && dateStr > 40000) {
    const targetDate = new Date((dateStr - 25569) * 86400 * 1000);
    return targetDate > new Date();
  }

  const str = String(dateStr);
  const keywords = ['待', '尚未', '確認', '取消'];
  if (keywords.some((k) => str.includes(k))) return true;

  const parts = str.split(/[\/\-]/);
  if (parts.length < 2) return false;

  const y = parts.length === 3 ? parseInt(parts[0], 10) : new Date().getFullYear();
  const m = parseInt(parts[parts.length - 2], 10);
  const d = parseInt(parts[parts.length - 1], 10);
  const year = y < 100 ? y + 2000 : y;

  return new Date(year, m - 1, d) > new Date();
}

/** 將 Excel 序號轉為可顯示的日期字串 */
export function fixDateDisplay(val: string | number | null | undefined): string {
  if (!val) return '';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (!isNaN(num) && num > 40000) {
    const d = new Date((num - 25569) * 86400 * 1000);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }
  return String(val);
}
