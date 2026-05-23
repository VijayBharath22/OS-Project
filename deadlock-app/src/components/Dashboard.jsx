import React, { useRef, useMemo } from 'react';
import { Shield, AlertTriangle, Network, Landmark, Search, Stethoscope, Activity, BookOpen, Server, Cpu, HardDrive, ArrowRightLeft, TrendingUp, Clock, Zap, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import useSimulationStore, { useComputedSystemState } from '../store/useSimulationStore';
import { useRAG } from '../hooks/useRAG';

export default function Dashboard() {
  const processes = useSimulationStore(s => s.processes);
  const resources = useSimulationStore(s => s.resources);
  const edges = useSimulationStore(s => s.edges);
  const prevention = useSimulationStore(s => s.prevention);
  const timeline = useSimulationStore(s => s.timeline);
  const setActiveModule = useSimulationStore(s => s.setActiveModule);
  const loadPreset = useSimulationStore(s => s.loadPreset);

  const computed = useComputedSystemState();
  const { hasDeadlock, deadlockRiskLevel, blockedProcesses, waitingProcesses, cycleNodes, availableVector, nodes } = computed;

  const svgRef = useRef(null);
  const graphData = useMemo(() => ({ nodes, edges }), [nodes, edges]);
  useRAG(svgRef, graphData, cycleNodes, null);

  const activePrevention = Object.entries(prevention).filter(([, v]) => v).map(([k]) => k);
  const totalInstances = resources.reduce((a, r) => a + r.instances, 0);
  const totalAllocated = edges.filter(e => e.type === 'assignment').length;
  const totalRequests = edges.filter(e => e.type === 'request').length;

  const riskColor = deadlockRiskLevel === 'deadlock' ? 'red' : deadlockRiskLevel === 'warning' ? 'amber' : 'emerald';
  const riskLabel = deadlockRiskLevel === 'deadlock' ? 'DEADLOCK DETECTED' : deadlockRiskLevel === 'warning' ? 'WARNING — CONTENTION' : 'SAFE — ACYCLIC';

  const statCards = [
    { label: 'Processes', value: processes.length, icon: <Cpu size={20}/>, color: 'blue', sub: `${blockedProcesses.length} blocked` },
    { label: 'Resources', value: resources.length, icon: <HardDrive size={20}/>, color: 'emerald', sub: `${totalInstances} instances` },
    { label: 'Allocations', value: totalAllocated, icon: <ArrowRightLeft size={20}/>, color: 'violet', sub: `${totalRequests} pending` },
    { label: 'Available', value: availableVector.reduce((a, v) => a + v, 0), icon: <TrendingUp size={20}/>, color: 'cyan', sub: `across ${resources.length} types` },
  ];

  const recentTimeline = [...timeline].reverse().slice(0, 15);

  return (
    <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col gap-5 py-6">

       {/* ── Page Title ── */}
       <div className="flex items-center justify-between shrink-0 px-1">
          <div>
             <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
               <div className="p-2.5 bg-blue-900/50 border border-blue-800 rounded-xl">
                 <Activity size={24} className="text-blue-400"/>
               </div>
               Deadlock Control Center
             </h1>
             <p className="text-slate-400 font-medium mt-1 ml-14">Real-time system monitoring and simulation overview</p>
          </div>
       </div>

       {/* ── System Status Banner ── */}
       <motion.div
         key={deadlockRiskLevel}
         initial={{ opacity: 0, y: -5 }}
         animate={{ opacity: 1, y: 0 }}
         className={`p-5 rounded-xl border flex items-center justify-between shadow-sm shrink-0 bg-${riskColor}-900/20 border-${riskColor}-800/50`}
         style={{
           background: deadlockRiskLevel === 'deadlock' ? 'rgba(127,29,29,0.25)' : deadlockRiskLevel === 'warning' ? 'rgba(120,53,15,0.2)' : 'rgba(6,78,59,0.2)',
           borderColor: deadlockRiskLevel === 'deadlock' ? 'rgba(185,28,28,0.5)' : deadlockRiskLevel === 'warning' ? 'rgba(180,83,9,0.5)' : 'rgba(6,95,70,0.5)'
         }}
       >
          <div className="flex items-center gap-5">
             <div className={`p-3.5 rounded-full`} style={{ background: deadlockRiskLevel === 'deadlock' ? 'rgba(127,29,29,0.5)' : deadlockRiskLevel === 'warning' ? 'rgba(120,53,15,0.4)' : 'rgba(6,78,59,0.5)' }}>
                {deadlockRiskLevel === 'deadlock' ? <AlertTriangle size={28} className="text-red-400"/> :
                 deadlockRiskLevel === 'warning' ? <Gauge size={28} className="text-amber-400"/> :
                 <Shield size={28} className="text-emerald-400"/>}
             </div>
             <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">System State</h3>
                <div className={`text-xl font-bold`} style={{ color: deadlockRiskLevel === 'deadlock' ? '#f87171' : deadlockRiskLevel === 'warning' ? '#fbbf24' : '#34d399' }}>
                   {riskLabel}
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             {activePrevention.length > 0 && (
               <div className="bg-slate-900/60 border border-slate-700 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 flex items-center gap-2">
                 <Shield size={14} className="text-blue-400"/> {activePrevention.length} Prevention Rule{activePrevention.length > 1 ? 's' : ''} Active
               </div>
             )}
             {hasDeadlock && (
               <button onClick={() => setActiveModule('recovery')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors text-sm">
                  Open Recovery →
               </button>
             )}
          </div>
       </motion.div>

       {/* ── Stat Cards ── */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {statCards.map((card, i) => (
             <motion.div
               key={card.label}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm"
             >
                <div className="flex items-center justify-between mb-3">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{card.label}</span>
                   <div className={`p-1.5 rounded-lg bg-${card.color}-900/30 border border-${card.color}-800/30 text-${card.color}-400`}>
                     {card.icon}
                   </div>
                </div>
                <div className="text-3xl font-black text-slate-100">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</div>
             </motion.div>
          ))}
       </div>

       {/* ── Main Content Grid ── */}
       <div className="grid lg:grid-cols-3 gap-5 flex-1 min-h-0">

          {/* Live RAG Preview */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm min-h-[350px]">
             <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Network size={14} className="text-blue-400"/> Live Resource Allocation Graph
                </h3>
                <button onClick={() => setActiveModule('rag')} className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">
                  Open Builder →
                </button>
             </div>
             <div className="flex-1 relative bg-slate-950">
                <svg ref={svgRef} className="w-full h-full block" />
                {processes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm font-medium">
                    No processes. Load a preset to begin.
                  </div>
                )}
             </div>
          </div>

          {/* Right Column: Risk Meter + Timeline */}
          <div className="flex flex-col gap-5 min-h-0">

             {/* Deadlock Risk Meter */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm shrink-0">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Gauge size={14}/> Risk Assessment
                </h3>
                <div className="flex items-center gap-4">
                   <div className="flex-1">
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                         <motion.div
                           className="h-full rounded-full"
                           initial={{ width: 0 }}
                           animate={{
                             width: deadlockRiskLevel === 'deadlock' ? '100%' : deadlockRiskLevel === 'warning' ? '55%' : '15%',
                             backgroundColor: deadlockRiskLevel === 'deadlock' ? '#ef4444' : deadlockRiskLevel === 'warning' ? '#f59e0b' : '#10b981'
                           }}
                           transition={{ duration: 0.6, ease: 'easeOut' }}
                         />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                         <span>Safe</span>
                         <span>Warning</span>
                         <span>Deadlock</span>
                      </div>
                   </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                   <div className="bg-slate-950 rounded-lg p-2 border border-slate-800">
                      <div className="text-lg font-black text-blue-400">{processes.filter(p => p.state === 'running').length}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Running</div>
                   </div>
                   <div className="bg-slate-950 rounded-lg p-2 border border-slate-800">
                      <div className="text-lg font-black text-amber-400">{waitingProcesses.length}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Waiting</div>
                   </div>
                   <div className="bg-slate-950 rounded-lg p-2 border border-slate-800">
                      <div className="text-lg font-black text-red-400">{blockedProcesses.length}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Blocked</div>
                   </div>
                </div>
             </div>

             {/* Timeline Feed */}
             <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col flex-1 min-h-0 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50 shrink-0 flex items-center gap-2">
                   <Clock size={14} className="text-emerald-400"/>
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Timeline</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                   {recentTimeline.length === 0 ? (
                     <div className="text-sm text-slate-600 text-center py-8">No events yet</div>
                   ) : recentTimeline.map(ev => {
                     const typeColors = { allocation: 'text-emerald-400', request: 'text-blue-400', cycle: 'text-red-400', recovery: 'text-orange-400', prevention: 'text-violet-400', banker: 'text-cyan-400', system: 'text-slate-400' };
                     return (
                       <div key={ev.id} className="flex gap-3 text-xs">
                          <span className="text-slate-600 shrink-0 font-mono w-16">{ev.timeLabel}</span>
                          <span className={`font-medium ${typeColors[ev.eventType] || 'text-slate-400'}`}>{ev.description}</span>
                       </div>
                     );
                   })}
                </div>
             </div>
          </div>
       </div>

       {/* ── Bottom: Quick Actions + Presets ── */}
       <div className="grid md:grid-cols-2 gap-5 shrink-0">

          {/* Learning Modules */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
               <Zap size={14} className="text-blue-400"/> Quick Navigation
             </h3>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'rag', label: 'RAG Builder', icon: <Network size={22}/> },
                  { id: 'bankers', label: "Banker's Algorithm", icon: <Landmark size={22}/> },
                  { id: 'detection', label: 'Detection Engine', icon: <Search size={22}/> },
                  { id: 'recovery', label: 'Recovery Console', icon: <Stethoscope size={22}/> },
                ].map(item => (
                  <button key={item.id} onClick={() => setActiveModule(item.id)} className="bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 transition-all group">
                     <span className="text-slate-400 group-hover:text-blue-400 transition-colors">{item.icon}</span>
                     <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors">{item.label}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* Textbook Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
               <BookOpen size={14}/> Textbook Scenarios
             </h3>
             <div className="space-y-3">
                <button onClick={() => loadPreset('fig73')} className="w-full bg-slate-800/50 border border-slate-700 hover:border-blue-500 p-4 rounded-xl text-left transition-all group flex items-center justify-between">
                   <div>
                      <div className="font-bold text-sm text-slate-200 group-hover:text-blue-400 transition-colors">Load Classic Safe State</div>
                      <div className="text-xs text-slate-500 mt-1">5 processes, 3 resources — Banker's safe state</div>
                   </div>
                   <Server size={18} className="text-slate-500 group-hover:text-blue-400"/>
                </button>
                <button onClick={() => loadPreset('fig74')} className="w-full bg-slate-800/50 border border-slate-700 hover:border-red-500 hover:bg-red-900/10 p-4 rounded-xl text-left transition-all group flex items-center justify-between">
                   <div>
                      <div className="font-bold text-sm text-slate-200 group-hover:text-red-400 transition-colors">Load Deadlock State</div>
                      <div className="text-xs text-slate-500 mt-1">3 processes, 3 resources — circular wait</div>
                   </div>
                   <Server size={18} className="text-slate-500 group-hover:text-red-400"/>
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}
