/**
 * EPM 全域狀態管理
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import type { WipSnapshot } from '../parsers/excelParser';
import type { Project, ViewMode } from '../types';

/** 還原舊版誤把 parseStationExcel 整包 merge 進 STATIONS 的資料 */
function splitPersistedStations(raw: unknown): {
  stations: Record<string, string>;
  embeddedWip: Record<string, WipSnapshot>;
} {
  const stations: Record<string, string> = {};
  let embeddedWip: Record<string, WipSnapshot> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { stations, embeddedWip };
  }
  const o = raw as Record<string, unknown>;
  const nestSt = o.stationByWorkOrder;
  const nestWip = o.wipByWorkOrder;
  if (typeof nestSt === 'object' && nestSt !== null && !Array.isArray(nestSt)) {
    Object.assign(stations, nestSt as Record<string, string>);
  }
  if (typeof nestWip === 'object' && nestWip !== null && !Array.isArray(nestWip)) {
    embeddedWip = { ...(nestWip as Record<string, WipSnapshot>) };
  }
  for (const [k, v] of Object.entries(o)) {
    if (k === 'stationByWorkOrder' || k === 'wipByWorkOrder') continue;
    if (typeof v === 'string') stations[k] = v;
  }
  return { stations, embeddedWip };
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useEPMStore() {
  const [projects, setProjects] = useState<Project[]>(() =>
    loadFromStorage(STORAGE_KEYS.PROJECTS, [])
  );
  const [toolDeliveryMap, setToolDeliveryMap] = useState<Record<string, string>>(() =>
    loadFromStorage(STORAGE_KEYS.TOOLS, {})
  );
  const [partDeliveryMap, setPartDeliveryMap] = useState<Record<string, string>>(() =>
    loadFromStorage(STORAGE_KEYS.PARTS, {})
  );
  const [stationProgressMap, setStationProgressMap] = useState<Record<string, string>>(() => {
    const split = splitPersistedStations(loadFromStorage(STORAGE_KEYS.STATIONS, {}));
    return split.stations;
  });
  const [wipByWorkOrder, setWipByWorkOrder] = useState<Record<string, WipSnapshot>>(() => {
    const split = splitPersistedStations(loadFromStorage(STORAGE_KEYS.STATIONS, {}));
    const fileWip = loadFromStorage<Record<string, WipSnapshot>>(STORAGE_KEYS.WIP_SNAPSHOTS, {});
    return { ...split.embeddedWip, ...fileWip };
  });
  const [materialLotDeliveryMap, setMaterialLotDeliveryMap] = useState<Record<string, string>>(
    () => loadFromStorage(STORAGE_KEYS.MATERIAL_LOT, {})
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode) || 'card'
  );
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  // 同步到 localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
  }, [projects]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TOOLS, toolDeliveryMap);
  }, [toolDeliveryMap]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PARTS, partDeliveryMap);
  }, [partDeliveryMap]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STATIONS, stationProgressMap);
  }, [stationProgressMap]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.WIP_SNAPSHOTS, wipByWorkOrder);
  }, [wipByWorkOrder]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MATERIAL_LOT, materialLotDeliveryMap);
  }, [materialLotDeliveryMap]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  const updateProject = useCallback((id: number, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const addProject = useCallback((project: Omit<Project, 'id'>) => {
    const id = Date.now() + Math.random();
    setProjects((prev) => [
      ...prev,
      {
        ...project,
        id,
        createdAt: project.createdAt ?? new Date().toISOString(),
        priority: project.priority ?? '一般',
        epmName: project.epmName ?? '',
        customer: project.customer ?? '',
      },
    ]);
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.clear();
    setProjects([]);
    setToolDeliveryMap({});
    setPartDeliveryMap({});
    setStationProgressMap({});
    setWipByWorkOrder({});
    setMaterialLotDeliveryMap({});
    setCurrentProjectId(null);
  }, []);

  return {
    projects,
    setProjects,
    toolDeliveryMap,
    setToolDeliveryMap,
    partDeliveryMap,
    setPartDeliveryMap,
    stationProgressMap,
    setStationProgressMap,
    wipByWorkOrder,
    setWipByWorkOrder,
    materialLotDeliveryMap,
    setMaterialLotDeliveryMap,
    viewMode,
    setViewMode,
    currentProjectId,
    setCurrentProjectId,
    updateProject,
    addProject,
    clearAllData,
  };
}
