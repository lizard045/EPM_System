/**
 * 專案預警邏輯
 */

import { useMemo } from 'react';
import { computeProjectAlerts } from '../utils';
import type { Project, ProjectAlerts } from '../types';

export function useProjectAlerts(
  project: Project,
  toolDeliveryMap: Record<string, string>,
  partDeliveryMap: Record<string, string>
): ProjectAlerts {
  return useMemo(
    () => computeProjectAlerts(project, toolDeliveryMap, partDeliveryMap),
    [project, toolDeliveryMap, partDeliveryMap]
  );
}
