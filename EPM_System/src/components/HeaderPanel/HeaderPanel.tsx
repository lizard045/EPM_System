/**
 * 頂部上傳區
 */

import { useRef, useState } from 'react';
import { useEPM } from '../../context/EPMContext';
import { parseVoucherHtml } from '../../parsers';
import {
  parseToolDeliveryExcel,
  parsePartDeliveryExcel,
  parseStationExcel,
  parseMaterialLotDeliveryExcel,
} from '../../parsers';
import styles from './HeaderPanel.module.css';

interface HeaderPanelProps {
  onImportHtml?: () => void;
  onImportTools?: () => void;
  onImportParts?: () => void;
  onImportStations?: () => void;
}

export function HeaderPanel(props: HeaderPanelProps) {
  const {
    projects,
    setProjects,
    setToolDeliveryMap,
    setPartDeliveryMap,
    setStationProgressMap,
    materialLotDeliveryMap,
    setMaterialLotDeliveryMap,
    viewMode,
    setViewMode,
    toolDeliveryMap,
    partDeliveryMap,
    stationProgressMap,
    clearAllData,
    addProject,
  } = useEPM();

  const htmlInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const partExcelInputRef = useRef<HTMLInputElement>(null);
  const stationExcelInputRef = useRef<HTMLInputElement>(null);
  const materialExcelInputRef = useRef<HTMLInputElement>(null);
  const [uploadPage, setUploadPage] = useState(0);

  const handleImportHtml = () => {
    const input = htmlInputRef.current;
    if (!input?.files?.length) return;

    Array.from(input.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const html = e.target?.result as string;
        const parsed = parseVoucherHtml(html);
        if (!parsed) return;

        if (parsed.formNo) {
          const existingIdx = projects.findIndex((p) => p.formNo === parsed.formNo);
          if (existingIdx !== -1) {
            if (projects[existingIdx].isArchived) {
              if (window.confirm(`傳票 ${parsed.formNo} 先前已結案，是否恢復顯示？`)) {
                setProjects((prev) =>
                  prev.map((p, i) =>
                    i === existingIdx ? { ...p, isArchived: false } : p
                  )
                );
              }
            } else {
              window.alert('傳票已存在：' + parsed.formNo);
            }
            return;
          }
        }

        addProject(parsed);
        props.onImportHtml?.();
      };
      reader.readAsText(file);
    });
    input.value = '';
  };

  const handleImportExcel = () => {
    const input = excelInputRef.current;
    if (!input?.files?.length) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const map = parseToolDeliveryExcel(buffer);
      setToolDeliveryMap(map);
      window.alert('工具交期匯入成功');
      props.onImportTools?.();
    };
    reader.readAsArrayBuffer(input.files[0]);
  };

  const handleImportPartExcel = () => {
    const input = partExcelInputRef.current;
    if (!input?.files?.length) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const map = parsePartDeliveryExcel(buffer);
      setPartDeliveryMap(map);
      window.alert('備料匯入成功');
      props.onImportParts?.();
    };
    reader.readAsArrayBuffer(input.files[0]);
  };

  const handleImportStationExcel = () => {
    const input = stationExcelInputRef.current;
    if (!input?.files?.length) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const map = parseStationExcel(buffer);
      setStationProgressMap((prev) => ({ ...prev, ...map }));
      window.alert('成功匯入站點進度');
      props.onImportStations?.();
    };
    reader.readAsArrayBuffer(input.files[0]);
    input.value = '';
  };

  const handleImportMaterialExcel = () => {
    const input = materialExcelInputRef.current;
    if (!input?.files?.length) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const map = parseMaterialLotDeliveryExcel(buffer);
      setMaterialLotDeliveryMap(map);
      window.alert(`新原物料／補材紀錄匯入成功（${Object.keys(map).length} 筆 LOT）`);
    };
    reader.readAsArrayBuffer(input.files[0]);
    input.value = '';
  };

  const handleClearAll = () => {
    if (window.confirm('確定清空所有資料？')) {
      clearAllData();
    }
  };

  const hasTools = Object.keys(toolDeliveryMap).length > 0;
  const hasHtml = projects.length > 0;
  const hasParts = Object.keys(partDeliveryMap).length > 0;
  const hasStations = Object.keys(stationProgressMap).length > 0;
  const hasMaterialLot = Object.keys(materialLotDeliveryMap).length > 0;

  return (
    <div className={styles.headerPanel}>
      <div className={styles.headerTop}>
        <h2 className={styles.title}>NPI 專案戰情儀表板 (V38.0 雙模式版)</h2>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.btnOutline} ${viewMode === 'card' ? styles.active : ''}`}
            onClick={() => setViewMode('card')}
          >
            卡片模式
          </button>
          <button
            type="button"
            className={`${styles.btnOutline} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={() => setViewMode('table')}
          >
            列表模式
          </button>
        </div>
      </div>
      <div className={styles.uploadPanelWrap}>
        <div className={styles.uploadArea}>
          {uploadPage === 0 && (
            <>
              <div className={styles.uploadGroup}>
                <span className={styles.uploadLabel}>1. 傳票匯入 (HTML)</span>
                <input
                  type="file"
                  ref={htmlInputRef}
                  accept=".html"
                  multiple
                />
                <button type="button" onClick={handleImportHtml}>
                  執行匯入
                </button>
                <div className={styles.statusMsg}>{hasHtml ? '已載入傳票' : ''}</div>
              </div>
              <div className={styles.uploadGroup}>
                <span className={styles.uploadLabel}>2. 工具交期 (Excel)</span>
                <input type="file" ref={excelInputRef} accept=".xlsx,.xls" />
                <button type="button" className={styles.btnExcel} onClick={handleImportExcel}>
                  匯入比對
                </button>
                <div className={styles.statusMsg}>{hasTools ? '已載入工具' : ''}</div>
              </div>
              <div className={styles.uploadGroup}>
                <span className={styles.uploadLabel}>3. 零件備料 (Excel)</span>
                <input type="file" ref={partExcelInputRef} accept=".xlsx,.xls" />
                <button type="button" className={styles.btnPartExcel} onClick={handleImportPartExcel}>
                  匯入備料
                </button>
                <div className={styles.statusMsg}>{hasParts ? '已載入備料' : ''}</div>
              </div>
              <div className={styles.uploadGroup}>
                <span className={styles.uploadLabel}>4. 目前站點 (Excel)</span>
                <input type="file" ref={stationExcelInputRef} accept=".xlsx,.xls" />
                <button type="button" className={styles.btnStation} onClick={handleImportStationExcel}>
                  匯入站點
                </button>
                <div className={styles.statusMsg}>{hasStations ? '已載入站點' : ''}</div>
              </div>
              <button type="button" className={styles.btnDanger} onClick={handleClearAll}>
                清除所有暫存
              </button>
            </>
          )}
          {uploadPage === 1 && (
            <>
              <div className={styles.uploadGroup}>
                <span className={styles.uploadLabel}>
                  5. 新原物料異常／補材 (Excel)
                </span>
                <input
                  type="file"
                  ref={materialExcelInputRef}
                  accept=".xlsx,.xls"
                />
                <button
                  type="button"
                  className={styles.btnMaterial}
                  onClick={handleImportMaterialExcel}
                >
                  匯入比對 LOT
                </button>
                <div className={styles.statusMsg}>
                  {hasMaterialLot ? '已載入補材採購交期' : ''}
                </div>
              </div>
              <button type="button" className={styles.btnDanger} onClick={handleClearAll}>
                清除所有暫存
              </button>
            </>
          )}
        </div>
        <div className={styles.uploadPageNav} aria-label="匯入區分頁">
          <button
            type="button"
            className={styles.pageNavBtn}
            title="上一區（1–4 項）"
            disabled={uploadPage === 0}
            onClick={() => setUploadPage(0)}
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.pageNavBtn}
            title="下一區（補材採購交期）"
            disabled={uploadPage === 1}
            onClick={() => setUploadPage(1)}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}
