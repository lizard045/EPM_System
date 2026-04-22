/**
 * 卡片內「出貨安全率 (pcs)」：傳票 qty + WIP 投料目標量／目前 Pcs／刻度（safe_pcs.md）
 */

import { useState } from 'react';
import type { ShippingSafetyRateViewModel } from '../../utils/shippingSafetyRateUtils';
import styles from './ShippingSafetyRateSection.module.css';

interface ShippingSafetyRateSectionProps {
  model: ShippingSafetyRateViewModel;
}

function formatPcs(n: number | null): string {
  if (n === null) return '—';
  return `${n} pcs`;
}

export function ShippingSafetyRateSection({ model }: ShippingSafetyRateSectionProps) {
  const [open, setOpen] = useState(true);

  const {
    demandPcs,
    currentWipPcs,
    targetFeedPcs,
    midPcs,
    currentPercent,
    demandPercent,
    midPercent,
    targetPercent,
    wipShortVsDemand,
    supplementPnl,
  } = model;

  const ticks: { pct: number; value: number | null; label: string; strong?: boolean }[] = [
    { pct: demandPercent, value: demandPcs, label: demandPcs !== null ? String(demandPcs) : '—', strong: true },
    { pct: midPercent, value: midPcs, label: midPcs !== null ? String(midPcs) : '—' },
    { pct: targetPercent, value: targetFeedPcs, label: targetFeedPcs !== null ? String(targetFeedPcs) : '—' },
  ].filter((t) => t.value !== null && t.pct > 0);

  const deduped: typeof ticks = [];
  const seen = new Set<number>();
  for (const t of ticks) {
    const key = Math.round(t.pct * 10) / 10;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(t);
  }

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
        <span className={styles.headTitle}>出貨安全率 ( pcs )</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden>
          ∨
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.currentPcs}>{formatPcs(currentWipPcs)}</div>

          <div className={styles.barTrack} aria-hidden>
            <div className={styles.barFill} style={{ width: `${currentPercent}%` }} />
            <span className={styles.tickOrigin}>0</span>
            {deduped.map((t) => (
              <span
                key={`${t.label}-${t.pct}`}
                className={`${styles.tick} ${t.strong ? styles.tickStrong : ''}`}
                style={{ left: `${t.pct}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>

          <div className={styles.demandRow}>
            <span className={styles.demandLabel}>
              需求量{' '}
              <span className={styles.demandValue}>{demandPcs !== null ? `${demandPcs} pcs` : '—'}</span>
            </span>
            {wipShortVsDemand && (
              <span className={styles.warnBox}>
                <span className={styles.warnIcon} aria-hidden>
                  ⚠
                </span>
                線上WIP數量不足
              </span>
            )}
          </div>

          <div className={styles.hintBox}>
            <div className={styles.hintTitle}>建議做法</div>
            {supplementPnl !== null ? (
              <ul className={styles.hintBullets}>
                <li>補投 {supplementPnl} pnl</li>
              </ul>
            ) : wipShortVsDemand ? (
              <p className={styles.muted}>請確認 WIP 已匯入「張數」與「投料目標量」，以換算補投 pnl。</p>
            ) : (
              <p className={styles.muted}>目前在站 Pcs 已達或高於傳票需求量。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
