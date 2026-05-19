import React, { useState, useRef, useMemo } from 'react';
import { Network, Plus, Trash2, Activity, GitCommit, Settings, PieChart, ZoomIn, ZoomOut, Maximize, Hand } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '../context/SystemContext';
import { useRAG } from '../hooks/useRAG';
import { detectCycle } from '../utils/cycleDetect';

export default function RAGBuilder() {
  const { state, dispatch, computed } = useSystem();
  const { nodes } = computed;
  const { edges } = state;
  const [activeTab, setActiveTab] = useState('graph');

  const svgRef = useRef(null);
  const zoomRef = useRef(null);
  const cycleNodes = useMemo(() => detectCycle(nodes, edges), [nodes, edges]);
  useRAG(svgRef, { nodes, edges }, cycleNodes, zoomRef);

  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');

  const determineEdgeType = (src, tgt) => {
    const srcNode = nodes.find(n => n.id === src);
    const tgtNode = nodes.find(n => n.id === tgt);
    if (!srcNode || !tgtNode) return null;
    if (srcNode.type === 'process' && tgtNode.type === 'resource') return 'request';
    if (srcNode.type === 'resource' && tgtNode.type === 'process') return 'assignment';
    return null; 
  };

  const addEdge = () => {
    if (!sourceNode || !targetNode || sourceNode === targetNode) return;
    const type = determineEdgeType(sourceNode, targetNode);
    if (!type) {
       dispatch({ type: 'ADD_LOG', payload: { msg: `> ERR: Invalid connection type.`, type: 'error' } });
       return;
    }
    dispatch({ type: 'ADD_EDGE', payload: { source: sourceNode, target: targetNode, type } });
  };

  const deleteEdge = (edge) => {
    dispatch({ type: 'REMOVE_EDGE', payload: { exact: edge } });
  };

  const generateEducationalExplanation = () => {
     if (!cycleNodes || cycleNodes.length === 0) return null;
     
     const pathExp = [];
     for(let i=0; i<cycleNodes.length; i++) {
         const u = cycleNodes[i];
         const v = cycleNodes[(i+1)%cycleNodes.length];
         const nU = nodes.find(n=>n.id===u);
         if (nU.type === 'process') {
             pathExp.push(`${u} requests and waits for ${v}.`);
         } else {
             pathExp.push(`${u} is held by ${v}.`);
         }
     }

     const isMultiInstance = cycleNodes.some(id => nodes.find(n => n.id === id)?.type === 'resource' && nodes.find(n => n.id === id)?.instances > 1);

     return (
        <div className="space-y-4 text-left">
           <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
               <h4 className="font-bold mb-2">Circular Wait Condition Met</h4>
               <ul className="list-disc pl-5 space-y-1 text-sm font-mono">
                  {pathExp.map((exp, i) => <li key={i}>{exp}</li>)}
               </ul>
           </div>
           {isMultiInstance ? (
               <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200">
                  <strong>Academic Note:</strong> A cycle exists, but it involves multi-instance resources. Therefore, deadlock is <strong>possible but not guaranteed</strong>. A full Banker's Safety algorithm check is required.
               </div>
           ) : (
               <div className="bg-red-100 text-red-900 p-4 rounded-lg border border-red-300">
                  <strong>Academic Note:</strong> This cycle exclusively involves single-instance resources. A cycle in a single-instance RAG implies that deadlock is <strong>guaranteed</strong>.
               </div>
           )}
        </div>
     )
  };

  const tabs = [
     { id: 'graph', label: 'Interactive Graph', icon: <Network size={16}/> },
     { id: 'analyzer', label: 'Topology Analyzer', icon: <PieChart size={16}/> },
     { id: 'manager', label: 'Edge Manager', icon: <Settings size={16}/> }
  ];

  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto">
      
      {/* Module Header & Internal Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 pt-6 shrink-0 shadow-sm rounded-t-xl">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-900/50 rounded-lg border border-blue-800">
               <Network className="text-blue-400" size={24}/>
            </div>
            <div>
               <h2 className="text-2xl font-bold tracking-tight text-slate-100">Resource Allocation Graph</h2>
               <p className="text-sm font-medium text-slate-400">Directed Graph System Representation</p>
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
                     <motion.div layoutId="ragTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t" />
                  )}
               </button>
            ))}
         </div>
      </div>

      {/* Module Content Area */}
      <div className="flex-1 bg-slate-900 border border-t-0 border-slate-800 rounded-b-xl relative overflow-hidden flex flex-col min-h-0 shadow-sm">
         <AnimatePresence mode="wait">
            
            {activeTab === 'graph' && (
               <motion.div key="graph" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-950">
                  <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10 block" />
                  
                  {/* Floating Controls */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-20">
                     <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-sm font-medium text-slate-300 space-y-2 pointer-events-auto shadow-sm flex flex-col gap-1">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Request (Process → Resource)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Assignment (Resource → Process)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Deadlock Cycle</div>
                        <div className="h-px w-full bg-slate-800 my-1"></div>
                        <div className="flex gap-2 mt-1">
                           <button onClick={() => dispatch({ type: 'ADD_PROCESS' })} className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1.5 rounded transition-colors text-xs font-bold flex items-center justify-center gap-1">
                              <Plus size={14}/> Add P
                           </button>
                           <button onClick={() => dispatch({ type: 'ADD_RESOURCE', payload: { instances: 1 } })} className="flex-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1.5 rounded transition-colors text-xs font-bold flex items-center justify-center gap-1">
                              <Plus size={14}/> Add R
                           </button>
                        </div>
                     </div>

                     <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex gap-2 pointer-events-auto shadow-sm h-fit items-center">
                        <select className="bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 text-sm outline-none" value={sourceNode} onChange={e => setSourceNode(e.target.value)}>
                           <option value="">Source</option>
                           {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                        <span className="text-slate-500 font-bold px-2">→</span>
                        <select className="bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 text-sm outline-none" value={targetNode} onChange={e => setTargetNode(e.target.value)}>
                           <option value="">Target</option>
                           {nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                        </select>
                        <button onClick={addEdge} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors shadow-sm ml-2">
                           <Plus size={18}/>
                        </button>
                     </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto z-20">
                     <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-sm flex flex-col overflow-hidden">
                        <button onClick={() => zoomRef.current?.zoomIn()} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-b border-slate-800" title="Zoom In">
                           <ZoomIn size={20}/>
                        </button>
                        <button onClick={() => zoomRef.current?.zoomOut()} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-b border-slate-800" title="Zoom Out">
                           <ZoomOut size={20}/>
                        </button>
                        <button onClick={() => zoomRef.current?.reset()} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Reset View">
                           <Maximize size={20}/>
                        </button>
                     </div>
                     <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-sm p-3 flex justify-center items-center text-slate-500" title="Pan Canvas">
                        <Hand size={20}/>
                     </div>
                  </div>
               </motion.div>
            )}

            {activeTab === 'analyzer' && (
               <motion.div key="analyzer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 h-full overflow-y-auto custom-scrollbar bg-slate-950 flex justify-center">
                  <div className={`w-full max-w-2xl p-8 rounded-xl border bg-slate-900 border-slate-800 shadow-sm`}>
                     <div className="text-center border-b border-slate-800 pb-6 mb-6">
                         <Activity size={48} className={`mx-auto mb-4 ${cycleNodes?.length > 0 ? "text-red-500" : "text-emerald-500"}`}/> 
                         <h3 className="text-2xl font-bold text-slate-100 mb-2">Topology Status</h3>
                     </div>
                     
                     {cycleNodes?.length > 0 ? (
                        <div>{generateEducationalExplanation()}</div>
                     ) : (
                        <div className="text-center">
                           <div className="px-4 py-2 bg-emerald-900/30 text-emerald-400 font-bold text-sm uppercase tracking-wider inline-block rounded border border-emerald-800/50">
                              System Acyclic
                           </div>
                           <p className="text-slate-400 leading-relaxed mt-6">
                              No closed loops detected in the graph topology. While mutual exclusion and hold-and-wait conditions may exist, the <strong>circular wait</strong> condition is absent. 
                              Therefore, the system is structurally safe from deadlock.
                           </p>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}

            {activeTab === 'manager' && (
               <motion.div key="manager" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 h-full flex flex-col min-h-0 bg-slate-950 items-center">
                  <div className="w-full max-w-3xl flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-4 shrink-0 px-2">
                         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <GitCommit size={16}/> Active Connections
                         </h3>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                         <AnimatePresence>
                            {edges.map((edge, idx) => {
                               const isCycle = cycleNodes?.includes(edge.source) && cycleNodes?.includes(edge.target);
                               return (
                                  <motion.div 
                                     key={idx}
                                     initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                     className={`p-4 rounded-lg flex items-center justify-between border shadow-sm ${
                                        isCycle ? 'bg-red-900/30 border-red-800/50 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                                     }`}
                                  >
                                     <div className="flex items-center gap-6 font-mono text-base font-bold">
                                        <span className="w-12 text-center">{edge.source}</span>
                                        <span className={`text-xs px-3 py-1 rounded border ${edge.type === 'request' ? 'text-blue-400 bg-blue-900/30 border-blue-800/50' : 'text-emerald-400 bg-emerald-900/30 border-emerald-800/50'}`}>
                                           {edge.type === 'request' ? 'REQUESTS →' : 'ASSIGNED TO →'}
                                        </span>
                                        <span className="w-12 text-center">{edge.target}</span>
                                     </div>
                                     <button onClick={() => deleteEdge(edge)} className="text-slate-500 hover:text-red-500 transition-colors p-2 hover:bg-slate-800 rounded-lg">
                                        <Trash2 size={18}/>
                                     </button>
                                  </motion.div>
                               )
                            })}
                         </AnimatePresence>
                         {edges.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                               <GitCommit size={32} className="text-slate-600 mb-2"/>
                               <p className="text-slate-500 font-medium">No edges created.</p>
                            </div>
                         )}
                      </div>
                  </div>
               </motion.div>
            )}

         </AnimatePresence>
      </div>

    </div>
  );
}
