import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystem } from '../../context/SystemContext';

export default function BottomTerminal() {
  const { state } = useSystem();
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (logsEndRef.current) {
       logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.logs, isExpanded]);

  return (
    <div className={`bg-[#0d1117] border-t border-slate-800 flex flex-col shrink-0 transition-all duration-300 z-30 ${isExpanded ? 'h-64' : 'h-8'}`}>
       <div 
         className="h-8 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-800 select-none"
         onClick={() => setIsExpanded(!isExpanded)}
       >
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-500 font-bold tracking-widest">
             <TerminalIcon size={14}/> SYSTEM_EVENT_LOG
          </div>
          <div className="flex items-center gap-2 text-slate-500">
             {state.logs.length > 0 && <span className="text-[10px] bg-slate-800 px-2 rounded-full">{state.logs.length} EVENTS</span>}
             {isExpanded ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
          </div>
       </div>

       <AnimatePresence>
         {isExpanded && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 custom-scrollbar"
            >
               {state.logs.map((log) => (
                 <div key={log.id} className={`flex ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-cyan-200 opacity-90'}`}>
                   <span className="text-slate-600 mr-3 shrink-0">[{log.time}]</span>
                   <span className="break-words">{log.msg}</span>
                 </div>
               ))}
               <div ref={logsEndRef} />
            </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
