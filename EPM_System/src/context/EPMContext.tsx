/**
 * EPM 全域 Context
 */

import { createContext, useContext } from 'react';
import type { Project, ViewMode } from '../types';

export interface EPMStore {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  toolDeliveryMap: Record<string, string>;
  setToolDeliveryMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  partDeliveryMap: Record<string, string>;
  setPartDeliveryMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  stationProgressMap: Record<string, string>;
  setStationProgressMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentProjectId: number | null;
  setCurrentProjectId: (id: number | null) => void;
  updateProject: (id: number, updates: Partial<Project>) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  clearAllData: () => void;
}

export const EPMContext = createContext<EPMStore | null>(null);

export function useEPM(): EPMStore {
  const ctx = useContext(EPMContext);
  if (!ctx) throw new Error('useEPM must be used within EPMProvider');
  return ctx;
}
