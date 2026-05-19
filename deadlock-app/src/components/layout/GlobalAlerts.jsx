import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { detectCycle } from '../../utils/cycleDetect';

export default function GlobalAlerts() {
  const { state, dispatch, computed } = useSystem();
  
  // Auto-trigger alerts based on live system state
  useEffect(() => {
     // Check if deadlock formed but user is NOT in RAG or Detection or Recovery
     const cycleNodes = detectCycle(computed.nodes, state.edges) || [];
     if (cycleNodes.length > 0 && state.activeModule !== 'detection' && state.activeModule !== 'recovery') {
         // Prevent spamming
         if (!state.globalAlert) {
            dispatch({ 
                type: 'TRIGGER_ALERT', 
                payload: { 
                    type: 'danger', 
                    msg: 'DEADLOCK DETECTED in global state.', 
                    actionModule: 'detection', 
                    actionText: 'Open Detection Engine' 
                } 
            });
         }
     } else if (cycleNodes.length === 0 && state.globalAlert?.type === 'danger') {
         dispatch({ type: 'CLEAR_ALERT' });
     }
  }, [computed.nodes, state.edges, state.activeModule, state.globalAlert, dispatch]);

  const handleAction = () => {
      if (state.globalAlert?.actionModule) {
          dispatch({ type: 'SET_ACTIVE_MODULE', payload: state.globalAlert.actionModule });
      }
      dispatch({ type: 'CLEAR_ALERT' });
  };

  return (
    <AnimatePresence>
       {state.globalAlert && (
          <motion.div 
             initial={{ opacity: 0, y: -50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: -50, scale: 0.9 }}
             className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border bg-red-950/90 border-red-500 text-red-200 backdrop-blur-md"
          >
             <ShieldAlert className="animate-pulse" size={24} />
             <div>
                <div className="font-bold font-mono tracking-wide">{state.globalAlert.msg}</div>
             </div>
             
             {state.globalAlert.actionModule && (
                 <button 
                   onClick={handleAction}
                   className="ml-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-colors"
                 >
                   {state.globalAlert.actionText} <ArrowRight size={14}/>
                 </button>
             )}

             <button onClick={() => dispatch({ type: 'CLEAR_ALERT' })} className="ml-2 text-red-400 hover:text-white">
                <X size={18}/>
             </button>
          </motion.div>
       )}
    </AnimatePresence>
  );
}
