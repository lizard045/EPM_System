/**
 * EPM Provider - 提供全域狀態
 */

import { EPMContext } from './EPMContext';
import { useEPMStore } from '../hooks/useEPMStore';

interface EPMProviderProps {
  children: React.ReactNode;
}

export function EPMProvider({ children }: EPMProviderProps) {
  const store = useEPMStore();
  return <EPMContext.Provider value={store}>{children}</EPMContext.Provider>;
}
