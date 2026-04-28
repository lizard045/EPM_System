/**
 * WIP 快照查詢：先依工單，未命中則依料號與傳票品目（mpn）對應。
 * 傳票 HTML 預設不帶工單字串時仍可比對同一列 WIP。
 */

import type { WipSnapshot } from '../parsers/excelParser';
import type { Project } from '../types';
import { lookupWorkOrderMap, normalizeWorkOrderKey } from './stationUtils';

/**
 * 依指定工單號碼（及傳票品目）解析 WIP 快照。
 */
export function resolveWipSnapshotByWorkOrderKey(
  wipByWorkOrder: Record<string, WipSnapshot>,
  workOrder: string | undefined,
  mpn: string
): WipSnapshot | undefined {
  const byWo = lookupWorkOrderMap(wipByWorkOrder, workOrder);
  if (byWo) return byWo;

  const needle = normalizeWorkOrderKey(mpn);
  if (!needle) return undefined;

  for (const snap of Object.values(wipByWorkOrder)) {
    const p = normalizeWorkOrderKey(snap.partNo);
    if (p && p === needle) return snap;
  }

  const needleAlnum = needle.replace(/[^A-Z0-9]/g, '');
  if (needleAlnum.length < 4) return undefined;
  for (const snap of Object.values(wipByWorkOrder)) {
    const p = normalizeWorkOrderKey(snap.partNo).replace(/[^A-Z0-9]/g, '');
    if (p && p === needleAlnum) return snap;
  }

  return undefined;
}

export function resolveWipSnapshot(
  wipByWorkOrder: Record<string, WipSnapshot>,
  project: Project
): WipSnapshot | undefined {
  return resolveWipSnapshotByWorkOrderKey(wipByWorkOrder, project.workOrder, project.mpn);
}
