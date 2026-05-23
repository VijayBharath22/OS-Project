import React, { useRef, useMemo } from 'react';
import { Network } from 'lucide-react';
import useSimulationStore, { useComputedSystemState } from '../../store/useSimulationStore';
import { useRAG } from '../../hooks/useRAG';

/**
 * MiniRAG — Compact Resource Allocation Graph for the Prevention page.
 * Renders the REAL global state (not isolated data) in a compact container.
 * Shows live edges, process states, and cycle highlighting.
 */
export default function MiniRAG({ height = 280 }) {
  const edges = useSimulationStore(s => s.edges);
  const computed = useComputedSystemState();
  const { nodes, cycleNodes } = computed;

  const svgRef = useRef(null);
  const graphData = useMemo(() => ({ nodes, edges }), [nodes, edges]);
  useRAG(svgRef, graphData, cycleNodes, null);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Network size={12} className="text-blue-400" />
          Live Resource Allocation Graph
        </h4>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Request</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Assigned</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Cycle</span>
        </div>
      </div>
      <div style={{ height }} className="relative">
        <svg ref={svgRef} className="w-full h-full block" />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-medium">
            No processes or resources. Load a scenario to begin.
          </div>
        )}
      </div>
    </div>
  );
}
