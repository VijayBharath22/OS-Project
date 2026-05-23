import React, { useState, useCallback, useMemo } from 'react';
import { Shield, Play, RotateCcw, Lock, Unlock, ChevronRight, ChevronLeft, Zap, ArrowRight, CheckCircle, XCircle, AlertTriangle, Hand, RefreshCw, ArrowDownUp, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSimulationStore, { useComputedSystemState } from '../store/useSimulationStore';
import MiniRAG from './prevention/MiniRAG';
import { ResourcePoolCounter, StepTimeline, ProcessStateChip, PreventionBanner } from './prevention/PreventionAnimations';

/* ═══════════════════════════════════════════════════════════════════════════
   PREVENTION PAGE — Real Protocol Execution Engine
   Each protocol calls real Zustand store actions that mutate global state.
   ═══════════════════════════════════════════════════════════════════════════ */

// Demo scenarios per protocol
const DEMO_SCENARIOS = {
  p1: { label: 'P1 requests R1,R2,R3 (all at once)', resources: [{ id:'R1', instances:2 },{ id:'R2', instances:1 },{ id:'R3', instances:1 }], processes: [{ id:'P1', max:{R1:1,R2:1,R3:1}, state:'running' },{ id:'P2', max:{R1:1,R2:1,R3:0}, state:'running' }], edges: [] },
  p2: { label: 'P1 holds R1, requests R2', resources: [{ id:'R1', instances:1 },{ id:'R2', instances:1 },{ id:'R3', instances:1 }], processes: [{ id:'P1', max:{R1:1,R2:1,R3:1}, state:'running' },{ id:'P2', max:{R1:0,R2:0,R3:1}, state:'running' }], edges: [{ source:'R1', target:'P1', type:'assignment' }] },
  p3: { label: 'P1 holds R1, requests unavailable R2', resources: [{ id:'R1', instances:1 },{ id:'R2', instances:1 }], processes: [{ id:'P1', max:{R1:1,R2:1}, state:'running' },{ id:'P2', max:{R1:0,R2:1}, state:'running' }], edges: [{ source:'R1', target:'P1', type:'assignment' },{ source:'R2', target:'P2', type:'assignment' }] },
  p4: { label: 'P2 requests R1 held by blocked P1', resources: [{ id:'R1', instances:1 },{ id:'R2', instances:1 }], processes: [{ id:'P1', max:{R1:1,R2:1}, state:'blocked' },{ id:'P2', max:{R1:1,R2:0}, state:'running' }], edges: [{ source:'R1', target:'P1', type:'assignment' },{ source:'R2', target:'P2', type:'assignment' },{ source:'P1', target:'R2', type:'request' }] },
};

export default function Prevention() {
  const processes = useSimulationStore(s => s.processes);
  const resources = useSimulationStore(s => s.resources);
  const edges = useSimulationStore(s => s.edges);
  const timeline = useSimulationStore(s => s.timeline);
  const injectState = useSimulationStore(s => s.injectState);
  const execP1 = useSimulationStore(s => s.executeHoldAndWaitAllAtOnce);
  const execP2 = useSimulationStore(s => s.executeHoldAndWaitReleaseFirst);
  const execP3 = useSimulationStore(s => s.executeNoPreemptionForceRelease);
  const execP4 = useSimulationStore(s => s.executeNoPreemptionFromBlocked);
  const execCW = useSimulationStore(s => s.executeCircularWaitOrdering);
  const computed = useComputedSystemState();

  const [activeTab, setActiveTab] = useState('holdwait');
  const [activeProtocol, setActiveProtocol] = useState(1);
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [executionSteps, setExecutionSteps] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const prevTimeline = useMemo(() => timeline.filter(t => t.eventType === 'prevention').slice(-20).reverse(), [timeline]);

  const loadDemo = (key) => {
    const d = DEMO_SCENARIOS[key];
    injectState({ resources: d.resources, processes: d.processes, edges: d.edges });
    setExecutionSteps(null); setCurrentStep(-1); setIsExecuting(false);
    setSelectedProcess(''); setSelectedResources([]); setSelectedResource('');
  };

  const resetExecution = () => { setExecutionSteps(null); setCurrentStep(-1); setIsExecuting(false); };

  const executeProtocol = useCallback(() => {
    let result;
    if (activeProtocol === 1 && selectedProcess && selectedResources.length > 0) {
      result = execP1(selectedProcess, selectedResources);
    } else if (activeProtocol === 2 && selectedProcess && selectedResources.length > 0) {
      result = execP2(selectedProcess, selectedResources);
    } else if (activeProtocol === 3 && selectedProcess && selectedResource) {
      result = execP3(selectedProcess, selectedResource);
    } else if (activeProtocol === 4 && selectedProcess && selectedResource) {
      result = execP4(selectedProcess, selectedResource);
    } else if (activeProtocol === 5 && selectedProcess && selectedResource) {
      result = execCW(selectedProcess, selectedResource);
    }
    if (result?.steps) {
      setExecutionSteps(result.steps);
      setCurrentStep(0);
      setIsExecuting(true);
    }
  }, [activeProtocol, selectedProcess, selectedResources, selectedResource, execP1, execP2, execP3, execP4, execCW]);

  const nextStep = () => { if (executionSteps && currentStep < executionSteps.length - 1) setCurrentStep(c => c + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(c => c - 1); };

  const tabs = [
    { id: 'holdwait', label: 'Hold & Wait', icon: <Hand size={16}/>, protocols: [1,2] },
    { id: 'nopreempt', label: 'No Preemption', icon: <Lock size={16}/>, protocols: [3,4] },
    { id: 'circwait', label: 'Circular Wait', icon: <ArrowDownUp size={16}/>, protocols: [5] },
  ];

  const protocolInfo = {
    1: { title: 'Request All Resources At Once', subtitle: 'A process must request ALL resources before execution. All-or-nothing allocation.', color: 'violet', demoKey: 'p1' },
    2: { title: 'Request Only When Holding None', subtitle: 'A process must release all held resources before requesting new ones.', color: 'violet', demoKey: 'p2' },
    3: { title: 'Force Resource Release', subtitle: 'If a process requests an unavailable resource, all its held resources are forcibly released.', color: 'orange', demoKey: 'p3' },
    4: { title: 'Preempt From Blocked Process', subtitle: 'If requested resource is held by a blocked process, preempt it and transfer ownership.', color: 'orange', demoKey: 'p4' },
    5: { title: 'Resource Ordering', subtitle: 'Resources are ordered numerically. Processes may only request higher-ordered resources.', color: 'cyan', demoKey: null },
  };

  const pi = protocolInfo[activeProtocol];
  const needsMultiSelect = activeProtocol <= 2;

  const toggleResource = (rId) => {
    setSelectedResources(prev => prev.includes(rId) ? prev.filter(r => r !== rId) : [...prev, rId]);
  };

  const canExecute = selectedProcess && (needsMultiSelect ? selectedResources.length > 0 : !!selectedResource);

  return (
    <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto">
      {/* Header & Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 pt-6 shrink-0 shadow-sm rounded-t-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-900/50 rounded-lg border border-violet-800"><Shield className="text-violet-400" size={24}/></div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Deadlock Prevention</h2>
            <p className="text-sm font-medium text-slate-400">Real-time protocol enforcement engine — protocols modify live system state</p>
          </div>
        </div>
        <div className="flex gap-4">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setActiveProtocol(tab.protocols[0]); resetExecution(); }}
              className={`pb-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${activeTab === tab.id ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab.icon} {tab.label}
              {activeTab === tab.id && <motion.div layoutId="prevTab" className="absolute bottom-0 left-0 right-0 h-1 bg-violet-500 rounded-t" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-slate-900 border border-t-0 border-slate-800 rounded-b-xl overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-5">

          {/* Protocol Selector (for tabs with 2 protocols) */}
          {tabs.find(t => t.id === activeTab)?.protocols.length > 1 && (
            <div className="flex gap-3">
              {tabs.find(t => t.id === activeTab).protocols.map(pNum => (
                <button key={pNum} onClick={() => { setActiveProtocol(pNum); resetExecution(); }}
                  className={`flex-1 p-4 rounded-xl border text-left transition-all ${activeProtocol === pNum
                    ? 'bg-slate-800 border-violet-700/50 shadow-md' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${activeProtocol === pNum
                    ? 'bg-violet-900/40 border-violet-700/50 text-violet-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>P{pNum}</span>
                  <h4 className={`text-sm font-bold mt-2 ${activeProtocol === pNum ? 'text-slate-100' : 'text-slate-400'}`}>{protocolInfo[pNum].title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{protocolInfo[pNum].subtitle}</p>
                </button>
              ))}
            </div>
          )}

          {/* Main Layout: Control Panel + RAG */}
          <div className="grid lg:grid-cols-5 gap-5">

            {/* Left: Protocol Execution Panel */}
            <div className="lg:col-span-3 space-y-4">

              {/* Protocol Header */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                    pi.color === 'violet' ? 'bg-violet-900/40 border-violet-700/50 text-violet-400' :
                    pi.color === 'orange' ? 'bg-orange-900/40 border-orange-700/50 text-orange-400' :
                    'bg-cyan-900/40 border-cyan-700/50 text-cyan-400'}`}>PROTOCOL {activeProtocol}</span>
                  <h3 className="text-lg font-bold text-slate-100">{pi.title}</h3>
                </div>
                <p className="text-sm text-slate-400">{pi.subtitle}</p>
                {pi.demoKey && (
                  <button onClick={() => loadDemo(pi.demoKey)}
                    className="mt-3 text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                    <Zap size={12}/> Load Demo Scenario
                  </button>
                )}
              </div>

              {/* Scenario Config */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Configure Request</h4>

                {/* Process Selection */}
                <div>
                  <label className="text-xs text-slate-500 font-bold mb-1 block">Requesting Process</label>
                  <select value={selectedProcess} onChange={e => setSelectedProcess(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none focus:border-violet-500 text-sm">
                    <option value="">Select Process...</option>
                    {processes.map(p => (
                      <option key={p.id} value={p.id}>{p.id} ({p.state})</option>
                    ))}
                  </select>
                </div>

                {/* Resource Selection */}
                {needsMultiSelect ? (
                  <div>
                    <label className="text-xs text-slate-500 font-bold mb-2 block">Requested Resources (select multiple)</label>
                    <div className="flex flex-wrap gap-2">
                      {resources.map(r => {
                        const allocated = edges.filter(e => e.type === 'assignment' && e.source === r.id).length;
                        const avail = r.instances - allocated;
                        const sel = selectedResources.includes(r.id);
                        return (
                          <button key={r.id} onClick={() => toggleResource(r.id)}
                            className={`px-3 py-2 rounded-lg border text-sm font-bold transition-all ${sel
                              ? 'bg-violet-900/40 border-violet-600 text-violet-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                            {r.id} <span className={`text-xs ml-1 ${avail > 0 ? 'text-emerald-500' : 'text-red-500'}`}>({avail}/{r.instances})</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedResources.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">Selected: <span className="text-violet-400 font-bold">{selectedResources.join(', ')}</span></div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-slate-500 font-bold mb-1 block">Requested Resource</label>
                    <select value={selectedResource} onChange={e => setSelectedResource(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 outline-none focus:border-violet-500 text-sm">
                      <option value="">Select Resource...</option>
                      {resources.map(r => {
                        const allocated = edges.filter(e => e.type === 'assignment' && e.source === r.id).length;
                        return <option key={r.id} value={r.id}>{r.id} ({r.instances - allocated}/{r.instances} free)</option>;
                      })}
                    </select>
                  </div>
                )}

                {/* Current Holdings Display */}
                {selectedProcess && (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Current Holdings: {selectedProcess}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ProcessStateChip state={processes.find(p => p.id === selectedProcess)?.state || 'idle'} size="sm" />
                      {edges.filter(e => e.type === 'assignment' && e.target === selectedProcess).map((e, i) => (
                        <span key={i} className="bg-emerald-900/30 border border-emerald-800/50 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">{e.source}</span>
                      ))}
                      {edges.filter(e => e.type === 'assignment' && e.target === selectedProcess).length === 0 && (
                        <span className="text-xs text-slate-600">No resources held</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Execute Button */}
                <div className="flex gap-3">
                  <button onClick={executeProtocol} disabled={!canExecute}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 text-white shadow-sm ${
                      canExecute ? 'bg-violet-600 hover:bg-violet-500' : 'bg-violet-900/30 text-violet-600 cursor-not-allowed'}`}>
                    <Play size={16}/> Execute Protocol {activeProtocol}
                  </button>
                  {executionSteps && (
                    <button onClick={resetExecution} className="p-3 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                      <RotateCcw size={16}/>
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Steps */}
              <AnimatePresence>
                {executionSteps && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Execution Trace</h4>
                      <div className="flex items-center gap-2">
                        <button onClick={prevStep} disabled={currentStep <= 0}
                          className="p-1.5 rounded border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14}/></button>
                        <span className="text-xs text-slate-500 font-bold">{currentStep + 1}/{executionSteps.length}</span>
                        <button onClick={nextStep} disabled={currentStep >= executionSteps.length - 1}
                          className="p-1.5 rounded border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14}/></button>
                      </div>
                    </div>
                    <StepTimeline steps={executionSteps} currentStep={currentStep} onStepClick={setCurrentStep} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Live System View */}
            <div className="lg:col-span-2 space-y-4">
              <MiniRAG height={260} />

              {/* Resource Availability */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Resource Availability</h4>
                <ResourcePoolCounter resources={resources} edges={edges} />
              </div>

              {/* Process States */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Process States</h4>
                <div className="space-y-2">
                  {processes.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                      <span className="text-sm font-bold text-slate-300">{p.id}</span>
                      <div className="flex items-center gap-2">
                        {edges.filter(e => e.type === 'assignment' && e.target === p.id).map((e, i) => (
                          <span key={i} className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded font-bold">{e.source}</span>
                        ))}
                        <ProcessStateChip state={p.state} size="sm" />
                      </div>
                    </div>
                  ))}
                  {processes.length === 0 && <p className="text-xs text-slate-600 text-center py-4">Load a demo scenario</p>}
                </div>
              </div>

              {/* Prevention Timeline */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><List size={12}/> Prevention Log</h4>
                {prevTimeline.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-3">Execute a protocol to see events</p>
                ) : prevTimeline.map(ev => (
                  <div key={ev.id} className="flex gap-2 text-xs py-1.5 border-b border-slate-800/50 last:border-0">
                    <span className="text-slate-600 font-mono shrink-0 w-14">{ev.timeLabel}</span>
                    <span className="text-violet-400 font-medium">{ev.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Protocol Explanation Cards */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Protocol {activeProtocol} — How It Prevents Deadlock</h4>
            {activeProtocol === 1 && <PreventionBanner type="prevention" message="Hold and Wait condition eliminated — process must request ALL resources at once. Either gets everything or gets nothing. Partial allocation never occurs." />}
            {activeProtocol === 2 && <PreventionBanner type="prevention" message="Hold and Wait condition eliminated — process cannot request resources while holding others. Must release everything first, then re-request all needed resources together." />}
            {activeProtocol === 3 && <PreventionBanner type="preempted" message="No Preemption condition eliminated — if a process requests an unavailable resource while holding others, the OS forcibly releases all held resources and moves the process to WAITING." />}
            {activeProtocol === 4 && <PreventionBanner type="preempted" message="No Preemption condition eliminated — if the requested resource is held by a blocked/waiting process, the OS preempts it and transfers ownership to the requester." />}
            {activeProtocol === 5 && <PreventionBanner type="prevention" message="Circular Wait condition eliminated — resources are ordered (R1 < R2 < R3...). A process may only request resources with a higher order than its highest held resource." />}
          </div>
        </div>
      </div>
    </div>
  );
}
