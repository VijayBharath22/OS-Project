import React, { useState } from 'react';
import { AlertTriangle, Lock, Unlock, ArrowRight, Ban, CheckCircle, HandMetal, RefreshCw, CircleDot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSimulationStore from '../store/useSimulationStore';

export default function CoffmanConditions() {
  const prevention = useSimulationStore(s => s.prevention);
  const togglePrevention = useSimulationStore(s => s.togglePrevention);
  const setActiveModule = useSimulationStore(s => s.setActiveModule);
  const [expandedId, setExpandedId] = useState(null);

  const conditions = [
    {
      id: 'mutualExclusion',
      title: 'Mutual Exclusion',
      icon: <Lock size={28}/>,
      color: 'blue',
      shortDesc: 'At least one resource must be held in a non-sharable mode.',
      longDesc: 'If a resource is allocated to a process, no other process can use that resource until it is released. This condition is inherent to non-sharable resources like printers, tape drives, and critical sections.',
      example: 'Process P1 holds Printer. Process P2 requests Printer. P2 must wait because the printer cannot be shared.',
      prevention: 'Cannot be prevented for non-sharable resources. Sharable resources (like read-only files) do not require mutual exclusion.',
      enforceable: false,
      animation: [
        { label: 'P1', action: 'holds', resource: 'Printer', status: 'active' },
        { label: 'P2', action: 'requests', resource: 'Printer', status: 'blocked' },
      ]
    },
    {
      id: 'holdAndWait',
      title: 'Hold and Wait',
      icon: <HandMetal size={28}/>,
      color: 'amber',
      shortDesc: 'A process holding resources can request additional resources.',
      longDesc: 'A process is currently holding at least one resource and is requesting additional resources that are held by other processes. The process will not release its current resources while waiting.',
      example: 'P1 holds R1, requests R2. P1 will not release R1 while waiting for R2, blocking any process that needs R1.',
      prevention: 'Protocol 1: Request all resources before execution. Protocol 2: Release all held resources before requesting new ones.',
      enforceable: true,
      animation: [
        { label: 'P1', action: 'holds', resource: 'R1', status: 'active' },
        { label: 'P1', action: 'requests', resource: 'R2', status: 'waiting' },
        { label: 'P2', action: 'needs', resource: 'R1', status: 'blocked' },
      ]
    },
    {
      id: 'noPreemption',
      title: 'No Preemption',
      icon: <Ban size={28}/>,
      color: 'red',
      shortDesc: 'Resources cannot be forcibly taken from a process.',
      longDesc: 'A resource can only be released voluntarily by the process holding it, after the process has completed its task. The OS cannot forcibly reclaim resources.',
      example: 'P1 holds R1. The OS cannot take R1 away from P1 even if P2 urgently needs it. P1 must finish and release R1.',
      prevention: 'Allow the OS to preempt: if a process requests a resource that cannot be immediately allocated, all its current resources are released.',
      enforceable: true,
      animation: [
        { label: 'P1', action: 'holds', resource: 'R1', status: 'active' },
        { label: 'OS', action: 'cannot take', resource: 'R1', status: 'denied' },
      ]
    },
    {
      id: 'circularWait',
      title: 'Circular Wait',
      icon: <CircleDot size={28}/>,
      color: 'violet',
      shortDesc: 'A closed chain of processes, each waiting for the next.',
      longDesc: 'There exists a set {P0, P1, ..., Pn} of waiting processes such that P0 is waiting for a resource held by P1, P1 is waiting for a resource held by P2, ..., and Pn is waiting for a resource held by P0.',
      example: 'P1 holds R1, requests R2. P2 holds R2, requests R3. P3 holds R3, requests R1. A cycle: P1→R2→P2→R3→P3→R1→P1.',
      prevention: 'Impose a total ordering on resource types and require that each process requests resources in increasing order.',
      enforceable: true,
      animation: [
        { label: 'P1', action: 'holds R1, requests', resource: 'R2', status: 'waiting' },
        { label: 'P2', action: 'holds R2, requests', resource: 'R3', status: 'waiting' },
        { label: 'P3', action: 'holds R3, requests', resource: 'R1', status: 'waiting' },
      ]
    }
  ];

  const colorMap = { blue: { bg: 'bg-blue-900/20', border: 'border-blue-800/50', text: 'text-blue-400', badge: 'bg-blue-900/30' }, amber: { bg: 'bg-amber-900/20', border: 'border-amber-800/50', text: 'text-amber-400', badge: 'bg-amber-900/30' }, red: { bg: 'bg-red-900/20', border: 'border-red-800/50', text: 'text-red-400', badge: 'bg-red-900/30' }, violet: { bg: 'bg-violet-900/20', border: 'border-violet-800/50', text: 'text-violet-400', badge: 'bg-violet-900/30' } };

  const activeCount = Object.values(prevention).filter(Boolean).length;

  return (
    <div className="w-full max-w-[1200px] mx-auto py-8 space-y-8">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex p-3 bg-amber-900/30 border border-amber-800/50 rounded-2xl mb-4"><AlertTriangle size={32} className="text-amber-400"/></div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Coffman Conditions</h1>
        <p className="text-slate-400 font-medium mt-2 max-w-xl mx-auto">All four conditions must hold simultaneously for deadlock to occur. Eliminating any one prevents deadlock.</p>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border text-center text-sm font-bold ${activeCount === 4 ? 'bg-red-900/20 border-red-800/50 text-red-400' : activeCount >= 3 ? 'bg-amber-900/20 border-amber-800/50 text-amber-400' : 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400'}`}>
        {activeCount === 4 ? '⚠ ALL 4 CONDITIONS ACTIVE — Deadlock is possible!' : activeCount === 0 ? '✓ No conditions active — Deadlock is structurally impossible.' : `${4 - activeCount} condition(s) prevented — Deadlock cannot form.`}
      </div>

      {/* Conditions Grid */}
      <div className="space-y-4">
        {conditions.map((cond, i) => {
          const isActive = prevention[cond.id];
          const isExpanded = expandedId === cond.id;
          const c = colorMap[cond.color];

          return (
            <motion.div
              key={cond.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border rounded-xl overflow-hidden transition-all shadow-sm ${isActive ? `${c.bg} ${c.border}` : 'bg-slate-900 border-slate-800'}`}
            >
              {/* Header Row */}
              <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : cond.id)}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.badge} border ${c.border} ${c.text}`}>
                    {cond.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className={`text-lg font-bold ${isActive ? c.text : 'text-slate-200'}`}>{cond.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isActive ? `${c.badge} ${c.border} ${c.text}` : 'bg-emerald-900/30 border-emerald-800/50 text-emerald-400'}`}>
                        {isActive ? 'ACTIVE' : 'PREVENTED'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">{cond.shortDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {cond.enforceable ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePrevention(cond.id); }}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isActive ? 'bg-red-500' : 'bg-emerald-500'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-slate-950 transition-transform ${isActive ? 'translate-x-8' : 'translate-x-1'}`}/>
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 font-bold bg-slate-800 px-3 py-1.5 rounded">INHERENT</div>
                  )}
                  <ArrowRight size={18} className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 pt-0 space-y-4 border-t border-slate-800/50">
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h4>
                          <p className="text-sm text-slate-300 leading-relaxed">{cond.longDesc}</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Example</h4>
                          <p className="text-sm text-slate-300 leading-relaxed font-mono">{cond.example}</p>
                        </div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Prevention Strategy</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">{cond.prevention}</p>
                      </div>
                      {/* Mini animation */}
                      <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Visual Scenario</h4>
                        <div className="flex flex-wrap gap-3">
                          {cond.animation.map((step, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.15 }}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-bold ${
                                step.status === 'active' ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400' :
                                step.status === 'blocked' ? 'bg-red-900/20 border-red-800/50 text-red-400' :
                                step.status === 'waiting' ? 'bg-amber-900/20 border-amber-800/50 text-amber-400' :
                                'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              <span className="font-black">{step.label}</span>
                              <span className="text-slate-500 font-normal">{step.action}</span>
                              <span className="bg-slate-900 px-2 py-0.5 rounded text-xs border border-slate-700">{step.resource}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Navigate Forward */}
      <div className="flex justify-center pt-4">
        <button onClick={() => setActiveModule('prevention')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2">
          Continue to Prevention Strategies <ArrowRight size={18}/>
        </button>
      </div>
    </div>
  );
}
