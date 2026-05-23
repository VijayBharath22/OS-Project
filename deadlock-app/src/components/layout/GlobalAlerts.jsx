import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import useSimulationStore, { useComputedSystemState } from '../../store/useSimulationStore';

export default function GlobalAlerts() {
  const activeModule = useSimulationStore(s => s.activeModule);
  const globalAlert = useSimulationStore(s => s.globalAlert);
  const triggerAlert = useSimulationStore(s => s.triggerAlert);
  const clearAlert = useSimulationStore(s => s.clearAlert);
  const setActiveModule = useSimulationStore(s => s.setActiveModule);

  const { hasDeadlock } = useComputedSystemState();

  useEffect(() => {
    if (hasDeadlock && activeModule !== 'detection' && activeModule !== 'recovery') {
      if (!globalAlert) {
        triggerAlert({
          type: 'danger',
          msg: 'DEADLOCK DETECTED in global state.',
          actionModule: 'detection',
          actionText: 'Open Detection Engine'
        });
      }
    } else if (!hasDeadlock && globalAlert?.type === 'danger') {
      clearAlert();
    }
  }, [hasDeadlock, activeModule, globalAlert]);

  const handleAction = () => {
    if (globalAlert?.actionModule) setActiveModule(globalAlert.actionModule);
    clearAlert();
  };

  return (
    <AnimatePresence>
      {globalAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border bg-red-950/90 border-red-500 text-red-200 backdrop-blur-md"
        >
          <ShieldAlert className="animate-pulse" size={24} />
          <div><div className="font-bold font-mono tracking-wide">{globalAlert.msg}</div></div>
          {globalAlert.actionModule && (
            <button onClick={handleAction} className="ml-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-colors">
              {globalAlert.actionText} <ArrowRight size={14}/>
            </button>
          )}
          <button onClick={clearAlert} className="ml-2 text-red-400 hover:text-white"><X size={18}/></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
