import React, { useState } from 'react';
import { Search, Network, Code, Database, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSimulationStore, { useComputedSystemState } from '../store/useSimulationStore';
import { playSuccess, playAlarm } from '../utils/audio';

export default function Detection() {
  const edges = useSimulationStore(s => s.edges);
  const addLog = useSimulationStore(s => s.addLog);
  const computed = useComputedSystemState();
  const { nodes } = computed;
  const [activeTab, setActiveTab] = useState('trace');
  const [isRunning, setIsRunning] = useState(false);
  const [dfsStack, setDfsStack] = useState([]);
  const [visited, setVisited] = useState([]);
  const [detectedCycle, setDetectedCycle] = useState(null);
  const [activeCodeLine, setActiveCodeLine] = useState(-1);

  const processNodes = nodes.filter(n => n.type === 'process');
  const wfgEdges = [];
  edges.forEach(req => {
    if (req.type === 'request') {
      const holders = edges.filter(e => e.type === 'assignment' && e.source === req.target);
      holders.forEach(assign => { wfgEdges.push({ source: req.source, target: assign.target }); });
    }
  });

  const DFS_CODE = [
    "function detectCycle(node, visited, recursionStack) {",
    "  visited.add(node);",
    "  recursionStack.push(node);",
    "  ",
    "  for (let neighbor of getNeighbors(node)) {",
    "    if (recursionStack.includes(neighbor)) {",
    "      return true; // CYCLE DETECTED",
    "    }",
    "    if (!visited.has(neighbor)) {",
    "      if (detectCycle(neighbor, visited, recursionStack)) return true;",
    "    }",
    "  }",
    "  ",
    "  recursionStack.pop();",
    "  return false;",
    "}"
  ];

  const runDetection = () => {
    setActiveTab('trace'); setIsRunning(true); setDfsStack([]); setVisited([]); setDetectedCycle(null);
    addLog('> Initiated DFS on Wait-For Graph.');
    let currentNodes = [...processNodes.map(p => p.id)];
    let vSet = new Set(); let stack = []; let stepDelay = 800;

    const dfsStep = async (nodeId) => {
      setActiveCodeLine(1); vSet.add(nodeId); setVisited(Array.from(vSet)); await new Promise(r => setTimeout(r, 400));
      setActiveCodeLine(2); stack.push(nodeId); setDfsStack([...stack]); await new Promise(r => setTimeout(r, stepDelay));
      setActiveCodeLine(4);
      const neighbors = wfgEdges.filter(e => e.source === nodeId).map(e => e.target);
      for (let next of neighbors) {
        await new Promise(r => setTimeout(r, 400)); setActiveCodeLine(5);
        if (stack.includes(next)) {
          setActiveCodeLine(6); const cyclePath = stack.slice(stack.indexOf(next)); cyclePath.push(next);
          playAlarm(); setDetectedCycle(cyclePath);
          addLog(`> Cycle found: ${cyclePath.join(' -> ')}`, 'error'); return true;
        }
        setActiveCodeLine(8);
        if (!vSet.has(next)) { setActiveCodeLine(9); const found = await dfsStep(next); if (found) return true; }
      }
      setActiveCodeLine(13); await new Promise(r => setTimeout(r, 400)); stack.pop(); setDfsStack([...stack]); return false;
    };

    const runAll = async () => {
      for (let p of currentNodes) {
        if (!vSet.has(p)) { await new Promise(r => setTimeout(r, stepDelay)); const found = await dfsStep(p); if (found) { setIsRunning(false); return; } }
      }
      setIsRunning(false); setActiveCodeLine(-1); playSuccess();
      addLog('> DFS complete. Graph is acyclic.');
    };
    runAll();
  };

  const tabs = [
    { id: 'wfg', label: 'Wait-For Graph', icon: <Network size={16}/> },
    { id: 'trace', label: 'Algorithm Trace', icon: <Code size={16}/> },
  ];

  return (
    <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto">
      <div className="bg-slate-900 border-b border-slate-800 px-6 pt-6 shrink-0 shadow-sm rounded-t-xl flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-900/50 rounded-lg border border-blue-800"><Search className="text-blue-400" size={24}/></div>
            <div><h2 className="text-2xl font-bold tracking-tight text-slate-100">Deadlock Detection</h2><p className="text-sm font-medium text-slate-400">Wait-For Graph & Cycle Detection</p></div>
          </div>
          <div className="flex gap-4">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab.icon} {tab.label}
                {activeTab === tab.id && <motion.div layoutId="detectTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t" />}
              </button>
            ))}
          </div>
        </div>
        <div className="pb-3 flex gap-2">
          <button onClick={runDetection} disabled={isRunning || processNodes.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-2 shadow-sm transition-colors"><Play size={16}/> Execute DFS</button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-t-0 border-slate-800 rounded-b-xl relative overflow-hidden flex flex-col min-h-0 shadow-sm">
        <AnimatePresence mode="wait">
          {activeTab === 'wfg' && (
            <motion.div key="wfg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-8 h-full overflow-y-auto custom-scrollbar flex flex-col items-center bg-slate-950">
              <div className="max-w-2xl w-full">
                <p className="text-slate-300 bg-slate-900 p-6 border border-slate-800 rounded-xl shadow-sm mb-8 leading-relaxed text-center">The <strong>Wait-For Graph (WFG)</strong> is a collapsed version of the RAG. It directly maps Process → Process requests. A cycle in the WFG guarantees deadlock.</p>
                <div className="space-y-4">
                  {processNodes.length === 0 ? <p className="text-slate-500 text-center py-10 border-2 border-dashed border-slate-800 rounded-xl">No processes in system.</p> :
                   wfgEdges.length === 0 ? <p className="text-slate-500 text-center py-10 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">No active Wait-For dependencies.</p> :
                   wfgEdges.map((edge, idx) => {
                     const isActive = dfsStack.includes(edge.source) && dfsStack.includes(edge.target);
                     const isCycle = detectedCycle && detectedCycle.includes(edge.source) && detectedCycle.includes(edge.target);
                     return (
                       <div key={idx} className={`p-5 rounded-xl border flex items-center justify-center gap-8 transition-all duration-300 shadow-sm ${isCycle ? 'bg-red-900/30 border-red-800/50 text-red-300' : isActive ? 'bg-blue-900/30 border-blue-800/50 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                         <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl border ${isActive || isCycle ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-950 border-slate-800'}`}>{edge.source}</div>
                         <div className="w-32 h-[2px] bg-slate-800 relative">
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Waits For</div>
                           {(isActive || isCycle) && <motion.div className={`absolute top-0 bottom-0 left-0 ${isCycle ? 'bg-red-500' : 'bg-blue-500'}`} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.5 }}/>}
                         </div>
                         <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl border ${isActive || isCycle ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-950 border-slate-800'}`}>{edge.target}</div>
                       </div>
                     );
                   })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'trace' && (
            <motion.div key="trace" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col md:flex-row bg-slate-950">
              <div className="flex-1 border-r border-slate-800 bg-slate-900 relative p-8 overflow-hidden flex flex-col">
                <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2 shrink-0 uppercase tracking-wider"><Code size={16}/> DFS Algorithm Source</h3>
                <div className="font-mono text-sm leading-loose relative flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
                  {DFS_CODE.map((line, idx) => (
                    <div key={idx} className={`relative z-10 px-2 transition-colors duration-200 ${activeCodeLine === idx ? 'bg-blue-900/30 text-blue-300 font-bold border-l-4 border-blue-500' : 'text-slate-400 border-l-4 border-transparent'}`}>
                      <span className="text-slate-600 mr-4 select-none inline-block w-4 text-right">{idx + 1}</span>
                      <span dangerouslySetInnerHTML={{__html: line.replace(/let|function|return|while|if|break|true|false/g, m => `<span class="text-blue-400">${m}</span>`).replace(/\/\/.*$/g, m => `<span class="text-emerald-500 italic">${m}</span>`)}} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-80 bg-slate-950 p-8 flex flex-col border-l border-slate-800">
                <h3 className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2 shrink-0 uppercase tracking-wider"><Database size={16}/> Recursion Stack</h3>
                <div className="flex-1 flex flex-col justify-end gap-3 overflow-y-auto custom-scrollbar bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
                  {dfsStack.length === 0 ? <div className="text-slate-600 text-sm font-medium text-center pb-10">Stack is empty.</div> :
                    dfsStack.map((node, i) => (
                      <motion.div key={`${node}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`px-4 py-3 border text-center font-bold text-lg rounded-lg shadow-sm ${i === dfsStack.length - 1 ? 'bg-blue-900/50 border-blue-500/50 text-blue-400 scale-105' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>{node}</motion.div>
                    ))}
                </div>
                <AnimatePresence>
                  {detectedCycle && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-400 shadow-sm">
                      <strong className="block text-red-500 mb-2 flex items-center gap-2">Cycle Detected</strong>
                      <div className="text-sm font-mono bg-slate-950 p-2 rounded border border-red-900/50">Path: {detectedCycle.join(' → ')}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
