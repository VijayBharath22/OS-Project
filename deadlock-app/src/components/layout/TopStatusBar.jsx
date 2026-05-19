import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { detectCycle } from '../../utils/cycleDetect';

export default function TopStatusBar() {
  const { state, computed } = useSystem();
  const { processes, resources, edges } = state;

  const cycleNodes = detectCycle(computed.nodes, edges) || [];
  const cycleExists = cycleNodes.length > 0;

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-40 relative">
       
       <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <div className={`w-2.5 h-2.5 rounded-full ${cycleExists ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
             <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                Status: {cycleExists ? <span className="text-red-400">Deadlocked</span> : <span className="text-emerald-400">Acyclic</span>}
             </span>
          </div>
       </div>

       <div className="flex items-center gap-8 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <div className="flex items-center gap-2">
             <span>Processes:</span>
             <span className="text-blue-400">{processes.length}</span>
          </div>
          <div className="flex items-center gap-2">
             <span>Resources:</span>
             <span className="text-emerald-400">{resources.length}</span>
          </div>
          <div className="flex items-center gap-2">
             <span>Allocations:</span>
             <span className="text-slate-100">{edges.filter(e => e.type === 'assignment').length}</span>
          </div>
       </div>

    </div>
  );
}
