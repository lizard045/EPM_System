/**
 * EPM 全域狀態管理
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import type { Project, ViewMode } from '../types';

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
  const [stationProgressMap, setStationProgressMap] = useState<Record<string, string>>(() =>
    loadFromStorage(STORAGE_KEYS.STATIONS, {})
  );
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
