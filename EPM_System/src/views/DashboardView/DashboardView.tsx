/**
 * 戰情儀表板
 */

import { useMemo, useState } from 'react';
import { HeaderPanel } from '../../components/HeaderPanel';
import { ProjectCard } from '../../components/ProjectCard';
import { ProjectTable } from '../../components/ProjectTable';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { useEPM } from '../../context/EPMContext';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  onOpenDetail: (projectId: number) => void;
}

function filterProjectsBySearch<T extends { mpn: string; workOrder: string }>(
  list: T[],
  rawQuery: string
): T[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return list;
  return list.filter((p) => {
    const mpn = (p.mpn || '').toLowerCase();
    const wo = (p.workOrder || '').toLowerCase();
    return mpn.includes(q) || wo.includes(q);
  });
}

export function DashboardView({ onOpenDetail }: DashboardViewProps) {
  const { projects, viewMode } = useEPM();
  const [searchQuery, setSearchQuery] = useState('');
  const activeProjects = projects.filter((p) => !p.isArchived);

  const visibleProjects = useMemo(
    () => filterProjectsBySearch(activeProjects, searchQuery),
    [activeProjects, searchQuery]
  );

  const hasAnyActive = activeProjects.length > 0;
  const hasVisible = visibleProjects.length > 0;

  return (
    <div className={styles.dashboardView}>
      <HeaderPanel />
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className={styles.dashboardArea}>
        {!hasAnyActive ? (
          <p className={styles.emptyMessage}>目前沒有進行中的傳票資料。</p>
        ) : !hasVisible ? (
          <p className={styles.emptyMessage}>沒有符合搜尋條件的傳票。</p>
        ) : viewMode === 'card' ? (
          <div className={styles.dashboardContainer}>
            {visibleProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => onOpenDetail(p.id)}
              />
            ))}
          </div>
        ) : (
          <ProjectTable
            projects={visibleProjects}
            onRowClick={(p) => onOpenDetail(p.id)}
          />
        )}
      </div>
    </div>
  );
}
