import React, { useState } from 'react';
import { LayoutDashboard, Cpu, Network, Landmark, Shield, Search, Stethoscope, HelpCircle, GraduationCap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSystem } from '../../context/SystemContext';

export default function Sidebar() {
  const { state, dispatch } = useSystem();
  const [isHovered, setIsHovered] = useState(false);

  const handleNav = (mod) => {
      dispatch({ type: 'SET_ACTIVE_MODULE', payload: mod });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/> },
    { id: 'rag', label: 'RAG Builder', icon: <Network size={20}/> },
    { id: 'bankers', label: "Banker's Algorithm", icon: <Landmark size={20}/> },
    { id: 'detection', label: 'Detection Engine', icon: <Search size={20}/> },
    { id: 'recovery', label: 'Recovery Strategy', icon: <Stethoscope size={20}/> },
    { id: 'quiz', label: 'Quiz / Practice', icon: <HelpCircle size={20}/> },
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
         <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/50">
            <Activity size={16} className="text-blue-400" />
         </div>
         <h1 className="font-bold text-slate-100 tracking-wider text-lg ml-3 whitespace-nowrap opacity-90">
            OS Simulator
         </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-2 px-2 custom-scrollbar">
        {navItems.map(item => {
          const isActive = state.activeModule === item.id;
          return (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`w-full flex items-center px-2.5 py-3 rounded-lg transition-all duration-200 relative group overflow-hidden ${
              isActive 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-transparent'
            }`}
          >
            {isActive && <motion.div layoutId="activeNav" className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}

            <div className={`shrink-0 relative z-10 ${isActive ? 'text-white' : 'group-hover:text-slate-200'}`}>
               {item.icon}
            </div>

            <div className="ml-4 flex items-center justify-between w-[180px] shrink-0">
               <span className="font-bold text-sm tracking-wide whitespace-nowrap">{item.label}</span>
            </div>
          </button>
        )})}
      </div>

    </motion.div>
  );
}
