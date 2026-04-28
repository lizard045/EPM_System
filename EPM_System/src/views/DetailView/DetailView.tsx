/**
 * 專案詳情頁
 */

import { useRef, useState } from 'react';
import { useEPM } from '../../context/EPMContext';
import {
  formatMaterialStationDisplay,
  getCurrentStationDisplay,
  resolveMaterialWipAgainstRoutes,
  resolveWipSnapshot,
  resolveWipSnapshotByWorkOrderKey,
} from '../../utils';
import { parseTravelerExcel } from '../../parsers';
import { PdfResultSection } from '../../components/PdfResultSection';
import styles from './DetailView.module.css';

interface DetailViewProps {
  projectId: number;
  onClose: () => void;
}

export function DetailView({ projectId, onClose }: DetailViewProps) {
  const { projects, setProjects, updateProject, stationProgressMap, wipByWorkOrder } =
    useEPM();

  const travelerInputRef = useRef<HTMLInputElement>(null);
  const [travelerStatus, setTravelerStatus] = useState('');

  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;

  const wipSnap = resolveWipSnapshot(wipByWorkOrder, project);
  const currentStation = getCurrentStationDisplay(
    project.workOrder,
    project.pdfData?.stations,
    stationProgressMap,
    wipSnap
  );

  const materialWoKey =
    project.materialWorkOrder?.trim() || project.workOrder?.trim() || '';
  const materialRoutes = project.pdfData?.materialRoutes ?? [];
  const materialWipSnap = resolveWipSnapshotByWorkOrderKey(
    wipByWorkOrder,
    materialWoKey || undefined,
    project.mpn
  );
  const materialResolution = resolveMaterialWipAgainstRoutes(
    materialWipSnap,
    materialRoutes
  );
  const materialStationLine =
    project.pdfParsed && materialRoutes.length > 0
      ? formatMaterialStationDisplay(materialResolution) ?? '-'
      : '-';

  const handleArchive = () => {
    if (window.confirm('確定要結案此傳票嗎？')) {
      updateProject(projectId, { isArchived: true });
      onClose();
    }
  };

  const handleUpdateWorkOrder = (value: string) => {
    updateProject(projectId, { workOrder: value });
  };

  const handleUpdateMaterialWorkOrder = (value: string) => {
    updateProject(projectId, { materialWorkOrder: value });
  };

  const handleProcessTraveler = () => {
    const input = travelerInputRef.current;
    if (!input?.files?.length) return;

    setTravelerStatus('解析中...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const { data, excelItemNo } = parseTravelerExcel(buffer);

        const normProj = project.mpn.replace(/[^A-Z0-9]/g, '');
        const normExcel = (excelItemNo ?? '').replace(/[^A-Z0-9]/g, '');
        if (
          normExcel &&
          !normProj.includes(normExcel) &&
          !normExcel.includes(normProj)
        ) {
          window.alert(
            `品目驗證失敗！\nExcel 品目為：${excelItemNo}\n與專案品目：${project.mpn} 不符`
          );
          setTravelerStatus('品目不符');
          return;
        }

        const idx = projects.findIndex((p) => p.id === projectId);
        if (idx !== -1) {
          setProjects((prev) =>
            prev.map((p, i) =>
              i === idx
                ? { ...p, pdfParsed: true, pdfData: data }
                : p
            )
          );
        }
        setTravelerStatus('解析完畢');
      } catch (err) {
        console.error(err);
        setTravelerStatus('解析出錯');
      }
      input.value = '';
    };
    reader.readAsArrayBuffer(input.files[0]);
  };

  return (
    <div className={styles.detailView}>
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div className={styles.detailMpn}>戰情品目：{project.mpn}</div>
          <div className={styles.detailActions}>
            <button
              type="button"
              className={styles.btnArchive}
              onClick={handleArchive}
            >
              結案此傳票
            </button>
            <button
              type="button"
              className={styles.btnBack}
              onClick={onClose}
            >
              返回戰情室
            </button>
          </div>
        </div>

        <div className={styles.workOrderRow}>
          <div className={styles.workOrderSection}>
            <span className={styles.label}>工單號碼：</span>
            <input
              type="text"
              className={styles.workOrderInput}
              placeholder="請輸入工單號碼..."
              value={project.workOrder}
              onChange={(e) => handleUpdateWorkOrder(e.target.value)}
            />
          </div>
          <div className={styles.workOrderSection}>
            <span className={styles.label}>材料工單：</span>
            <input
              type="text"
              className={styles.workOrderInput}
              placeholder="請輸入材料工單號碼..."
              value={project.materialWorkOrder ?? ''}
              onChange={(e) => handleUpdateMaterialWorkOrder(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.stationRow}>
          <div className={styles.stationSection}>
            <span className={styles.label}>目前站點：</span>
            <span
              className={
                currentStation === '工單錯誤'
                  ? styles.stationError
                  : styles.currentStationBox
              }
            >
              {currentStation || '-'}
            </span>
          </div>
          <div className={styles.stationSection}>
            <span className={styles.label}>材料站點：</span>
            <span
              className={
                materialStationLine !== '-'
                  ? styles.materialStationHighlight
                  : undefined
              }
            >
              {materialStationLine}
            </span>
          </div>
        </div>

        <div className={styles.pdfSection}>
          <h3>Traveler 手順書解析 (Excel)</h3>
          <div className={styles.pdfUploadRow}>
            <input
              ref={travelerInputRef}
              type="file"
              accept=".xlsx,.xls"
            />
            <button type="button" onClick={handleProcessTraveler}>
              啟動解析
            </button>
            <span className={styles.travelerStatus}>{travelerStatus}</span>
          </div>
        </div>

        {project.pdfParsed && project.pdfData && (
          <PdfResultSection project={project} />
        )}
      </div>
    </div>
  );
}
