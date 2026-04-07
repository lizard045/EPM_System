/**
 * 專案預警計算（供 hook 與列表篩選共用）
 */

import { isFutureDate } from './dateUtils';
import type { Project, ProjectAlerts } from '../types';

export function computeProjectAlerts(
  project: Project,
  toolDeliveryMap: Record<string, string>,
  partDeliveryMap: Record<string, string>
): ProjectAlerts {
  let toolingIncomplete = false;
  let partsIncomplete = false;

  const partProg = partDeliveryMap[project.formNo?.toUpperCase() ?? ''] ?? '';
  if (!partProg) {
    partsIncomplete = true;
  } else if (project.pdfParsed && project.pdfData?.parts) {
    project.pdfData.parts.forEach((part) => {
      const m = partProg.match(new RegExp(part.code + '[^\\n]*?\\*([^\\s,;\\n]+)', 'i'));
      if (m && isFutureDate(m[1])) partsIncomplete = true;
    });
    if (
      !partProg.includes('零件備妥') &&
      ['尚未', '待', '未齊'].some((k) => partProg.includes(k))
    ) {
      partsIncomplete = true;
    }
  }

  if (project.pdfParsed && project.pdfData?.jigs) {
    project.pdfData.jigs.forEach((jig) => {
      (jig.code ?? '')
        .split('\n')
        .forEach((c) => {
          const core = c.toUpperCase().trim().split('(')[0].trim();
          if (!core) return;
          for (const key in toolDeliveryMap) {
            if (
              (key === core || key.startsWith(core + '-')) &&
              isFutureDate(toolDeliveryMap[key])
            ) {
              toolingIncomplete = true;
            }
          }
        });
    });
  }

  return { toolingIncomplete, partsIncomplete };
}
