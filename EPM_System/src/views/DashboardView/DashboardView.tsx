/**
 * 戰情儀表板
 */

import { HeaderPanel } from '../../components/HeaderPanel';
import { ProjectCard } from '../../components/ProjectCard';
import { ProjectTable } from '../../components/ProjectTable';
import {
  SearchFilterBar,
  useDashboardProjectFilter,
} from '../../components/SearchFilterBar';
import { useEPM } from '../../context/EPMContext';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  onOpenDetail: (projectId: number) => void;
}

export function DashboardView({ onOpenDetail }: DashboardViewProps) {
  const { viewMode } = useEPM();
  const {
    visibleProjects,
    activeCount,
    hasAnyActive,
    searchQuery,
    setSearchQuery,
    filters,
    onFiltersChange,
    sortModeLabel,
    onSortCycle,
    onResetFilters,
    priorityOptions,
    epmOptions,
    customerOptions,
    stationSelectOptions,
  } = useDashboardProjectFilter();

  const hasVisible = visibleProjects.length > 0;

  return (
    <div className={styles.dashboardView}>
      <HeaderPanel />
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={onFiltersChange}
        priorityOptions={priorityOptions}
        epmOptions={epmOptions}
        customerOptions={customerOptions}
        stationSelectOptions={stationSelectOptions}
        sortModeLabel={sortModeLabel}
        onSortCycle={onSortCycle}
        visibleCount={visibleProjects.length}
        totalCount={activeCount}
        onResetFilters={onResetFilters}
      />
      <div className={styles.dashboardArea}>
        {!hasAnyActive ? (
          <p className={styles.emptyMessage}>目前沒有進行中的傳票資料。</p>
        ) : !hasVisible ? (
          <p className={styles.emptyMessage}>沒有符合篩選條件的傳票。</p>
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
