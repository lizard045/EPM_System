/**
 * 專案卡片元件
 */

import type { Project } from '../../types';
import {
  ProductionProgressSection,
  PropertyManagementProgressSection,
  ShippingSafetyRateSection,
} from './sections';
import { useProjectCardData } from './useProjectCardData';
import styles from './ProjectCard.module.css';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const {
    currentStationName,
    progressModel,
    propertyProgressModel,
    shippingSafetyModel,
    alerts,
    materialStationTag,
  } = useProjectCardData(project);
  const { workOrder, mpn, formNo, qty, deadline, pdfParsed } = project;
  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className={styles.woHeader}>
        <div className={styles.workOrderTag}>{workOrder || '未填工單'}</div>
        {currentStationName && (
          <div
            className={`${styles.currentPosTag} ${
              currentStationName === '工單錯誤' ? styles.error : ''
            }`}
          >
            目前站點：{currentStationName}
          </div>
        )}
        {materialStationTag && (
          <div className={styles.materialPosTag}>
            材料站點：{materialStationTag}
          </div>
        )}
        {!pdfParsed && (
          <span className={styles.pdfRemind}>尚未匯入手順書</span>
        )}
      </div>
      <div className={styles.mpnTitle}>{mpn || '未知品目'}</div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>表單編號</span>
        <span className={`${styles.fieldValue} ${styles.formNo}`}>
          {formNo || '---'}
        </span>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>數量</span>
        <span className={styles.fieldValue}>{qty || 0} PCS</span>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>交期</span>
        <span className={styles.fieldValue}>{deadline || '未定'}</span>
      </div>
      {progressModel && <ProductionProgressSection model={progressModel} />}
      {shippingSafetyModel.canRender && (
        <ShippingSafetyRateSection model={shippingSafetyModel} />
      )}
      <PropertyManagementProgressSection
        model={propertyProgressModel}
        pdfParsed={pdfParsed}
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
