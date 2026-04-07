/**
 * EPM 專案戰情室 - 全域類型定義
 */

/** 列表篩選：傳票狀態 */
export type ProjectStatusFilter =
  | 'all'
  | 'no_traveler'
  | 'traveler_ok'
  | 'tool_warn'
  | 'part_warn';

/** 列表篩選：建立日期區間 */
export type ProjectDateRangeFilter =
  | 'all'
  | 'today'
  | 'week'
  | 'month'
  | 'last30';

/** 列表排序 */
export type ProjectSortMode =
  | 'created_desc'
  | 'created_asc'
  | 'mpn_asc'
  | 'mpn_desc'
  | 'wo_asc'
  | 'deadline_asc'
  | 'deadline_desc';

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
  /** 建立時間 ISO（篩選／排序；舊資料可能無） */
  createdAt?: string;
  /** 優先度（匯入預設一般） */
  priority?: string;
  /** EPM／負責資訊 */
  epmName?: string;
  /** 客戶 */
  customer?: string;
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
