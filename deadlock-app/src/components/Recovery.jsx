import React, { useMemo, useState } from 'react';
import { Stethoscope, Trash2, ShieldAlert, Activity, RefreshCw, Crosshair, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '../context/SystemContext';
import { detectCycle } from '../utils/cycleDetect';

export default function Recovery() {
  const { state, computed, dispatch } = useSystem();
  const { nodes } = computed;
  const { edges } = state;
  const [activeTab, setActiveTab] = useState('diagnostics');

  const cycleNodes = useMemo(() => detectCycle(nodes, edges) || [], [nodes, edges]);

  const deadlockedProcesses = cycleNodes.filter(id => {
     const n = nodes.find(n => n.id === id);
     return n && n.type === 'process';
  });

  const processScores = useMemo(() => {
     const scores = {};
     deadlockedProcesses.forEach(pId => {
        const held = edges.filter(e => e.type === 'assignment' && e.target === pId).length;
        const requested = edges.filter(e => e.type === 'request' && e.source === pId).length;
        scores[pId] = (held * 10) - (requested * 5); // Simple heuristic
     });
     return scores;
  }, [deadlockedProcesses, edges]);

  const bestVictim = Object.keys(processScores).sort((a,b) => processScores[b] - processScores[a])[0];

  const abortProcess = (id) => {
     dispatch({ type: 'ADD_LOG', payload: { msg: `> RECOVERY: Terminated Process ${id}. Released all resources.`, type: 'warning' } });
     dispatch({ type: 'REMOVE_PROCESS', payload: id });
  };

  const preemptResource = (processId, resourceId) => {
     const edge = edges.find(e => e.type === 'assignment' && e.source === resourceId && e.target === processId);
     if (edge) {
         dispatch({ type: 'ADD_LOG', payload: { msg: `> RECOVERY: Preempted ${resourceId} from ${processId}.`, type: 'warning' } });
         dispatch({ type: 'REMOVE_EDGE', payload: { exact: edge } });
     }
  };

  const tabs = [
     { id: 'diagnostics', label: 'Recovery Strategy', icon: <Crosshair size={16}/> },
     { id: 'terminate', label: 'Process Termination', icon: <Trash2 size={16}/> },
     { id: 'preempt', label: 'Resource Preemption', icon: <RefreshCw size={16}/> },
  ];

  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto">
      
      {/* Module Header & Internal Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 pt-6 shrink-0 shadow-sm rounded-t-xl">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-900/50 rounded-lg border border-blue-800">
               <Stethoscope className="text-blue-400" size={24}/>
            </div>
            <div>
               <h2 className="text-2xl font-bold tracking-tight text-slate-100">Deadlock Resolution</h2>
               <p className="text-sm font-medium text-slate-400">Heuristic Recovery & Mitigation Strategies</p>
            </div>
         </div>

         <div className="flex gap-4">
            {tabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${
                     activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
               >
                  {tab.icon} {tab.label}
                  {activeTab === tab.id && (
                     <motion.div layoutId="recoveryTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t" />
                  )}
               </button>
            ))}
         </div>
      </div>

      {/* Module Content Area */}
      <div className="flex-1 bg-slate-900 border border-t-0 border-slate-800 rounded-b-xl relative overflow-hidden flex flex-col min-h-0 shadow-sm">
         <AnimatePresence mode="wait">

            {activeTab === 'diagnostics' && (
               <motion.div key="diagnostics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col items-center justify-center bg-slate-950">
                  
                  {deadlockedProcesses.length === 0 ? (
                     <div className="text-center py-12 bg-slate-900 border border-slate-800 p-12 rounded-2xl shadow-sm w-full max-w-lg">
                        <ShieldAlert size={64} className="mx-auto text-emerald-400 mb-6" />
                        <h3 className="text-2xl font-bold text-slate-100 mb-2">System Optimal</h3>
                        <p className="text-slate-400 text-sm">No circular wait detected. The recovery strategies remain offline until a deadlock is formed.</p>
                     </div>
                  ) : (
                     <div className="max-w-2xl w-full">
                        <div className="text-center py-8 bg-slate-900 border border-slate-800 rounded-t-2xl shadow-sm">
                           <Activity size={48} className="mx-auto text-red-400 mb-4" />
                           <h3 className="text-xl font-bold text-slate-100 mb-1">Deadlock Detected</h3>
                           <p className="text-slate-400 text-sm">Heuristic intervention recommended.</p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 p-8 rounded-b-2xl shadow-sm border-t-0">
                           <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2 uppercase tracking-wider justify-center">
                              <Target size={18}/> Victim Selection Strategy
                           </h3>
                           
                           <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-center shadow-sm">
                              <div className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Optimal Termination Target</div>
                              <div className="text-5xl font-black text-blue-400 mb-6">{bestVictim}</div>
                              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-8 bg-slate-950 p-4 rounded-lg border border-slate-800">
                                 Terminating <strong>{bestVictim}</strong> provides the highest recovery yield (Score: {processScores[bestVictim]}). 
                                 It holds the most resources while requesting the fewest, minimizing collateral rollback cost in the system.
                              </p>
                              <button onClick={() => abortProcess(bestVictim)} className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg text-sm font-bold shadow-sm transition-all uppercase tracking-wider">
                                 Execute Termination
                              </button>
                           </div>
                        </div>
                     </div>
                  )}
               </motion.div>
            )}

            {activeTab === 'terminate' && (
               <motion.div key="terminate" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col items-center bg-slate-950">
                  <div className="max-w-2xl w-full">
                     <div className="text-center mb-8 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-100 mb-2">Process Termination</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Forcefully abort a deadlocked process to break the circular wait and release its held resources back to the pool.</p>
                     </div>

                     {deadlockedProcesses.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                           <ShieldAlert size={48} className="mx-auto text-emerald-400 mb-4 opacity-50" />
                           <p className="text-slate-500 font-medium">No deadlocked processes available for termination.</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {deadlockedProcesses.map(p => (
                              <div key={p} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-2xl text-slate-300 border border-slate-800 shadow-inner">
                                       {p}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-xs text-slate-500 tracking-wider uppercase font-bold">Target Process</span>
                                       <span className="text-sm text-blue-400 font-bold bg-blue-900/30 px-2 py-1 rounded w-fit">Heuristic Score: {processScores[p]}</span>
                                    </div>
                                 </div>
                                 <button onClick={() => abortProcess(p)} className="bg-red-900/30 border border-red-800/50 hover:bg-red-600 hover:text-white text-red-400 px-6 py-3 rounded-lg text-sm font-bold transition-colors uppercase tracking-wider">
                                    Abort Process
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </motion.div>
            )}

            {activeTab === 'preempt' && (
               <motion.div key="preempt" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col items-center bg-slate-950">
                  <div className="max-w-2xl w-full">
                     <div className="text-center mb-8 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-100 mb-2">Resource Preemption</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Forcefully seize an assigned resource from a deadlocked process without terminating it.</p>
                     </div>

                     {deadlockedProcesses.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                           <ShieldAlert size={48} className="mx-auto text-emerald-400 mb-4 opacity-50" />
                           <p className="text-slate-500 font-medium">No active deadlock. Preemption unavailable.</p>
                        </div>
                     ) : state.prevention.noPreemption ? (
                        <div className="text-center py-12 border-2 border-dashed border-orange-800 rounded-2xl bg-orange-900/30">
                           <RefreshCw size={48} className="mx-auto text-orange-400 mb-4 opacity-50" />
                           <p className="text-orange-400 text-sm font-bold">PREEMPTION DISABLED</p>
                           <p className="text-orange-500 text-xs mt-2">The "No Preemption" prevention policy is currently active.</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           {deadlockedProcesses.map(p => {
                              const heldEdges = edges.filter(e => e.type === 'assignment' && e.target === p);
                              if (heldEdges.length === 0) return null;
                              return heldEdges.map((edge, idx) => (
                                 <div key={`${p}-${idx}`} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-6">
                                       <div className="flex items-center gap-4 text-lg font-bold bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
                                          <span className="text-slate-300">{edge.source}</span>
                                          <span className="text-xs px-2 py-1 bg-slate-900 rounded border border-slate-700 text-slate-500">ASSIGNED TO →</span>
                                          <span className="text-blue-400">{p}</span>
                                       </div>
                                    </div>
                                    <button 
                                       onClick={() => preemptResource(p, edge.source)}
                                       className="bg-orange-900/30 border border-orange-800/50 hover:bg-orange-600 hover:text-white text-orange-400 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors uppercase tracking-wider"
                                    >
                                       Seize Resource
                                    </button>
                                 </div>
                              ));
                           })}
                        </div>
                     )}
                  </div>
               </motion.div>
            )}

         </AnimatePresence>
      </div>

    </div>
  );
}
