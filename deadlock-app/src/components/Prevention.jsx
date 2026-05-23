import React, { useState } from 'react';
import { Shield, Lock, Activity, Ban, CheckCircle, Play, Cpu, AlertTriangle } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';

export default function Prevention() {
  const prevention = useSimulationStore(s => s.prevention);
  const togglePrevention = useSimulationStore(s => s.togglePrevention);
  const [sandboxAction, setSandboxAction] = useState('holdAndWaitTest');
  const [sandboxResult, setSandboxResult] = useState(null);

  const runSandbox = () => {
    if (sandboxAction === 'holdAndWaitTest') {
      if (prevention.holdAndWait) setSandboxResult({ status: 'BLOCKED', msg: 'OS rejected request. Process P1 is already holding resources and must release them before requesting new ones.', icon: <Ban className="text-red-500" size={24}/>, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50' });
      else setSandboxResult({ status: 'ALLOWED', msg: 'OS allowed request. Process P1 granted resource while holding another (Deadlock Risk).', icon: <CheckCircle className="text-emerald-500" size={24}/>, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/50' });
    } else if (sandboxAction === 'preemptionTest') {
      if (prevention.noPreemption) setSandboxResult({ status: 'ALLOWED', msg: 'OS forcibly preempted resource from Process P2.', icon: <CheckCircle className="text-emerald-500" size={24}/>, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/50' });
      else setSandboxResult({ status: 'BLOCKED', msg: 'OS rejected preemption. Process P2 cannot be forcibly stripped of its resources.', icon: <Ban className="text-red-500" size={24}/>, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50' });
    } else if (sandboxAction === 'circularWaitTest') {
      if (prevention.circularWait) setSandboxResult({ status: 'BLOCKED', msg: 'OS rejected request. Process P3 requested Resource R1, but already holds higher-order Resource R3.', icon: <Ban className="text-red-500" size={24}/>, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50' });
      else setSandboxResult({ status: 'ALLOWED', msg: 'OS allowed request. Process P3 granted Resource R1, forming a potential circular wait.', icon: <CheckCircle className="text-emerald-500" size={24}/>, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/50' });
    }
  };

  const coffmanConditions = [
    { id: 'mutualExclusion', title: 'Mutual Exclusion', desc: 'Resources cannot be shared. (Required for non-sharable resources like printers).', effect: 'If disabled, processes can simultaneously access the same resource.', enforceable: false },
    { id: 'holdAndWait', title: 'Hold and Wait', desc: 'A process holding at least one resource is waiting to acquire additional resources held by other processes.', effect: 'If disabled, processes must request all required resources at once. In the RAG Builder, a process holding a resource will be denied from requesting another.', enforceable: true },
    { id: 'noPreemption', title: 'No Preemption', desc: 'Resources cannot be forcibly taken from a process.', effect: 'If disabled, the OS can forcefully steal resources. In the Recovery Console, the Preemption tool becomes active.', enforceable: true },
    { id: 'circularWait', title: 'Circular Wait', desc: 'A closed chain of processes exists, where each process holds at least one resource needed by the next process in the chain.', effect: 'If disabled, resources are ordered numerically. A process can only request resources of a higher order than what it currently holds.', enforceable: true }
  ];

  return (
    <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto py-8">
      <div className="text-center mb-10 shrink-0">
        <div className="inline-flex p-3 bg-blue-900/50 border border-blue-800 rounded-2xl mb-4"><Shield size={32} className="text-blue-400"/></div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Deadlock Prevention</h1>
        <p className="text-slate-400 font-medium mt-2 max-w-xl mx-auto">Deadlock prevention works by ensuring that at least one of the four Coffman conditions cannot hold.</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-8 flex-1 overflow-y-auto custom-scrollbar">
        <div className="bg-blue-900/30 border border-blue-800/50 p-4 rounded-lg mb-8 text-blue-300 text-sm">
          <strong>Interactive Rules Engine:</strong> Toggling the switches below will physically alter the behavior of the Operating System Simulator. If you disable a condition, the RAG Builder and Recovery Console will actively enforce that rule.
        </div>
        <div className="space-y-6">
          {coffmanConditions.map((cond) => {
            const isActive = prevention[cond.id];
            return (
              <div key={cond.id} className={`p-6 border rounded-xl transition-all ${isActive ? 'bg-red-900/10 border-red-800/50' : 'bg-slate-950 border-slate-800 hover:border-blue-500/50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-3 mb-2">
                      {isActive ? <Ban size={20} className="text-red-400"/> : <Lock size={20} className="text-emerald-400"/>}
                      <h3 className={`text-lg font-bold ${isActive ? 'text-red-400' : 'text-slate-200'}`}>{cond.title}</h3>
                      {isActive && <span className="px-2 py-0.5 text-xs font-bold bg-red-900/30 text-red-400 rounded border border-red-800/50">CONDITION ACTIVE</span>}
                      {!isActive && <span className="px-2 py-0.5 text-xs font-bold bg-emerald-900/30 text-emerald-400 rounded border border-emerald-800/50">PREVENTED</span>}
                    </div>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{cond.desc}</p>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded text-sm text-slate-300 flex gap-3"><Activity size={18} className="text-blue-500 shrink-0"/><p><strong>Simulation Effect:</strong> {cond.effect}</p></div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {cond.enforceable ? (
                      <button onClick={() => togglePrevention(cond.id)} className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-red-500' : 'bg-emerald-500'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-slate-950 transition-transform ${isActive ? 'translate-x-8' : 'translate-x-1'}`}/>
                      </button>
                    ) : (<div className="text-xs text-slate-500 font-bold bg-slate-800 px-3 py-1.5 rounded">HARDWARE BOUND</div>)}
                    <span className="text-xs font-bold text-slate-500 uppercase">{isActive ? 'Allowed' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prevention Sandbox */}
        <div className="mt-12 bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-900/30 rounded-lg border border-blue-800"><Cpu className="text-blue-400" size={20}/></div>
            <div><h3 className="text-xl font-bold text-slate-100">Prevention Policy Sandbox</h3><p className="text-sm text-slate-400">Simulate OS behavior under current active rules.</p></div>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <select className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 outline-none focus:border-blue-500 transition-colors" value={sandboxAction} onChange={(e) => { setSandboxAction(e.target.value); setSandboxResult(null); }}>
                <option value="holdAndWaitTest">Simulate: P1 requests R2 while holding R1</option>
                <option value="preemptionTest">Simulate: OS attempts to preempt R1 from P2</option>
                <option value="circularWaitTest">Simulate: P3 requests R1 while holding R3</option>
              </select>
              <button onClick={runSandbox} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md">Test Action Against Policies <Play size={18}/></button>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              {sandboxResult ? (
                <div className={`p-6 rounded-xl border flex gap-4 items-start transition-all ${sandboxResult.bg}`}>
                  <div className="shrink-0 mt-1">{sandboxResult.icon}</div>
                  <div><h4 className={`font-bold tracking-wider mb-2 ${sandboxResult.color}`}>{sandboxResult.status}</h4><p className="text-slate-300 text-sm leading-relaxed">{sandboxResult.msg}</p></div>
                </div>
              ) : (
                <div className="h-full min-h-[100px] border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-sm p-6 text-center">Select a scenario and click Test Action to see how the current OS policies handle it.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
