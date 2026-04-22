/**
 * 出貨安全率：傳票需求量（qty）+ WIP 第 5／21 欄與刻度公式（見 function_md/safe_pcs.md）
 */

import type { Project } from '../types';
import type { WipSnapshot } from '../parsers/excelParser';

export interface ShippingSafetyRateViewModel {
  /** 有工單且至少可算出刻度或目前在站量時為 true */
  canRender: boolean;
  /** 傳票出貨數量 */
  demandPcs: number | null;
  /** WIP 第 21 欄 目前 Pcs */
  currentWipPcs: number | null;
  /** WIP 第 5 欄 投料目標量（橫軸右端參考） */
  targetFeedPcs: number | null;
  /** (投料目標量 + 傳票需求) / 2 */
  midPcs: number | null;
  /** 橫軸最大值（至少為 1，含所有需顯示的刻度與目前量） */
  scaleMax: number;
  currentPercent: number;
  demandPercent: number;
  midPercent: number;
  targetPercent: number;
  /** 目前 WIP Pcs 低於需求量 */
  wipShortVsDemand: boolean;
  /** 建議補投 pnl（依短缺比例 × WIP 張數） */
  supplementPnl: number | null;
}

function parsePositiveInt(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.round(raw);
    return n < 0 ? null : n;
  }
  const digits = String(raw).replace(/,/g, '').replace(/[^\d.-]/g, '');
  if (!digits) return null;
  const n = Math.round(parseFloat(digits));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function buildShippingSafetyRateViewModel(
  project: Project,
  wip: WipSnapshot | null | undefined
): ShippingSafetyRateViewModel {
  const demandPcs = parsePositiveInt(project.qty);
  const currentWipPcs = wip ? parsePositiveInt(wip.wipPcs) : null;
  const targetFeedPcs = wip ? parsePositiveInt(wip.targetFeedQty) : null;
  const sheetCount = wip ? parsePositiveInt(wip.sheetCount) : null;

  const midPcs =
    demandPcs !== null && targetFeedPcs !== null
      ? Math.round((targetFeedPcs + demandPcs) / 2)
      : null;

  const scaleMax = Math.max(
    1,
    targetFeedPcs ?? 0,
    demandPcs ?? 0,
    currentWipPcs ?? 0,
    midPcs ?? 0
  );

  const pct = (v: number | null) =>
    v === null ? 0 : Math.min(100, Math.max(0, (v / scaleMax) * 100));

  const wipShortVsDemand =
    demandPcs !== null &&
    currentWipPcs !== null &&
    currentWipPcs < demandPcs;

  let supplementPnl: number | null = null;
  if (
    wipShortVsDemand &&
    demandPcs !== null &&
    currentWipPcs !== null &&
    targetFeedPcs !== null &&
    targetFeedPcs > 0 &&
    sheetCount !== null &&
    sheetCount > 0
  ) {
    const shortage = demandPcs - currentWipPcs;
    supplementPnl = Math.max(1, Math.ceil((shortage / targetFeedPcs) * sheetCount));
  }

  const canRender = Boolean(
    wip &&
      (demandPcs !== null ||
        currentWipPcs !== null ||
        targetFeedPcs !== null ||
        midPcs !== null)
  );

  return {
    canRender,
    demandPcs,
    currentWipPcs,
    targetFeedPcs,
    midPcs,
    scaleMax,
    currentPercent: pct(currentWipPcs),
    demandPercent: pct(demandPcs),
    midPercent: pct(midPcs),
    targetPercent: pct(targetFeedPcs),
    wipShortVsDemand,
    supplementPnl,
  };
}
