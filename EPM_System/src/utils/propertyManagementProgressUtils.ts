/**
 * 卡片「物管進度」：零件 / 模治具 / 補材 入料比例（依 Excel 與手順書）
 */

import { isFutureDate } from './dateUtils';
import type { MaterialWipResolution } from './materialRouteUtils';
import type { Project } from '../types';

const PART_GLOBAL_INCOMPLETE = ['尚未', '待', '未齊'] as const;

const TITLE_MAX = 56;

function truncateTitle(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= TITLE_MAX) return t;
  return `${t.slice(0, TITLE_MAX - 1)}…`;
}

export type PropertyPendingKind = 'part' | 'tooling' | 'consumable';

export interface PropertyPendingItem {
  key: string;
  kind: PropertyPendingKind;
  statusLabel: string;
  title: string;
  refId: string;
}

export interface PropertyProgressCategory {
  label: string;
  total: number;
  received: number;
  /** 有手順書列舉項目且可比對 Excel 狀態 */
  hasTravelerItems: boolean;
  /** 有上傳對應 Excel（傳票有進度字串／工具有表／補材表有鍵） */
  hasExcelHint: boolean;
}

export interface PropertyManagementProgressModel {
  parts: PropertyProgressCategory;
  tooling: PropertyProgressCategory;
  material: PropertyProgressCategory;
  consumables: PropertyProgressCategory;
  /** 尚未入料／未備妥項目（依零件→模治具→補材順序） */
  pendingItems: PropertyPendingItem[];
}

function isPartLineReceived(partProg: string, partCode: string): boolean {
  const m = partProg.match(new RegExp(partCode + '[^\\n]*?\\*([^\\s,;\\n]+)', 'i'));
  if (!m) return true;
  return !isFutureDate(m[1]);
}

function computePartsCategory(project: Project, partDeliveryMap: Record<string, string>): PropertyProgressCategory {
  const parts = project.pdfData?.parts ?? [];
  const total = parts.length;
  const formKey = project.formNo?.toUpperCase() ?? '';
  const partProg = partDeliveryMap[formKey] ?? '';

  if (total === 0) {
    return {
      label: '零件',
      total: 0,
      received: 0,
      hasTravelerItems: false,
      hasExcelHint: !!partProg,
    };
  }

  if (!partProg) {
    return {
      label: '零件',
      total,
      received: 0,
      hasTravelerItems: true,
      hasExcelHint: false,
    };
  }

  const partReady = partProg.includes('零件備妥');
  const globalBlock =
    !partReady && PART_GLOBAL_INCOMPLETE.some((k) => partProg.includes(k));

  if (globalBlock) {
    return {
      label: '零件',
      total,
      received: 0,
      hasTravelerItems: true,
      hasExcelHint: true,
    };
  }

  let received = 0;
  for (const p of parts) {
    if (isPartLineReceived(partProg, p.code)) received += 1;
  }

  return {
    label: '零件',
    total,
    received,
    hasTravelerItems: true,
    hasExcelHint: true,
  };
}

function jigLineReceived(core: string, toolDeliveryMap: Record<string, string>): boolean {
  let matchedKey: string | null = null;
  for (const k in toolDeliveryMap) {
    if (k === core || k.startsWith(core + '-')) {
      matchedKey = k;
      break;
    }
  }
  if (matchedKey == null) return false;
  const val = toolDeliveryMap[matchedKey];
  if (!val || !String(val).trim()) return false;
  return !isFutureDate(val);
}

function computeToolingCategory(project: Project, toolDeliveryMap: Record<string, string>): PropertyProgressCategory {
  const jigs = project.pdfData?.jigs ?? [];
  const cores: string[] = [];
  for (const j of jigs) {
    for (const c of j.code.split('\n')) {
      const core = c.toUpperCase().trim().split('(')[0].trim();
      if (core) cores.push(core);
    }
  }
  const total = cores.length;
  const hasExcelHint = Object.keys(toolDeliveryMap).length > 0;

  if (total === 0) {
    return {
      label: '模治具',
      total: 0,
      received: 0,
      hasTravelerItems: false,
      hasExcelHint,
    };
  }

  let received = 0;
  for (const core of cores) {
    if (jigLineReceived(core, toolDeliveryMap)) received += 1;
  }

  return {
    label: '模治具',
    total,
    received,
    hasTravelerItems: true,
    hasExcelHint,
  };
}

function computeMaterialCategory(
  project: Project,
  resolution: MaterialWipResolution | undefined,
  wipFound: boolean
): PropertyProgressCategory {
  const routes = project.pdfData?.materialRoutes ?? [];
  if (!project.pdfParsed || routes.length === 0) {
    return {
      label: '材料',
      total: 0,
      received: 0,
      hasTravelerItems: false,
      hasExcelHint: wipFound,
    };
  }

  const flatStations = routes.flatMap((g) => g.stations);
  const totalSteps = flatStations.length;

  let received = 0;
  if (resolution?.matchedStation && totalSteps > 0) {
    const matched = resolution.matchedStation;
    const idx = flatStations.findIndex(
      (s) => s.code === matched.code && s.name === matched.name
    );
    if (idx >= 0) {
      received = resolution.isCompletion ? totalSteps : idx + 1;
    }
  }

  return {
    label: '材料',
    total: totalSteps,
    received,
    hasTravelerItems: true,
    hasExcelHint: wipFound,
  };
}

function computeConsumablesCategory(
  project: Project,
  materialLotDeliveryMap: Record<string, string>
): PropertyProgressCategory {
  const list = project.pdfData?.consumables ?? [];
  const total = list.length;
  const hasExcelHint = Object.keys(materialLotDeliveryMap).length > 0;

  if (total === 0) {
    return {
      label: '補材',
      total: 0,
      received: 0,
      hasTravelerItems: false,
      hasExcelHint,
    };
  }

  let received = 0;
  for (const d of list) {
    if (consumableLineReceived(d, materialLotDeliveryMap)) received += 1;
  }

  return {
    label: '補材',
    total,
    received,
    hasTravelerItems: true,
    hasExcelHint,
  };
}

function consumableLineReceived(
  d: { code: string },
  materialLotDeliveryMap: Record<string, string>
): boolean {
  const lotKey = d.code.trim().toUpperCase();
  if (!lotKey) return false;
  const hasEntry = Object.prototype.hasOwnProperty.call(materialLotDeliveryMap, lotKey);
  const raw = hasEntry ? materialLotDeliveryMap[lotKey] : undefined;
  const hasDelivery = !!(raw && String(raw).trim());
  return hasEntry && hasDelivery && !isFutureDate(raw);
}

function collectPendingItems(
  project: Project,
  partDeliveryMap: Record<string, string>,
  toolDeliveryMap: Record<string, string>,
  materialLotDeliveryMap: Record<string, string>
): PropertyPendingItem[] {
  const out: PropertyPendingItem[] = [];
  if (!project.pdfParsed || !project.pdfData) {
    return out;
  }

  const parts = project.pdfData.parts ?? [];
  const formKey = project.formNo?.toUpperCase() ?? '';
  const partProg = partDeliveryMap[formKey] ?? '';

  const pushAllParts = (statusLabel: string) => {
    for (const p of parts) {
      out.push({
        key: `part-${p.id}`,
        kind: 'part',
        statusLabel,
        title: truncateTitle(p.name || p.code),
        refId: p.code || p.id,
      });
    }
  };

  if (parts.length > 0) {
    if (!partProg) {
      pushAllParts('尚未備妥');
    } else {
      const partReady = partProg.includes('零件備妥');
      const globalBlock =
        !partReady && PART_GLOBAL_INCOMPLETE.some((k) => partProg.includes(k));
      if (globalBlock) {
        pushAllParts('尚未備妥');
      } else {
        for (const p of parts) {
          if (!isPartLineReceived(partProg, p.code)) {
            out.push({
              key: `part-${p.id}`,
              kind: 'part',
              statusLabel: '尚未備妥',
              title: truncateTitle(p.name || p.code),
              refId: p.code || p.id,
            });
          }
        }
      }
    }
  }

  const jigs = project.pdfData.jigs ?? [];
  for (let ji = 0; ji < jigs.length; ji++) {
    const j = jigs[ji];
    const lines = j.code.split('\n');
    for (let li = 0; li < lines.length; li++) {
      const core = lines[li].toUpperCase().trim().split('(')[0].trim();
      if (!core) continue;
      if (!jigLineReceived(core, toolDeliveryMap)) {
        out.push({
          key: `tool-${ji}-${li}-${core}`,
          kind: 'tooling',
          statusLabel: '待入廠',
          title: truncateTitle(j.station || '模治具'),
          refId: core,
        });
      }
    }
  }

  const consumables = project.pdfData.consumables ?? [];
  for (let i = 0; i < consumables.length; i++) {
    const d = consumables[i];
    if (!consumableLineReceived(d, materialLotDeliveryMap)) {
      const lotKey = d.code.trim().toUpperCase();
      out.push({
        key: `mat-${i}-${lotKey || 'x'}`,
        kind: 'consumable',
        statusLabel: '待入貨',
        title: truncateTitle(d.name || d.code || '補材'),
        refId: lotKey || '（無料號）',
      });
    }
  }

  return out;
}

export function computePropertyManagementProgress(
  project: Project,
  partDeliveryMap: Record<string, string>,
  toolDeliveryMap: Record<string, string>,
  materialLotDeliveryMap: Record<string, string>,
  materialCtx?: { resolution: MaterialWipResolution; wipFound: boolean }
): PropertyManagementProgressModel {
  const materialResolution = materialCtx?.resolution;
  const wipFound = materialCtx?.wipFound ?? false;

  return {
    parts: computePartsCategory(project, partDeliveryMap),
    tooling: computeToolingCategory(project, toolDeliveryMap),
    material: computeMaterialCategory(project, materialResolution, wipFound),
    consumables: computeConsumablesCategory(project, materialLotDeliveryMap),
    pendingItems: collectPendingItems(
      project,
      partDeliveryMap,
      toolDeliveryMap,
      materialLotDeliveryMap
    ),
  };
}
