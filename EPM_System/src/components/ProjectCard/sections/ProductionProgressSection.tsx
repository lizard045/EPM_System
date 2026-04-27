/**
 * 卡片內「生產進度」區塊（對應 WIP 與手順書站點）
 */

import { useState } from 'react';
import type { ProductionProgressViewModel } from '../../../utils';
import styles from './ProductionProgressSection.module.css';

const STEPPER_LABELS = ['待投入', '生產中', '產出待移出'] as const;

interface ProductionProgressSectionProps {
  model: ProductionProgressViewModel;
}

export function ProductionProgressSection({ model }: ProductionProgressSectionProps) {
  const [open, setOpen] = useState(true);

  const { currentStep, totalSteps, percent, hasTotalFromTraveler, travelerProgressMatched } = model;
  const canShowTravelerRatio = hasTotalFromTraveler && travelerProgressMatched;

  const countLabel = hasTotalFromTraveler
    ? travelerProgressMatched
      ? `${currentStep} / ${totalSteps} 站數`
      : `— / ${totalSteps} 站數（手順書無對應站點）`
    : currentStep > 0
      ? `在站步驟 ${currentStep}（匯入手順書後顯示總站數）`
      : '—';

  const showCurrentMark = canShowTravelerRatio && percent > 0 && percent < 100;

  return (
    <div
      className={styles.wrap}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <button
        type="button"
        className={styles.head}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
      >
        <span className={styles.headTitle}>生產進度</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden>
          ∨
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.metricsRow}>
            <span className={styles.percent}>
              {canShowTravelerRatio ? `${percent}%` : '—'}
            </span>
            <span className={styles.stationCount}>( {countLabel} )</span>
          </div>

          <div className={styles.barTrack} aria-hidden>
            <div
              className={styles.barBlue}
              style={{ width: `${canShowTravelerRatio ? percent : 0}%` }}
            />
            {showCurrentMark && (
              <div
                className={styles.barCurrent}
                style={{ left: `calc(${percent}% - 3px)`, width: '6px' }}
              />
            )}
          </div>

          <div className={styles.dateRow}>
            <span>{model.startDateDisplay}</span>
            <span>{model.endDateDisplay}</span>
          </div>

          <div className={styles.statusBlock} aria-label="WIP 生產中狀態 IPQC">
            <div className={styles.statusBlockLabel}>
              {model.ipqcUiMode === 'override' &&
              model.ipqcStatus &&
              String(model.ipqcStatus).trim() &&
              String(model.ipqcStatus).trim() !== '—'
                ? model.ipqcStatus 
                : '生產中狀態 IPQC'}
            </div>
            <div className={styles.statusBlockValue}>
              {model.ipqcStatus?.trim() ? model.ipqcStatus : '—'}
            </div>
          </div>

          <div className={styles.processRow}>
            <div className={styles.processLeft}>
              <div className={styles.processName}>{model.processName}</div>
            </div>
            <div className={styles.hours}>{model.hoursDisplay}</div>
          </div>

          {model.ipqcUiMode === 'standard' && model.ipqcStandardStep !== null && (
            <div className={styles.flowRefSection}>
              <div className={styles.flowRefLabel}>
                生產流程階段
              </div>
              <div className={styles.stepper} role="list">
                {STEPPER_LABELS.map((label, i) => (
                  <div key={label} className={styles.stepperItem} role="listitem">
                    {i > 0 && <span className={styles.stepperArrow} aria-hidden>{'›'}</span>}
                    <span
                      className={
                        i === model.ipqcStandardStep ? styles.stepperActive : styles.stepperMuted
                      }
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
