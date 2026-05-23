import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SystemModel from './components/SystemModel';
import RAGBuilder from './components/RAGBuilder';
import BankersAlgorithm from './components/BankersAlgorithm';
import Detection from './components/Detection';
import Recovery from './components/Recovery';
import Quiz from './components/Quiz';
import Dashboard from './components/Dashboard';
import Prevention from './components/Prevention';
import Introduction from './components/Introduction';
import CoffmanConditions from './components/CoffmanConditions';

import Sidebar from './components/layout/Sidebar';
import TopStatusBar from './components/layout/TopStatusBar';
import BottomTerminal from './components/layout/BottomTerminal';
import GlobalAlerts from './components/layout/GlobalAlerts';
import useSimulationStore from './store/useSimulationStore';

function App() {
  const activeModule = useSimulationStore((state) => state.activeModule);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'introduction': return <Introduction />;
      case 'model': return <SystemModel />;
      case 'rag': return <RAGBuilder />;
      case 'coffman': return <CoffmanConditions />;
      case 'prevention': return <Prevention />;
      case 'bankers': return <BankersAlgorithm />;
      case 'detection': return <Detection />;
      case 'recovery': return <Recovery />;
      case 'quiz': return <Quiz />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      <GlobalAlerts />
      <Sidebar />
      <div className="flex flex-col flex-1 relative z-10 min-w-0">
        <TopStatusBar />
        <main className="flex-1 overflow-y-auto relative p-6 custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeModule}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="h-full flex flex-col"
             >
                {renderModule()}
             </motion.div>
           </AnimatePresence>
        </main>
        <BottomTerminal />
      </div>
    </div>
  )
}

export default App;
