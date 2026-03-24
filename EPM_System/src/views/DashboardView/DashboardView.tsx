/**
 * 戰情儀表板
 */

import { HeaderPanel } from '../../components/HeaderPanel';
import { ProjectCard } from '../../components/ProjectCard';
import { ProjectTable } from '../../components/ProjectTable';
import { useEPM } from '../../context/EPMContext';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  onOpenDetail: (projectId: number) => void;
}

export function DashboardView({ onOpenDetail }: DashboardViewProps) {
  const { projects, viewMode } = useEPM();
  const activeProjects = projects.filter((p) => !p.isArchived);

  return (
    <div className={styles.dashboardView}>
      <HeaderPanel />
      <div className={styles.dashboardArea}>
        {activeProjects.length === 0 ? (
          <p className={styles.emptyMessage}>目前沒有進行中的傳票資料。</p>
        ) : viewMode === 'card' ? (
          <div className={styles.dashboardContainer}>
            {activeProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => onOpenDetail(p.id)}
              />
            ))}
          </div>
        ) : (
          <ProjectTable
            projects={activeProjects}
            onRowClick={(p) => onOpenDetail(p.id)}
          />
        )}
      </div>
    </div>
  );
}
