import React from 'react';
import { Shield, AlertTriangle, Network, Landmark, Search, Stethoscope, GraduationCap, Server, Activity, BookOpen } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { detectCycle } from '../utils/cycleDetect';

export default function Dashboard() {
  const { state, computed, dispatch } = useSystem();
  
  const cycleExists = detectCycle(computed.nodes, state.edges)?.length > 0;
  
  const navigateTo = (mod) => dispatch({ type: 'SET_ACTIVE_MODULE', payload: mod });
  const loadPreset = (preset) => dispatch({ type: 'LOAD_PRESET', payload: preset });

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col gap-6 pt-8">
       <div className="text-center mb-8 shrink-0">
         <h1 className="text-4xl font-bold text-slate-100 mb-3 tracking-tight">OS Deadlock Simulator</h1>
         <p className="text-slate-400 font-medium text-lg">Interactive Educational Platform based on Operating System Concepts</p>
       </div>

       {/* System Status Banner */}
       <div className={`p-6 rounded-xl border flex items-center justify-between shadow-sm shrink-0 ${
          cycleExists ? 'bg-red-900/30 border-red-800/50' : 'bg-emerald-900/30 border-emerald-800/50'
       }`}>
          <div className="flex items-center gap-6">
             <div className={`p-4 rounded-full ${cycleExists ? 'bg-red-900/50' : 'bg-emerald-900/50'}`}>
                {cycleExists ? <AlertTriangle size={32} className="text-red-400"/> : <Shield size={32} className="text-emerald-400"/>}
             </div>
             <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">System State</h3>
                <div className={`text-2xl font-bold ${cycleExists ? 'text-red-400' : 'text-emerald-400'}`}>
                   {cycleExists ? 'DEADLOCK DETECTED' : 'SAFE / ACYCLIC'}
                </div>
             </div>
          </div>
          {cycleExists && (
             <button onClick={() => navigateTo('recovery')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-colors">
                Open Recovery Console →
             </button>
          )}
       </div>

       <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
          
          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col min-h-0 shadow-sm">
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 shrink-0">
               <Activity size={16}/> Learning Modules
             </h3>
             <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <button onClick={() => navigateTo('rag')} className="bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors group">
                   <Network className="text-slate-400 group-hover:text-blue-400" size={28}/>
                   <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400">RAG Builder</span>
                </button>
                <button onClick={() => navigateTo('bankers')} className="bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors group">
                   <Landmark className="text-slate-400 group-hover:text-blue-400" size={28}/>
                   <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400">Banker's Algorithm</span>
                </button>
                <button onClick={() => navigateTo('detection')} className="bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors group">
                   <Search className="text-slate-400 group-hover:text-blue-400" size={28}/>
                   <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400">Detection Engine</span>
                </button>
                <button onClick={() => navigateTo('recovery')} className="bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-colors group">
                   <Stethoscope className="text-slate-400 group-hover:text-blue-400" size={28}/>
                   <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400">Recovery Console</span>
                </button>
             </div>
          </div>

          {/* Textbook Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col shrink-0 shadow-sm">
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
               <BookOpen size={16}/> Textbook Scenarios
             </h3>
             <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Load classic scenarios from the Operating System Concepts textbook directly into the simulator to observe algorithm behavior.
             </p>
             <div className="space-y-4">
                <button onClick={() => loadPreset('fig73')} className="w-full bg-slate-800/50 border border-slate-700 hover:border-blue-500 p-4 rounded-xl text-left transition-colors group flex items-center justify-between">
                   <div>
                      <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">Load Classic Safe State</div>
                      <div className="text-sm text-slate-500 mt-1">Demonstrates a classic Banker's algorithm safe state with 5 processes and 3 resources.</div>
                   </div>
                   <Server size={20} className="text-slate-500 group-hover:text-blue-400"/>
                </button>
                <button onClick={() => loadPreset('fig74')} className="w-full bg-slate-800/50 border border-slate-700 hover:border-red-500 hover:bg-red-900/10 p-4 rounded-xl text-left transition-colors group flex items-center justify-between">
                   <div>
                      <div className="font-bold text-slate-200 group-hover:text-red-400 transition-colors">Load Unsafe State (Deadlock)</div>
                      <div className="text-sm text-slate-500 mt-1">Demonstrates a circular wait deadlock using 3 processes and 3 resources.</div>
                   </div>
                   <Server size={20} className="text-slate-500 group-hover:text-red-400"/>
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}
