import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HistoricalDataView } from '@/components/HistoricalData';
import { LiveDataView } from '@/components/LiveData';
import { ArbitrageView } from '@/components/ArbitrageView';
import { CoveredCallsView } from '@/components/CoveredCallsView';
import ArbitrageDetailsPage from '@/pages/ArbitrageDetailsPage';
// import { LiveMarketWatch } from '@/components/LiveMarketWatch';

type View = 'historical' | 'live' | 'arbitrage' | 'covered-calls' | 'live-watch';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current view from route
  const getCurrentView = (): View => {
    const path = location.pathname;
    if (path.startsWith('/arbitrage')) return 'arbitrage';
    if (path.startsWith('/historical')) return 'historical';
    if (path.startsWith('/live')) return 'live';
    if (path.startsWith('/covered-calls')) return 'covered-calls';
    return 'live-watch';
  };

  const [currentView, setCurrentView] = useState<View>(getCurrentView());

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    // Navigate to the corresponding route
    switch (view) {
      case 'historical':
        navigate('/historical');
        break;
      case 'live':
        navigate('/live');
        break;
      case 'arbitrage':
        navigate('/arbitrage');
        break;
      case 'covered-calls':
        navigate('/covered-calls');
        break;
      case 'live-watch':
        navigate('/');
        break;
    }
  };

  return (
    <Routes>
      {/* Arbitrage details page without layout */}
      <Route path="/arbitrage/:instrumentId/:date" element={<ArbitrageDetailsPage />} />

      {/* Main routes with layout */}
      <Route
        path="*"
        element={
          <Layout currentView={currentView} onViewChange={handleViewChange}>
            <Routes>
              <Route path="/historical" element={<HistoricalDataView />} />
              <Route path="/live" element={<LiveDataView />} />
              <Route path="/arbitrage" element={<ArbitrageView />} />
              <Route path="/covered-calls" element={<CoveredCallsView />} />
              <Route path="/" element={<ArbitrageView />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;