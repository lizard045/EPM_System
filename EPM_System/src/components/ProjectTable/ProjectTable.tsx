/**
 * 專案列表表格
 */

import { getCurrentStationDisplay, lookupWorkOrderMap } from '../../utils';
import { useProjectAlerts } from '../../hooks/useProjectAlerts';
import { useEPM } from '../../context/EPMContext';
import type { Project } from '../../types';
import styles from './ProjectTable.module.css';

interface ProjectTableProps {
  projects: Project[];
  onRowClick: (project: Project) => void;
}

export function ProjectTable({ projects, onRowClick }: ProjectTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table>
        <thead>
          <tr>
            <th>工單號碼</th>
            <th>品目番號 (M/P/N)</th>
            <th>目前站點</th>
            <th>表單編號</th>
            <th>數量</th>
            <th>交期</th>
            <th>狀態/預警</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <ProjectTableRow key={p.id} project={p} onRowClick={onRowClick} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProjectTableRow({
  project,
  onRowClick,
}: {
  project: Project;
  onRowClick: (p: Project) => void;
}) {
  const { toolDeliveryMap, partDeliveryMap, stationProgressMap, wipByWorkOrder } = useEPM();
  const alerts = useProjectAlerts(project, toolDeliveryMap, partDeliveryMap);
  const wipSnap = lookupWorkOrderMap(wipByWorkOrder, project.workOrder);

  const currentStationName =
    getCurrentStationDisplay(
      project.workOrder,
      project.pdfData?.stations,
      stationProgressMap,
      wipSnap
    ) || '-';

  let alertTags: React.ReactNode;
  if (!project.pdfParsed) {
    alertTags = (
      <div className={styles.pdfRemind} style={{ display: 'inline-block' }}>
        尚未匯入PDF
      </div>
    );
  } else if (alerts.toolingIncomplete || alerts.partsIncomplete) {
    alertTags = (
      <>
        {alerts.toolingIncomplete && (
          <div className={styles.tableWarning}>模治具未齊</div>
        )}
        {alerts.partsIncomplete && (
          <div className={styles.tableWarning}>零件未齊</div>
        )}
      </>
    );
  } else {
    alertTags = <span style={{ color: 'green' }}>正常</span>;
  }

  return (
    <tr onClick={() => onRowClick(project)}>
      <td>
        <span className={styles.workOrderTag}>{project.workOrder || '未填'}</span>
      </td>
      <td style={{ fontWeight: 'bold' }}>{project.mpn}</td>
      <td>
        <span
          className={
            currentStationName !== '-'
              ? `${styles.currentPosTag} ${
                  currentStationName === '工單錯誤' ? styles.error : ''
                }`
              : ''
          }
        >
          {currentStationName}
        </span>
      </td>
      <td style={{ color: '#005a9e' }}>{project.formNo}</td>
      <td>{project.qty} PCS</td>
      <td>{project.deadline}</td>
      <td>{alertTags}</td>
    </tr>
  );
}
