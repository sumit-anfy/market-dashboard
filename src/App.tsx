import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HistoricalDataView } from '@/components/HistoricalData';
import { LiveDataView } from '@/components/LiveData';
import { ArbitrageView } from '@/components/ArbitrageView';
import { CoveredCallsView } from '@/components/CoveredCallsView';
import ArbitrageDetailsPage from '@/pages/ArbitrageDetailsPage';
import CoveredCallsDetailsPage from '@/pages/CoveredCallsDetailsPage';
import { LoginPage } from '@/pages/LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { FloatingThemeToggle } from '@/components/FloatingThemeToggle';
// import { LiveMarketWatch } from '@/components/LiveMarketWatch';

type View = 'historical' | 'live' | 'arbitrage' | 'covered-calls' | 'live-watch';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stage } = useAuth();

  // Determine current view from route
  const getCurrentView = (): View => {
    const path = location.pathname;
    if (path.startsWith('/login')) return 'live-watch';
    if (path.startsWith('/arbitrage')) return 'arbitrage';
    if (path.startsWith('/historical')) return 'historical';
    if (path.startsWith('/live')) return 'live';
    if (path.startsWith('/covered-calls')) return 'covered-calls';
    return 'live-watch';
  };

  const [currentView, setCurrentView] = useState<View>(getCurrentView());

  useEffect(() => {
    setCurrentView(getCurrentView());
  }, [location.pathname]);

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

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (stage === 'authenticated') {
      return children;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <>
      <Routes>
        {/* Arbitrage details page without layout */}
        <Route
          path="/arbitrage/:instrumentId/:date"
          element={
            <ProtectedRoute>
              <ArbitrageDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Covered Calls details page without layout */}
        <Route
          path="/covered-calls-details/:instrumentId"
          element={
            <ProtectedRoute>
              <CoveredCallsDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Main routes with layout */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout currentView={currentView} onViewChange={handleViewChange}>
                <Routes>
                  <Route path="/historical" element={<HistoricalDataView />} />
                  <Route path="/live" element={<LiveDataView />} />
                  <Route path="/arbitrage" element={<ArbitrageView />} />
                  <Route path="/covered-calls" element={<CoveredCallsView />} />
                  <Route path="/" element={<ArbitrageView />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <FloatingThemeToggle />
    </>
  );
}

export default App;
