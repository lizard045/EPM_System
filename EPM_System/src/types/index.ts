/**
 * EPM 專案戰情室 - 全域類型定義
 */

/** 專案傳票 */
export interface Project {
  id: number;
  formNo: string;
  mpn: string;
  qty: string;
  deadline: string;
  workOrder: string;
  pdfParsed: boolean;
  pdfData: PdfData | null;
  isArchived: boolean;
}

/** 手順書解析後的資料結構 */
export interface PdfData {
  jigs: JigItem[];
  parts: PartItem[];
  consumables: ConsumableItem[];
  stations: StationItem[];
}

/** 模治具項目 */
export interface JigItem {
  station: string;
  code: string;
}

/** 零件項目 (T開頭) */
export interface PartItem {
  id: string;
  name: string;
  code: string;
}

/** 補材項目 */
export interface ConsumableItem {
  name: string;
  code: string;
}

/** 製程站點 */
export interface StationItem {
  code: string;
  name: string;
}

/** 專案預警狀態 */
export interface ProjectAlerts {
  toolingIncomplete: boolean;
  partsIncomplete: boolean;
}

/** 檢視模式 */
export type ViewMode = 'card' | 'table';
