/**
 * 專案卡片：自 context 彙整站點、WIP、三種進度檢視模型與預警
 */

import { useEPM } from '../../context/EPMContext';
import { useProjectAlerts } from '../../hooks/useProjectAlerts';
import type { Project } from '../../types';
import {
  buildProductionProgressFromEngineeringStationOnly,
  buildProductionProgressViewModel,
  buildShippingSafetyRateViewModel,
  computeMaterialSegmentLit,
  computeMaterialWipFoundAny,
  computePropertyManagementProgress,
  getCurrentStationDisplay,
  lookupWorkOrderMap,
  resolveWipSnapshot,
  type ProductionProgressViewModel,
} from '../../utils';

export function useProjectCardData(project: Project) {
  const {
    toolDeliveryMap,
    partDeliveryMap,
    materialLotDeliveryMap,
    stationProgressMap,
    wipByWorkOrder,
  } = useEPM();
  const alerts = useProjectAlerts(project, toolDeliveryMap, partDeliveryMap);
  const wipSnap = resolveWipSnapshot(wipByWorkOrder, project);
  const materialRoutes = project.pdfData?.materialRoutes ?? [];
  const segmentLit = computeMaterialSegmentLit(
    wipByWorkOrder,
    project,
    materialRoutes
  );
  const wipFoundAny = computeMaterialWipFoundAny(
    wipByWorkOrder,
    project,
    materialRoutes
  );
  const materialSlots =
    project.pdfParsed && materialRoutes.length > 0
      ? {
          codes: materialRoutes.map((r) => r.segmentCode),
          lit: segmentLit,
        }
      : null;
  const currentStationName = getCurrentStationDisplay(
    project.workOrder,
    project.pdfData?.stations,
    stationProgressMap,
    wipSnap
  );

  let progressModel: ProductionProgressViewModel | null = wipSnap
    ? buildProductionProgressViewModel(project, wipSnap)
    : null;
  if (!progressModel) {
    const engOnly = lookupWorkOrderMap(stationProgressMap, project.workOrder);
    if (engOnly) {
      progressModel = buildProductionProgressFromEngineeringStationOnly(project, engOnly);
    }
  }

  const propertyProgressModel = computePropertyManagementProgress(
    project,
    partDeliveryMap,
    toolDeliveryMap,
    materialLotDeliveryMap,
    {
      slots: materialSlots,
      wipFoundAny,
    }
  );

  const shippingSafetyModel = buildShippingSafetyRateViewModel(project, wipSnap);

  return {
    currentStationName,
    progressModel,
    propertyProgressModel,
    shippingSafetyModel,
    alerts,
  };
}
