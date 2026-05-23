import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';

/**
 * ProtocolCard — Reusable wrapper for each prevention protocol demo.
 * Provides consistent layout: header, configuration, execution, and result areas.
 */
export default function ProtocolCard({
  protocolNumber,
  title,
  subtitle,
  description,
  accentColor = 'blue',    // 'violet' | 'orange' | 'cyan' | 'blue'
  icon,
  children,                 // Main content (scenario config + execution)
  steps,
  currentStep,
  isExecuting,
  onExecute,
  onReset,
  onNextStep,
  onPrevStep,
  canExecute = true,
  executionResult,          // 'success' | 'denied' | 'preempted' | null
}) {

  const accentStyles = {
    violet: { headerBg: 'rgba(76,29,149,0.2)', headerBorder: 'rgba(109,40,217,0.3)', badge: 'bg-violet-900/40 border-violet-700/50 text-violet-400', btn: 'bg-violet-600 hover:bg-violet-500', btnDisabled: 'bg-violet-900/30 text-violet-600' },
    orange: { headerBg: 'rgba(124,45,18,0.2)', headerBorder: 'rgba(194,65,12,0.3)', badge: 'bg-orange-900/40 border-orange-700/50 text-orange-400', btn: 'bg-orange-600 hover:bg-orange-500', btnDisabled: 'bg-orange-900/30 text-orange-600' },
    cyan: { headerBg: 'rgba(8,51,68,0.3)', headerBorder: 'rgba(6,182,212,0.3)', badge: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-400', btn: 'bg-cyan-600 hover:bg-cyan-500', btnDisabled: 'bg-cyan-900/30 text-cyan-600' },
    blue: { headerBg: 'rgba(30,58,138,0.2)', headerBorder: 'rgba(37,99,235,0.3)', badge: 'bg-blue-900/40 border-blue-700/50 text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500', btnDisabled: 'bg-blue-900/30 text-blue-600' },
  };

  const s = accentStyles[accentColor] || accentStyles.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-slate-800 flex items-center gap-3"
        style={{ background: s.headerBg, borderBottomColor: s.headerBorder }}
      >
        <div className={`${s.badge} border rounded-lg p-2 shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`${s.badge} border text-[10px] font-black px-2 py-0.5 rounded`}>P{protocolNumber}</span>
            <h3 className="text-base font-bold text-slate-100 truncate">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-3 border-b border-slate-800/50 flex items-start gap-2">
        <BookOpen size={14} className="text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      {/* Main Content */}
      <div className="p-5">
        {children}
      </div>

      {/* Execution Controls */}
      <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center gap-3">
        {!isExecuting ? (
          <>
            <button
              onClick={onExecute}
              disabled={!canExecute}
              className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 text-white shadow-sm ${
                canExecute ? s.btn : s.btnDisabled + ' cursor-not-allowed'
              }`}
            >
              <Play size={16} /> Execute Protocol
            </button>
            {executionResult !== null && (
              <button
                onClick={onReset}
                className="p-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <button
              onClick={onPrevStep}
              disabled={currentStep <= 0}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 text-center">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Step {currentStep + 1} / {steps?.length || 0}
              </div>
              <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: accentColor === 'violet' ? '#8b5cf6' : accentColor === 'orange' ? '#f97316' : accentColor === 'cyan' ? '#06b6d4' : '#3b82f6' }}
                  animate={{ width: `${((currentStep + 1) / (steps?.length || 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            <button
              onClick={currentStep >= (steps?.length || 0) - 1 ? onReset : onNextStep}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              {currentStep >= (steps?.length || 0) - 1 ? <RotateCcw size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
