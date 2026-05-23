import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Network, Shield, Search, Stethoscope, Landmark, ArrowRight, AlertTriangle, Cpu, HardDrive, Lock } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';

export default function Introduction() {
  const setActiveModule = useSimulationStore(s => s.setActiveModule);

  const learningPath = [
    { id: 'coffman', label: 'Coffman Conditions', desc: 'Understand the 4 necessary conditions for deadlock', icon: <AlertTriangle size={24}/>, color: 'amber' },
    { id: 'prevention', label: 'Prevention', desc: 'Structurally eliminate deadlock conditions', icon: <Shield size={24}/>, color: 'violet' },
    { id: 'bankers', label: 'Avoidance (Banker\'s)', desc: 'Dynamically check safety before granting requests', icon: <Landmark size={24}/>, color: 'blue' },
    { id: 'detection', label: 'Detection', desc: 'Detect cycles using DFS on Wait-For Graphs', icon: <Search size={24}/>, color: 'cyan' },
    { id: 'recovery', label: 'Recovery', desc: 'Resolve deadlocks via termination or preemption', icon: <Stethoscope size={24}/>, color: 'red' },
    { id: 'quiz', label: 'Challenges', desc: 'Test your knowledge with interactive exercises', icon: <BookOpen size={24}/>, color: 'emerald' },
  ];

  const concepts = [
    { icon: <Cpu size={28}/>, title: 'Process', desc: 'An executing program that requests and holds resources. Represented as circles in the RAG.', color: 'text-blue-400' },
    { icon: <HardDrive size={28}/>, title: 'Resource', desc: 'A system asset (CPU, memory, printer) with one or more instances. Represented as squares in the RAG.', color: 'text-emerald-400' },
    { icon: <Lock size={28}/>, title: 'Deadlock', desc: 'A state where a set of processes are blocked, each waiting for a resource held by another process in the set.', color: 'text-red-400' },
    { icon: <Network size={28}/>, title: 'Resource Allocation Graph', desc: 'A directed graph where edges represent resource requests and assignments between processes and resources.', color: 'text-violet-400' },
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto py-10 space-y-12">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
        <div className="inline-flex p-4 bg-blue-900/30 border border-blue-800/50 rounded-2xl">
          <Network size={40} className="text-blue-400"/>
        </div>
        <h1 className="text-5xl font-black text-slate-100 tracking-tight leading-tight">
          Deadlock Management<br/>
          <span className="text-blue-400">Interactive Simulator</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          An interactive educational platform for understanding deadlocks in Operating Systems.
          Explore how deadlocks form, how to prevent them, and how to recover when they occur —
          all through visual, hands-on simulation.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={() => setActiveModule('coffman')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 text-lg">
            Start Learning <ArrowRight size={20}/>
          </button>
          <button onClick={() => setActiveModule('rag')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-8 rounded-xl transition-all border border-slate-700 text-lg">
            Open Simulator
          </button>
        </div>
      </motion.div>

      {/* Key Concepts */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Core Concepts</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {concepts.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-colors"
            >
              <div className={`${c.color} mb-3`}>{c.icon}</div>
              <h3 className="text-base font-bold text-slate-200 mb-1">{c.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Learning Path */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Learning Path</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningPath.map((step, i) => (
            <motion.button
              key={step.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              onClick={() => setActiveModule(step.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left hover:border-blue-500/50 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-700">{i + 1}</div>
                <span className="text-slate-400 group-hover:text-blue-400 transition-colors">{step.icon}</span>
              </div>
              <h3 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors mb-1">{step.label}</h3>
              <p className="text-xs text-slate-500">{step.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center shadow-sm">
        <p className="text-slate-400 text-sm leading-relaxed">
          This simulator uses a <strong className="text-slate-200">unified global state</strong> — every module shares the same
          processes, resources, and allocation data. Changes in any module propagate everywhere instantly.
        </p>
      </div>
    </div>
  );
}
