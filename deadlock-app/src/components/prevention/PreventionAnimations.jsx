import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Loader, Shield, Zap, RotateCcw, Search } from 'lucide-react';

// ─── Process State Chip ─────────────────────────────────────────────────────
export function ProcessStateChip({ state, size = 'md' }) {
  const config = {
    running: { bg: 'bg-emerald-900/40', border: 'border-emerald-700/60', text: 'text-emerald-400', label: 'RUNNING' },
    waiting: { bg: 'bg-amber-900/40', border: 'border-amber-700/60', text: 'text-amber-400', label: 'WAITING' },
    blocked: { bg: 'bg-red-900/40', border: 'border-red-700/60', text: 'text-red-400', label: 'BLOCKED' },
    requesting: { bg: 'bg-blue-900/40', border: 'border-blue-700/60', text: 'text-blue-400', label: 'REQUESTING' },
    releasing: { bg: 'bg-orange-900/40', border: 'border-orange-700/60', text: 'text-orange-400', label: 'RELEASING' },
    preempting: { bg: 'bg-rose-900/40', border: 'border-rose-700/60', text: 'text-rose-400', label: 'PREEMPTING' },
    idle: { bg: 'bg-slate-800/60', border: 'border-slate-700/60', text: 'text-slate-400', label: 'IDLE' },
    transferring: { bg: 'bg-violet-900/40', border: 'border-violet-700/60', text: 'text-violet-400', label: 'TRANSFERRING' },
    searching: { bg: 'bg-cyan-900/40', border: 'border-cyan-700/60', text: 'text-cyan-400', label: 'SEARCHING' },
    terminated: { bg: 'bg-slate-900/60', border: 'border-slate-800', text: 'text-slate-600', label: 'TERMINATED' },
  };
  const c = config[state] || config.idle;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <motion.span
      key={state}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${c.bg} ${c.border} ${c.text} ${sizeClass} border rounded-md font-black uppercase tracking-widest inline-flex items-center gap-1`}
    >
      {state === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {c.label}
    </motion.span>
  );
}

// ─── Resource Pill ──────────────────────────────────────────────────────────
export function ResourcePill({ resourceId, status = 'neutral', animated = false }) {
  const colors = {
    available: 'bg-emerald-900/50 border-emerald-700/60 text-emerald-400',
    unavailable: 'bg-red-900/50 border-red-700/60 text-red-400',
    allocated: 'bg-blue-900/50 border-blue-700/60 text-blue-400',
    released: 'bg-orange-900/50 border-orange-700/60 text-orange-400',
    neutral: 'bg-slate-800 border-slate-700 text-slate-300',
    preempted: 'bg-rose-900/50 border-rose-700/60 text-rose-400',
    transferred: 'bg-violet-900/50 border-violet-700/60 text-violet-400',
  };

  return (
    <motion.span
      initial={animated ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      exit={animated ? { scale: 0, opacity: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`${colors[status]} border rounded-lg px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 font-mono`}
    >
      {status === 'available' && <CheckCircle size={12} />}
      {status === 'unavailable' && <XCircle size={12} />}
      {status === 'released' && <RotateCcw size={12} />}
      {status === 'preempted' && <Zap size={12} />}
      {resourceId}
    </motion.span>
  );
}

// ─── Step Timeline ──────────────────────────────────────────────────────────
export function StepTimeline({ steps, currentStep, onStepClick }) {
  const getStepIcon = (step, idx) => {
    const isActive = idx === currentStep;
    const isDone = idx < currentStep;

    if (step.type === 'request') return <ArrowRight size={14} />;
    if (step.type === 'check' || step.type === 'inspect' || step.type === 'scan') return <Search size={14} />;
    if (step.type === 'allocate') return <CheckCircle size={14} />;
    if (step.type === 'deny' || step.type === 'denied') return <XCircle size={14} />;
    if (step.type === 'release' || step.type === 'force_release') return <RotateCcw size={14} />;
    if (step.type === 'preempt' || step.type === 'preempt_trigger' || step.type === 'victim_select') return <Zap size={14} />;
    if (step.type === 'prevention' || step.type === 'success') return <Shield size={14} />;
    if (step.type === 'violation') return <AlertTriangle size={14} />;
    return <ArrowRight size={14} />;
  };

  const getStepColor = (step) => {
    if (step.type === 'allocate' || step.type === 'success' || step.type === 'allowed' || step.type === 'transfer_complete' || step.type === 'clear') return 'emerald';
    if (step.type === 'deny' || step.type === 'denied' || step.type === 'unavailable') return 'red';
    if (step.type === 'release' || step.type === 'force_release' || step.type === 'preempt' || step.type === 'preempt_trigger') return 'orange';
    if (step.type === 'violation' || step.type === 'victim_select') return 'amber';
    if (step.type === 'prevention') return 'violet';
    if (step.type === 'rerequest' || step.type === 'request') return 'blue';
    return 'slate';
  };

  return (
    <div className="space-y-1">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isDone = idx < currentStep;
        const isFuture = idx > currentStep;
        const color = getStepColor(step);

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isFuture ? 0.35 : 1, x: 0 }}
            transition={{ delay: isDone ? 0 : idx * 0.05 }}
            onClick={() => onStepClick?.(idx)}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              isActive
                ? `bg-${color}-900/30 border-${color}-700/50`
                : isDone
                ? 'bg-slate-900/50 border-slate-800/50'
                : 'bg-slate-950/50 border-slate-800/30'
            }`}
            style={isActive ? {
              background: color === 'emerald' ? 'rgba(6,78,59,0.3)' : color === 'red' ? 'rgba(127,29,29,0.3)' : color === 'orange' ? 'rgba(124,45,18,0.3)' : color === 'amber' ? 'rgba(120,53,15,0.3)' : color === 'violet' ? 'rgba(76,29,149,0.3)' : color === 'blue' ? 'rgba(30,58,138,0.3)' : 'rgba(30,41,59,0.3)',
              borderColor: color === 'emerald' ? 'rgba(6,95,70,0.5)' : color === 'red' ? 'rgba(185,28,28,0.5)' : color === 'orange' ? 'rgba(194,65,12,0.5)' : color === 'amber' ? 'rgba(180,83,9,0.5)' : color === 'violet' ? 'rgba(109,40,217,0.5)' : color === 'blue' ? 'rgba(37,99,235,0.5)' : 'rgba(51,65,85,0.5)'
            } : {}}
          >
            {/* Step indicator */}
            <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs border ${
              isActive ? 'border-current animate-pulse' : isDone ? 'border-slate-600' : 'border-slate-800'
            }`}
              style={{ color: isActive ? (color === 'emerald' ? '#34d399' : color === 'red' ? '#f87171' : color === 'orange' ? '#fb923c' : color === 'amber' ? '#fbbf24' : color === 'violet' ? '#a78bfa' : color === 'blue' ? '#60a5fa' : '#94a3b8') : isDone ? '#64748b' : '#334155' }}
            >
              {isDone ? <CheckCircle size={14} /> : getStepIcon(step, idx)}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${
                isActive ? 'text-slate-100' : isDone ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {step.msg}
              </p>

              {/* Availability checks detail */}
              {isActive && step.checks && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.checks.map((c, ci) => (
                    <ResourcePill
                      key={ci}
                      resourceId={`${c.rId}: ${c.available}/${c.total}`}
                      status={c.ok ? 'available' : 'unavailable'}
                      animated
                    />
                  ))}
                </div>
              )}

              {/* Prevention banner */}
              {isActive && step.banner && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 bg-violet-900/30 border border-violet-800/50 rounded-lg px-3 py-2 text-xs text-violet-300 font-bold flex items-center gap-2"
                >
                  <Shield size={14} className="text-violet-400 shrink-0" />
                  {step.banner}
                </motion.div>
              )}

              {/* Process state indicator */}
              {isActive && step.processState && (
                <div className="mt-2">
                  <ProcessStateChip state={step.processState} size="sm" />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Resource Pool Counter ──────────────────────────────────────────────────
export function ResourcePoolCounter({ resources, edges }) {
  return (
    <div className="flex flex-wrap gap-2">
      {resources.map(r => {
        const allocated = edges.filter(e => e.type === 'assignment' && e.source === r.id).length;
        const available = r.instances - allocated;
        return (
          <motion.div
            key={r.id}
            layout
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-center min-w-[72px]"
          >
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{r.id}</div>
            <motion.div
              key={available}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`text-lg font-black ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {available}
            </motion.div>
            <div className="text-[10px] text-slate-600 font-mono">/{r.instances}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Prevention Result Banner ───────────────────────────────────────────────
export function PreventionBanner({ type, message }) {
  const configs = {
    success: { bg: 'rgba(6,78,59,0.25)', border: 'rgba(6,95,70,0.5)', text: 'text-emerald-300', icon: <CheckCircle size={20} className="text-emerald-400" /> },
    denied: { bg: 'rgba(127,29,29,0.25)', border: 'rgba(185,28,28,0.5)', text: 'text-red-300', icon: <XCircle size={20} className="text-red-400" /> },
    preempted: { bg: 'rgba(124,45,18,0.25)', border: 'rgba(194,65,12,0.5)', text: 'text-orange-300', icon: <Zap size={20} className="text-orange-400" /> },
    prevention: { bg: 'rgba(76,29,149,0.25)', border: 'rgba(109,40,217,0.5)', text: 'text-violet-300', icon: <Shield size={20} className="text-violet-400" /> },
  };
  const c = configs[type] || configs.prevention;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`${c.text} p-4 rounded-xl border flex items-start gap-3`}
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div className="shrink-0 mt-0.5">{c.icon}</div>
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </motion.div>
  );
}

// ─── Availability Check Grid ────────────────────────────────────────────────
export function AvailabilityGrid({ checks }) {
  if (!checks || checks.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {checks.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`p-3 rounded-lg border text-center ${
            c.ok
              ? 'bg-emerald-900/20 border-emerald-800/40'
              : 'bg-red-900/20 border-red-800/40'
          }`}
        >
          <div className={`text-sm font-black ${c.ok ? 'text-emerald-400' : 'text-red-400'}`}>{c.rId}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {c.available}/{c.total} free
          </div>
          <div className="mt-1">
            {c.ok ? <CheckCircle size={14} className="text-emerald-500 mx-auto" /> : <XCircle size={14} className="text-red-500 mx-auto" />}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
