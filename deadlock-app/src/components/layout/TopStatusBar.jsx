import React from 'react';
import useSimulationStore, { useComputedSystemState } from '../../store/useSimulationStore';
import { RotateCcw } from 'lucide-react';

export default function TopStatusBar() {
  const processes = useSimulationStore(state => state.processes);
  const resources = useSimulationStore(state => state.resources);
  const edges = useSimulationStore(state => state.edges);
  const resetSystem = useSimulationStore(state => state.resetSystem);

  const { hasDeadlock, deadlockRiskLevel } = useComputedSystemState();

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-40 relative">

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full transition-colors ${hasDeadlock ? 'bg-red-500 animate-pulse' : deadlockRiskLevel === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
          <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            Status: {hasDeadlock ? <span className="text-red-400">Deadlocked</span> : deadlockRiskLevel === 'warning' ? <span className="text-amber-400">Contention</span> : <span className="text-emerald-400">Safe</span>}
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
        <button onClick={resetSystem} className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Reset System">
          <RotateCcw size={14}/> Reset
        </button>
      </div>
    </div>
  );
}
