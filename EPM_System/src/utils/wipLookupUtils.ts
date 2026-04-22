/**
 * WIP 快照查詢：先依工單，未命中則依料號與傳票品目（mpn）對應。
 * 傳票 HTML 預設不帶工單字串時仍可比對同一列 WIP。
 */

import type { WipSnapshot } from '../parsers/excelParser';
import type { Project } from '../types';
import { lookupWorkOrderMap, normalizeWorkOrderKey } from './stationUtils';

export function resolveWipSnapshot(
  wipByWorkOrder: Record<string, WipSnapshot>,
  project: Project
): WipSnapshot | undefined {
  const byWo = lookupWorkOrderMap(wipByWorkOrder, project.workOrder);
  if (byWo) return byWo;

  const needle = normalizeWorkOrderKey(project.mpn);
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
