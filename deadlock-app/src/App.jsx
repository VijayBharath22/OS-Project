import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X } from 'lucide-react';
import SystemModel from './components/SystemModel';
import RAGBuilder from './components/RAGBuilder';
import BankersAlgorithm from './components/BankersAlgorithm';
import Detection from './components/Detection';
import Recovery from './components/Recovery';
import Quiz from './components/Quiz';
import Dashboard from './components/Dashboard';

import Sidebar from './components/layout/Sidebar';
import TopStatusBar from './components/layout/TopStatusBar';
import BottomTerminal from './components/layout/BottomTerminal';
import { useSystem } from './context/SystemContext';

function App() {
  const { state } = useSystem();
  
  const renderModule = () => {
    switch (state.activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'model': return <SystemModel />;
      case 'rag': return <RAGBuilder />;
      case 'bankers': return <BankersAlgorithm />;
      case 'detection': return <Detection />;
      case 'recovery': return <Recovery />;
      case 'quiz': return <Quiz />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      <Sidebar />
      <div className="flex flex-col flex-1 relative z-10 min-w-0">
        <TopStatusBar />
        <main className="flex-1 overflow-y-auto relative p-6 custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div
               key={state.activeModule}
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
