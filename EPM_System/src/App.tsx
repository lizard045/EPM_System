/**
 * 硬體 EPM 專案戰情室
 */

import { EPMProvider } from './context/EPMProvider';
import { useEPM } from './context/EPMContext';
import { DashboardView } from './views/DashboardView';
import { DetailView } from './views/DetailView';
import './App.css';

function AppContent() {
  const { currentProjectId, setCurrentProjectId } = useEPM();

  const handleOpenDetail = (projectId: number) => {
    setCurrentProjectId(projectId);
  };

  const handleCloseDetail = () => {
    setCurrentProjectId(null);
  };

  if (currentProjectId) {
    return (
      <DetailView projectId={currentProjectId} onClose={handleCloseDetail} />
    );
  }

  return <DashboardView onOpenDetail={handleOpenDetail} />;
}

function App() {
  return (
    <EPMProvider>
      <AppContent />
    </EPMProvider>
  );
}

export default App;
