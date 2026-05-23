import React, { useState } from 'react';
import { LayoutDashboard, Network, Landmark, Search, Stethoscope, HelpCircle, Activity, Info, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import useSimulationStore, { useComputedSystemState } from '../../store/useSimulationStore';

export default function Sidebar() {
  const activeModule = useSimulationStore((state) => state.activeModule);
  const setActiveModule = useSimulationStore((state) => state.setActiveModule);
  const visitedModules = useSimulationStore((state) => state.visitedModules);
  const [isHovered, setIsHovered] = useState(false);

  const { hasDeadlock } = useComputedSystemState();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/>, step: null },
    { id: 'introduction', label: 'Introduction', icon: <Info size={20}/>, step: 1 },
    { id: 'rag', label: 'RAG Builder', icon: <Network size={20}/>, step: 2 },
    { id: 'coffman', label: 'Coffman Conditions', icon: <AlertTriangle size={20}/>, step: 3 },
    { id: 'prevention', label: 'Deadlock Prevention', icon: <ShieldCheck size={20}/>, step: 4 },
    { id: 'bankers', label: "Deadlock Avoidance", icon: <Landmark size={20}/>, step: 5 },
    { id: 'detection', label: 'Detection Engine', icon: <Search size={20}/>, step: 6 },
    { id: 'recovery', label: 'Recovery Strategy', icon: <Stethoscope size={20}/>, step: 7 },
    { id: 'quiz', label: 'Interactive Challenges', icon: <HelpCircle size={20}/>, step: 8 },
  ];

  return (
    <motion.div
      className="bg-slate-900 border-r border-slate-800 flex flex-col relative z-50 shadow-md text-slate-300"
      initial={{ width: 64 }}
      animate={{ width: isHovered ? 260 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-12 border-b border-slate-800 flex items-center px-4 overflow-hidden shrink-0 bg-slate-950">
        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 border transition-colors ${hasDeadlock ? 'bg-red-500/20 border-red-500/50' : 'bg-blue-500/20 border-blue-500/50'}`}>
          <Activity size={16} className={hasDeadlock ? 'text-red-400 animate-pulse' : 'text-blue-400'} />
        </div>
        <h1 className="font-bold text-slate-100 tracking-wider text-lg ml-3 whitespace-nowrap opacity-90">
          OS Simulator
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1.5 px-2 custom-scrollbar">
        {navItems.map(item => {
          const isActive = activeModule === item.id;
          const isVisited = visitedModules.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center px-2.5 py-2.5 rounded-lg transition-all duration-200 relative group overflow-hidden ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              {isActive && <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}

              <div className={`shrink-0 relative z-10 ${isActive ? 'text-white' : 'group-hover:text-slate-200'}`}>
                {item.icon}
              </div>

              <div className="ml-3 flex items-center justify-between w-[180px] shrink-0">
                <div className="flex items-center gap-2">
                  {item.step && (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${
                      isActive ? 'bg-white/20 border-white/30 text-white' :
                      isVisited ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-500' :
                      'bg-slate-800 border-slate-700 text-slate-600'
                    }`}>
                      {isVisited && !isActive ? <CheckCircle2 size={10}/> : item.step}
                    </span>
                  )}
                  <span className="font-bold text-sm tracking-wide whitespace-nowrap">{item.label}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
