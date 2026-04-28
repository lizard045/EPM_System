/**
 * Traveler 手順書解析結果區塊
 */

import type { ReactNode } from 'react';
import {
  findMatchingPdfStation,
  fixDateDisplay,
  isMaterialCompletionStation,
  lookupWorkOrderMap,
  matchWipToTravelerStation,
  resolveMaterialWipAgainstRoutes,
  resolveWipSnapshot,
  resolveWipSnapshotByWorkOrderKey,
} from '../../utils';
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
    wipByWorkOrder,
  } = useEPM();

  if (!project.pdfParsed || !project.pdfData) return null;

  const { parts, jigs, consumables, stations } = project.pdfData;
  const materialRoutes = project.pdfData.materialRoutes ?? [];

  const materialWoKey =
    project.materialWorkOrder?.trim() || project.workOrder?.trim() || '';
  const materialWipSnap = resolveWipSnapshotByWorkOrderKey(
    wipByWorkOrder,
    materialWoKey || undefined,
    project.mpn
  );
  const materialResolution = resolveMaterialWipAgainstRoutes(
    materialWipSnap,
    materialRoutes
  );
  const prog = partDeliveryMap[project.formNo?.toUpperCase() ?? ''] ?? '';
  const wipSnap = resolveWipSnapshot(wipByWorkOrder, project);
  let wipStation = lookupWorkOrderMap(stationProgressMap, project.workOrder) ?? null;
  if (!wipStation?.trim() && wipSnap?.engineeringStation?.trim()) {
    wipStation = String(wipSnap.engineeringStation).trim();
  }
  let matchedPdfStation =
    wipSnap && stations?.length ? matchWipToTravelerStation(wipSnap, stations) : null;
  if (!matchedPdfStation && wipStation && stations?.length) {
    matchedPdfStation = findMatchingPdfStation(wipStation, stations);
  }

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
                    let matchedKey: string | null = null;
                    for (const k in toolDeliveryMap) {
                      if (k === core || k.startsWith(core + '-')) {
                        matchedKey = k;
                        break;
                      }
                    }
                    let dev: ReactNode;
                    if (matchedKey != null) {
                      const val = toolDeliveryMap[matchedKey];
                      if (val && String(val).trim()) {
                        dev = (
                          <span className={styles.deliveryText}>
                            ({fixDateDisplay(val)})
                          </span>
                        );
                      } else {
                        dev = (
                          <span className={styles.jigNoDelivery}>(尚無交期)</span>
                        );
                      }
                    } else {
                      dev = (
                        <span className={styles.jigNoDelivery}>(尚無交期)</span>
                      );
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
        <div className={styles.resultTitle}>材料（手順書 材）</div>
        {materialRoutes.length > 0 ? (
          <ul className={styles.resultList}>
            {materialRoutes.map((g) => {
                const hasWip = !!(
                  materialWipSnap && materialResolution.matchedStation
                );
                return (
                  <li key={g.segmentCode + g.titleLine}>
                    <div className={styles.materialSegmentTitle}>
                      {g.titleLine}
                    </div>
                    <ul className={styles.materialSubList}>
                      {g.stations.map((s) => {
                        const isThis =
                          hasWip &&
                          materialResolution.matchedSegmentCode ===
                            g.segmentCode &&
                          s.code === materialResolution.matchedStation?.code;
                        const done = isMaterialCompletionStation(s);
                        return (
                          <li
                            key={g.segmentCode + s.code + s.name}
                            className={isThis ? styles.materialLiCurrentStation : ''}
                          >
                            <span className={styles.tagBadge}>{s.code}</span>
                            {s.name}
                            {isThis && done && (
                              <span className={styles.materialDoneBadge}>
                                已完工
                              </span>
                            )}
                            {isThis && !done && (
                              <span className={styles.materialAtStationLabel}>
                                目前站點
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
          </ul>
        ) : (
          <p className={styles.materialEmpty}>
            此手順書未含「手順書(材)」工作表
          </p>
        )}
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
                        (尚無採購交期)
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
