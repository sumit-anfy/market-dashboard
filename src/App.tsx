import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { HistoricalDataView } from '@/components/HistoricalData';
import { LiveDataView } from '@/components/LiveData';

type View = 'historical' | 'live';

function App() {
  const [currentView, setCurrentView] = useState<View>('historical');

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'historical' ? <HistoricalDataView /> : <LiveDataView />}
    </Layout>
  );
}

export default App;