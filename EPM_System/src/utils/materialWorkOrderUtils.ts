/**
 * 材料工單與手順書(材)製程段（F03、P04…）對齊
 */

import type { WipSnapshot } from '../parsers/excelParser';
import type { MaterialRouteGroup, Project } from '../types';
import { resolveMaterialWipAgainstSegment } from './materialRouteUtils';
import { resolveWipSnapshotByWorkOrderKey } from './wipLookupUtils';

/**
 * 依製程段數取得每段對應之工單字串（與手順書段序一一對應）。
 * 優先 materialWorkOrders；無則繼承舊版單一 materialWorkOrder 填入第一欄。
 */
export function getMaterialWorkOrderList(
  project: Project,
  segmentCount: number
): string[] {
  const raw = project.materialWorkOrders;
  if (Array.isArray(raw) && raw.length > 0) {
    return Array.from({ length: segmentCount }, (_, i) =>
      String(raw[i] ?? '').trim()
    );
  }
  const legacy = project.materialWorkOrder?.trim() ?? '';
  if (legacy && segmentCount > 0) {
    return Array.from({ length: segmentCount }, (_, i) =>
      i === 0 ? legacy : ''
    );
  }
  return Array.from({ length: segmentCount }, () => '');
}

/** 各材料段是否已到「材料完工站」（可比對 WIP 時） */
export function computeMaterialSegmentLit(
  wipByWorkOrder: Record<string, WipSnapshot>,
  project: Project,
  routes: MaterialRouteGroup[]
): boolean[] {
  const n = routes.length;
  if (n === 0) return [];
  const wos = getMaterialWorkOrderList(project, n);
  return routes.map((route, i) => {
    const wo = wos[i]?.trim();
    if (!wo) return false;
    const snap = resolveWipSnapshotByWorkOrderKey(wipByWorkOrder, wo, project.mpn);
    if (!snap) return false;
    const res = resolveMaterialWipAgainstSegment(snap, route);
    return res.matchedStation !== null && res.isCompletion === true;
  });
}

export function computeMaterialWipFoundAny(
  wipByWorkOrder: Record<string, WipSnapshot>,
  project: Project,
  routes: MaterialRouteGroup[]
): boolean {
  if (routes.length === 0) return false;
  const wos = getMaterialWorkOrderList(project, routes.length);
  return wos.some((w) => {
    const wo = w.trim();
    if (!wo) return false;
    return !!resolveWipSnapshotByWorkOrderKey(wipByWorkOrder, wo, project.mpn);
  });
}
