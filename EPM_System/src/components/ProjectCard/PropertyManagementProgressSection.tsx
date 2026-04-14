/**
 * 卡片內「物管進度」：零件 / 模治具 / 補材 入料比例
 */

import { useState } from 'react';
import {
  type PropertyManagementProgressModel,
  type PropertyPendingItem,
  type PropertyProgressCategory,
} from '../../utils/propertyManagementProgressUtils';
import styles from './PropertyManagementProgressSection.module.css';

interface PropertyManagementProgressSectionProps {
  model: PropertyManagementProgressModel;
  pdfParsed: boolean;
}

function SegmentBar({ cat }: { cat: PropertyProgressCategory }) {
  const total = cat.hasTravelerItems && cat.total > 0 ? cat.total : 4;
  const filled = cat.hasTravelerItems && cat.total > 0
    ? Math.min(cat.received, cat.total)
    : 0;

  return (
    <div className={styles.segmentTrack} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`${styles.segment} ${i < filled ? styles.segmentFilled : ''}`}
        />
      ))}
    </div>
  );
}

function PendingIcon({ kind }: { kind: PropertyPendingItem['kind'] }) {
  if (kind === 'consumable') {
    return (
      <svg className={styles.pendingIconSvg} viewBox="0 0 16 16" aria-hidden>
        <path
          fill="currentColor"
          d="M8 1 2 4v8l6 3 6-3V4L8 1zm0 1.6L12.7 4 8 6.4 3.3 4 8 2.6zM3 5.3l4 1.8v4.6l-4-2V5.3zm10 0v4.4l-4 2V7.1l4-1.8z"
        />
      </svg>
    );
  }
  return (
    <svg className={styles.pendingIconSvg} viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M4 1.5h8c.55 0 1 .45 1 1v11c0 .55-.45 1-1 1H4c-.55 0-1-.45-1-1v-11c0-.55.45-1 1-1zm0 2v9h8v-9H4zm1 1.5h6v1H5v-1zm0 2h6v1H5v-1zm0 2h4v1H5v-1z"
      />
    </svg>
  );
}

function rowHint(cat: PropertyProgressCategory, pdfParsed: boolean): string | null {
  if (!pdfParsed) {
    return '匯入手順書後顯示';
  }
  if (!cat.hasTravelerItems) {
    if (cat.label === '零件') return '手順書無零件項';
    if (cat.label === '模治具') return '手順書無模治具項';
    return '手順書無補材項';
  }
  if (cat.label === '零件' && !cat.hasExcelHint) {
    return '尚無傳票對應之零件備料進度';
  }
  if (cat.label === '模治具' && !cat.hasExcelHint) {
    return '尚無工具交期表資料';
  }
  if (cat.label === '補材' && !cat.hasExcelHint) {
    return '尚無補材／缺料表採購交期';
  }
  return null;
}

export function PropertyManagementProgressSection({
  model,
  pdfParsed,
}: PropertyManagementProgressSectionProps) {
  const [open, setOpen] = useState(true);
  const rows = [model.parts, model.tooling, model.consumables];

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
        <span className={styles.headTitle}>物管進度</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden>
          ∨
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          {rows.map((cat) => {
            const hint = rowHint(cat, pdfParsed);
            return (
              <div key={cat.label} className={styles.row}>
                <span className={styles.rowLabel}>{cat.label}</span>
                <div className={styles.rowBlock}>
                  <SegmentBar cat={cat} />
                  {hint && <div className={styles.hint}>{hint}</div>}
                </div>
              </div>
            );
          })}

          {pdfParsed && model.pendingItems.length > 0 && (
            <div className={styles.pendingSection}>
              {model.pendingItems.map((item) => (
                <div key={item.key} className={styles.pendingRow}>
                  <span className={styles.pendingIcon} aria-hidden>
                    <PendingIcon kind={item.kind} />
                  </span>
                  <span className={styles.pendingStatus}>{item.statusLabel}</span>
                  <span className={styles.pendingTitle}>{item.title}</span>
                  <span className={styles.pendingRef}>{item.refId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
