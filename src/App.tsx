import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { HistoricalDataView } from '@/components/HistoricalData';
import { LiveDataView } from '@/components/LiveData';
import { ArbitrageView } from '@/components/ArbitrageView';
import { CoveredCallsView } from '@/components/CoveredCallsView';
// import { LiveMarketWatch } from '@/components/LiveMarketWatch';

type View = 'historical' | 'live' | 'arbitrage' | 'covered-calls' | 'live-watch';

function App() {
  const [currentView, setCurrentView] = useState<View>('live-watch');

  const renderView = () => {
    switch (currentView) {
      case 'historical':
        return <HistoricalDataView />;
      case 'live':
        return <LiveDataView />;
      // case 'live-watch':
      //   return <LiveMarketWatch />;
      case 'arbitrage':
        return <ArbitrageView />;
      case 'covered-calls':
        return <CoveredCallsView />;
      default:
        return <ArbitrageView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;