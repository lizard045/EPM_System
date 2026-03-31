/**
 * Traveler 手順書解析結果區塊
 */

import type { ReactNode } from 'react';
import { fixDateDisplay } from '../../utils';
import { findMatchingPdfStation } from '../../utils';
import { useEPM } from '../../context/EPMContext';
import type { Project } from '../../types';
import styles from './PdfResultSection.module.css';

interface PdfResultSectionProps {
  project: Project;
}

export function PdfResultSection({ project }: PdfResultSectionProps) {
  const {
    toolDeliveryMap,
    partDeliveryMap,
    stationProgressMap,
    materialLotDeliveryMap,
  } = useEPM();

  if (!project.pdfParsed || !project.pdfData) return null;

  const { parts, jigs, consumables, stations } = project.pdfData;
  const prog = partDeliveryMap[project.formNo?.toUpperCase() ?? ''] ?? '';
  const wipStation = project.workOrder?.trim()
    ? stationProgressMap[project.workOrder.trim()]
    : null;
  const matchedPdfStation =
    wipStation && stations
      ? findMatchingPdfStation(wipStation, stations)
      : null;

  const partReady = prog.includes('零件備妥');

  return (
    <div className={styles.resultArea}>
      <div className={styles.resultBlock}>
        <div className={styles.resultTitle}>零件列表 (T開頭)</div>
        <ul className={styles.resultList}>
          {(parts ?? []).length > 0 ? (
            parts.map((d) => {
                const m = prog.match(
                  new RegExp(d.code + '[^\\n]*?\\*([^\\s,;\\n]+)', 'i')
                );
                const dev = m ? (
                  <span className={styles.deliveryText}>
                    ({fixDateDisplay(m[1])})
                  </span>
                ) : null;
                return (
                  <li key={d.id}>
                    <span className={styles.tagBadge}>{d.id}</span>
                    {d.name}：<b>{d.code}</b>
                    {dev}
                  </li>
                );
              })
          ) : (
            <li>無資料</li>
          )}
        </ul>
        <div className={styles.partGlobalStatus}>
          {partReady ? (
            <div className={styles.partReady}>零件備妥</div>
          ) : (
            <div className={styles.partWarning}>備料未齊</div>
          )}
        </div>
      </div>

      <div className={styles.resultBlock}>
        <div className={styles.resultTitle}>模治具 (需準備)</div>
        <ul className={styles.resultList}>
          {(jigs ?? []).length > 0 ? (
            jigs.map((d, idx) => (
                <li key={idx}>
                  <div className={styles.jigStation}>{d.station}</div>
                  {d.code.split('\n').map((c, i) => {
                    const core = c
                      .toUpperCase()
                      .trim()
                      .split('(')[0]
                      .trim();
                    let dev: React.ReactNode = null;
                    for (const k in toolDeliveryMap) {
                      if (k === core || k.startsWith(core + '-')) {
                        dev = (
                          <span className={styles.deliveryText}>
                            ({fixDateDisplay(toolDeliveryMap[k])})
                          </span>
                        );
                        break;
                      }
                    }
                    return (
                      <div key={i} className={styles.jigCode}>
                        {c}
                        {dev}
                      </div>
                    );
                  })}
                </li>
              ))
          ) : (
            <li>無資料</li>
          )}
        </ul>
      </div>

      <div className={styles.resultBlock}>
        <div className={styles.resultTitle}>補材列表</div>
        <ul className={styles.resultList}>
          {(consumables ?? []).length > 0 ? (
            consumables.map((d, idx) => {
                const lotKey = d.code.trim().toUpperCase();
                const hasEntry =
                  !!lotKey &&
                  Object.prototype.hasOwnProperty.call(
                    materialLotDeliveryMap,
                    lotKey
                  );
                const raw = hasEntry ? materialLotDeliveryMap[lotKey] : '';
                const hasDelivery = !!(raw && String(raw).trim());

                let lotExtra: ReactNode = null;
                if (lotKey) {
                  if (hasEntry && hasDelivery) {
                    lotExtra = (
                      <span className={styles.deliveryText}>
                        ({fixDateDisplay(raw)})
                      </span>
                    );
                  } else {
                    lotExtra = (
                      <span className={styles.materialLotWarn}>
                        (採購交期未回覆，請確認)
                      </span>
                    );
                  }
                }
                return (
                  <li key={idx}>
                    {d.name}：<b>{d.code}</b>
                    {lotExtra}
                  </li>
                );
              })
          ) : (
            <li>無資料</li>
          )}
        </ul>
      </div>

      <div className={styles.resultBlock}>
        <div className={styles.resultTitle}>製程站點</div>
        <ul className={styles.resultList}>
          {(stations ?? []).length > 0 ? (
            stations.map((d) => {
                const isMatch =
                  matchedPdfStation && d.code === matchedPdfStation.code;
                return (
                  <li
                    key={d.code}
                    className={isMatch ? styles.liCurrentStation : ''}
                  >
                    <span className={styles.tagBadge}>{d.code}</span>
                    {d.name}
                    {isMatch && (
                      <span className={styles.currentStationLabel}>
                        目前站點
                      </span>
                    )}
                  </li>
                );
              })
          ) : (
            <li>無資料</li>
          )}
        </ul>
      </div>
    </div>
  );
}
