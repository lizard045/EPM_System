/**
 * 專案卡片元件
 */

import {
  buildProductionProgressFromEngineeringStationOnly,
  buildProductionProgressViewModel,
  computePropertyManagementProgress,
  getCurrentStationDisplay,
  lookupWorkOrderMap,
} from '../../utils';
import { useProjectAlerts } from '../../hooks/useProjectAlerts';
import { useEPM } from '../../context/EPMContext';
import type { Project } from '../../types';
import { ProductionProgressSection } from './ProductionProgressSection';
import { PropertyManagementProgressSection } from './PropertyManagementProgressSection';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const {
    toolDeliveryMap,
    partDeliveryMap,
    materialLotDeliveryMap,
    stationProgressMap,
    wipByWorkOrder,
  } = useEPM();
  const alerts = useProjectAlerts(project, toolDeliveryMap, partDeliveryMap);
  const wipSnap = lookupWorkOrderMap(wipByWorkOrder, project.workOrder);
  const currentStationName = getCurrentStationDisplay(
    project.workOrder,
    project.pdfData?.stations,
    stationProgressMap,
    wipSnap
  );
  let progressModel = wipSnap ? buildProductionProgressViewModel(project, wipSnap) : null;
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
    materialLotDeliveryMap
  );

  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className={styles.woHeader}>
        <div className={styles.workOrderTag}>{project.workOrder || '未填工單'}</div>
        {currentStationName && (
          <div
            className={`${styles.currentPosTag} ${
              currentStationName === '工單錯誤' ? styles.error : ''
            }`}
          >
            目前站點：{currentStationName}
          </div>
        )}
        {!project.pdfParsed && (
          <span className={styles.pdfRemind}>尚未匯入手順書</span>
        )}
      </div>
      <div className={styles.mpnTitle}>{project.mpn || '未知品目'}</div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>表單編號</span>
        <span className={`${styles.fieldValue} ${styles.formNo}`}>
          {project.formNo || '---'}
        </span>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>數量</span>
        <span className={styles.fieldValue}>{project.qty || 0} PCS</span>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>交期</span>
        <span className={styles.fieldValue}>{project.deadline || '未定'}</span>
      </div>
      {progressModel && <ProductionProgressSection model={progressModel} />}
      <PropertyManagementProgressSection
        model={propertyProgressModel}
        pdfParsed={project.pdfParsed}
      />
      {alerts.toolingIncomplete && (
        <div className={styles.cardWarning}>模治具尚未備齊</div>
      )}
      {alerts.partsIncomplete && (
        <div className={styles.cardWarning}>零件尚未備料齊全</div>
      )}
    </div>
  );
}
