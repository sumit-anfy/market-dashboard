import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { HistoricalDataView } from '@/components/HistoricalData';
import { LiveDataView } from '@/components/LiveData';
import { ArbitrageView } from '@/components/ArbitrageView';
import { CoveredCallsView } from '@/components/CoveredCallsView';

type View = 'historical' | 'live' | 'arbitrage' | 'covered-calls';

function App() {
  const [currentView, setCurrentView] = useState<View>('historical');

  const renderView = () => {
    switch (currentView) {
      case 'historical':
        return <HistoricalDataView />;
      case 'live':
        return <LiveDataView />;
      case 'arbitrage':
        return <ArbitrageView />;
      case 'covered-calls':
        return <CoveredCallsView />;
      default:
        return <HistoricalDataView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;