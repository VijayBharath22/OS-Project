import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Cpu, Database, Trash2 } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import { playBeep } from '../utils/audio';

export default function SystemModel() {
  const processes = useSimulationStore(s => s.processes);
  const resources = useSimulationStore(s => s.resources);
  const addProcess = useSimulationStore(s => s.addProcess);
  const addResource = useSimulationStore(s => s.addResource);
  const removeProcess = useSimulationStore(s => s.removeProcess);
  const removeResource = useSimulationStore(s => s.removeResource);
  const updateResource = useSimulationStore(s => s.updateResource);

  const updateInstances = (id, delta, current) => {
    playBeep();
    const newCount = Math.max(1, Math.min(10, current + delta));
    updateResource(id, newCount);
  };

  const totalInstances = resources.reduce((acc, r) => acc + r.instances, 0);

  return (
    <section id="system-model" className="py-20 px-4 max-w-5xl mx-auto relative z-10">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-blue-400 mb-4 tracking-tight">§7.1 — The System Model</h2>
        <p className="text-slate-400 text-lg">Configure the global system state. Changes here propagate to all modules instantly.</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-sm">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-blue-300 font-mono"><Cpu className="text-blue-400" /> PROCESS_POOL</h3>
              <button onClick={() => { playBeep(); addProcess(); }} className="bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 text-blue-300 px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center gap-1"><Plus size={16} /> Spawn</button>
            </div>
            <div className="flex flex-wrap gap-4">
              <AnimatePresence>
                {processes.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="group relative w-16 h-16 rounded-full border-2 border-blue-500/50 bg-slate-800 flex items-center justify-center font-bold text-blue-300">
                    {p.id}
                    <button onClick={() => { playBeep(); removeProcess(p.id); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 size={12} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-red-400 font-mono"><Database className="text-red-400" /> RESOURCE_POOL</h3>
              <button onClick={() => { playBeep(); addResource({ instances: 1 }); }} className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300 px-3 py-1 rounded text-sm font-semibold transition-colors flex items-center gap-1"><Plus size={16} /> Mount</button>
            </div>
            <div className="flex flex-wrap gap-4">
              <AnimatePresence>
                {resources.map(r => (
                  <motion.div key={r.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="group relative px-4 py-3 rounded-xl border-2 border-red-500/50 bg-slate-800 min-w-[100px] flex flex-col items-center">
                    <button onClick={() => { playBeep(); removeResource(r.id); }} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 size={12} /></button>
                    <span className="font-bold text-red-300 mb-2">{r.id}</span>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
                      <button onClick={() => updateInstances(r.id, -1, r.instances)} className="p-1 hover:text-red-400 text-slate-500"><Minus size={14} /></button>
                      <span className="text-sm font-mono w-4 text-center">{r.instances}</span>
                      <button onClick={() => updateInstances(r.id, 1, r.instances)} className="p-1 hover:text-red-400 text-slate-500"><Plus size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-700/50 flex justify-center">
          <div className="bg-slate-950 border border-slate-700 px-6 py-3 rounded text-sm font-mono text-slate-300 flex items-center gap-4 shadow-inner">
            <span><span className="text-blue-400 font-bold">{processes.length}</span> Active Threads</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span><span className="text-red-400 font-bold">{resources.length}</span> Hardware Types</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span><span className="text-red-400 font-bold">{totalInstances}</span> Total Instances</span>
          </div>
        </div>
      </div>
    </section>
  );
}
