import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Play, Pause, StepForward, StepBack, RotateCcw, Activity, CheckCircle2, Grid, Plus, Trash2, ShieldQuestion } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { playSuccess, playAlarm } from '../utils/audio';

export default function BankersAlgorithm() {
  const { state, dispatch, computed } = useSystem();
  const { processes, resources } = state;
  const { allocationMatrix, maxMatrix, needMatrix = processes.map((p, i) => resources.map((r, j) => Math.max(0, maxMatrix[i][j] - allocationMatrix[i][j]))), availableVector } = computed;

  // Simulation State
  const [animSteps, setAnimSteps] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [liveWork, setLiveWork] = useState([]);
  const [liveFinish, setLiveFinish] = useState([]);
  const [liveProcess, setLiveProcess] = useState(null);
  const [liveExplanation, setLiveExplanation] = useState('Simulation awaiting initiation...');
  
  // Auto-Play State
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef(null);
  
  // Pending Request Context (for when simulating a resource request visually)
  const [pendingRequest, setPendingRequest] = useState(null);

  // Resource Request Form State
  const [reqProcess, setReqProcess] = useState('');
  const [reqVector, setReqVector] = useState(resources.map(() => 0));

  // Update reqVector length if resources change
  useEffect(() => {
     if (reqVector.length !== resources.length) setReqVector(resources.map(() => 0));
  }, [resources.length]);

  const generateSafetySteps = (available, allocation, need) => {
      const numProcesses = processes.length;
      const numResources = resources.length;
      let work = [...available];
      let finish = new Array(numProcesses).fill(false);
      const steps = []; 
      let count = 0;
      let madeProgress = true;
      
      steps.push({ type: 'INIT', work: [...work], finish: [...finish], msg: `Step 0: Initialize Work = Available vector [${work.join(', ')}]. Finish = all false.` });

      while (count < numProcesses && madeProgress) {
        madeProgress = false;
        for (let i = 0; i < numProcesses; i++) {
          if (!finish[i]) {
            steps.push({ type: 'CHECK_PROCESS', processIndex: i, work: [...work], finish: [...finish], msg: `Evaluating ${processes[i].id}: Need [${need[i].join(', ')}] vs Work [${work.join(', ')}].` });
            let canAllocate = true;
            for (let j = 0; j < numResources; j++) {
              if (need[i][j] > work[j]) { canAllocate = false; break; }
            }
            if (canAllocate) {
              steps.push({ type: 'PROCESS_CAN_FINISH', processIndex: i, work: [...work], finish: [...finish], msg: `${processes[i].id} is safe. Need <= Work. Executing...` });
              for (let j = 0; j < numResources; j++) work[j] += allocation[i][j];
              finish[i] = true;
              count++;
              madeProgress = true;
              steps.push({ type: 'PROCESS_FINISHED', processIndex: i, work: [...work], finish: [...finish], msg: `${processes[i].id} completes and releases resources. New Work = [${work.join(', ')}].` });
            } else {
              steps.push({ type: 'PROCESS_CANNOT_FINISH', processIndex: i, work: [...work], finish: [...finish], msg: `${processes[i].id} must wait. Need > Work.` });
            }
          }
        }
      }
      steps.push({ type: 'DONE', work: [...work], finish: [...finish], msg: count === numProcesses ? `System is in a SAFE state. Safe sequence found.` : `System is UNSAFE. Circular wait imminent.` });
      return { isSafe: count === numProcesses, steps };
  };

  const initSimulation = () => {
     setIsPlaying(false);
     setPendingRequest(null);
     const result = generateSafetySteps(availableVector, allocationMatrix, needMatrix);
     setAnimSteps(result.steps);
     setCurrentStepIndex(0);
     setLiveWork([...availableVector]);
     setLiveFinish(new Array(processes.length).fill(false));
     setLiveExplanation(result.steps[0].msg);
     dispatch({ type: 'ADD_LOG', payload: { msg: `> BANKER: Initialized standard Safety Algorithm.`, type: 'info' } });
     
     // Scroll to visualizer
     document.getElementById('bankers-visualizer')?.scrollIntoView({ behavior: 'smooth' });
  };

  const applyStep = (step) => {
      if (step.processIndex !== undefined) setLiveProcess(step.processIndex);
      else setLiveProcess(null);
      setLiveWork(step.work);
      setLiveFinish(step.finish);
      setLiveExplanation(step.msg);

      if (step.type === 'DONE') {
          setIsPlaying(false);
          const allFinished = step.finish.every(f => f);
          if (allFinished) {
              playSuccess();
              if (pendingRequest) {
                  // Official Grant
                  dispatch({ type: 'ADD_LOG', payload: { msg: `> GRANTED: Request by ${pendingRequest.pId} is SAFE. Resources allocated.`, type: 'info' } });
                  pendingRequest.req.forEach((reqAmt, rIdx) => {
                      if (reqAmt > 0) {
                          dispatch({ type: 'SET_ALLOCATION', payload: { pId: pendingRequest.pId, rId: resources[rIdx].id, newCount: allocationMatrix[pendingRequest.pIdx][rIdx] + reqAmt }});
                      }
                  });
                  setReqVector(resources.map(() => 0));
                  setPendingRequest(null);
              }
          } else {
              playAlarm();
              if (pendingRequest) {
                  dispatch({ type: 'ADD_LOG', payload: { msg: `> DENIED: Request by ${pendingRequest.pId} would cause an UNSAFE state. Request dropped.`, type: 'error' } });
                  setPendingRequest(null);
              }
          }
      }
  };

  const handleNextStep = () => {
      if (animSteps && currentStepIndex < animSteps.length - 1) {
          const nextIdx = currentStepIndex + 1;
          applyStep(animSteps[nextIdx]);
          setCurrentStepIndex(nextIdx);
      } else {
          setIsPlaying(false);
      }
  };

  const handlePrevStep = () => {
      if (animSteps && currentStepIndex > 0) {
          setIsPlaying(false);
          const prevIdx = currentStepIndex - 1;
          applyStep(animSteps[prevIdx]);
          setCurrentStepIndex(prevIdx);
      }
  };

  // Auto-Play Effect
  useEffect(() => {
      if (isPlaying) {
          playRef.current = setInterval(() => {
              if (animSteps && currentStepIndex < animSteps.length - 1) {
                  handleNextStep();
              } else {
                  setIsPlaying(false);
              }
          }, 800); // Speed of auto-play
      } else {
          clearInterval(playRef.current);
      }
      return () => clearInterval(playRef.current);
  }, [isPlaying, currentStepIndex, animSteps]);

  const togglePlay = () => {
      if (!animSteps || currentStepIndex >= animSteps.length - 1) return;
      setIsPlaying(!isPlaying);
  };

  const handleResourceRequest = () => {
      setIsPlaying(false);
      if (!reqProcess) {
         dispatch({ type: 'ADD_LOG', payload: { msg: `> ERR: Select a process to make a request.`, type: 'error' } });
         playAlarm();
         setLiveExplanation('ERROR: Select a process to make a request.');
         setAnimSteps([]); // ensure it's not null to show the explanation
         document.getElementById('bankers-visualizer')?.scrollIntoView({ behavior: 'smooth' });
         return;
      }
      const pIdx = processes.findIndex(p => p.id === reqProcess);
      
      for (let i = 0; i < resources.length; i++) {
         if (reqVector[i] > needMatrix[pIdx][i]) {
            dispatch({ type: 'ADD_LOG', payload: { msg: `> REJECTED: ${reqProcess} requested more than its maximum claim.`, type: 'error' } });
            playAlarm();
            setLiveExplanation(`REJECTED: ${reqProcess} requested more than its Need [${needMatrix[pIdx].join(', ')}].`);
            setAnimSteps([]);
            document.getElementById('bankers-visualizer')?.scrollIntoView({ behavior: 'smooth' });
            return;
         }
      }
      
      for (let i = 0; i < resources.length; i++) {
         if (reqVector[i] > availableVector[i]) {
            dispatch({ type: 'ADD_LOG', payload: { msg: `> WAIT: ${reqProcess} must wait. Resources not available.`, type: 'warning' } });
            playAlarm();
            setLiveExplanation(`WAIT: ${reqProcess} must wait. Request [${reqVector.join(', ')}] exceeds Available [${availableVector.join(', ')}].`);
            setAnimSteps([]);
            document.getElementById('bankers-visualizer')?.scrollIntoView({ behavior: 'smooth' });
            return;
         }
      }

      // Step 3: Pretend Allocation & Simulate
      const simAvailable = [...availableVector];
      const simAllocation = allocationMatrix.map(row => [...row]);
      const simNeed = needMatrix.map(row => [...row]);

      for (let i = 0; i < resources.length; i++) {
         simAvailable[i] -= reqVector[i];
         simAllocation[pIdx][i] += reqVector[i];
         simNeed[pIdx][i] -= reqVector[i];
      }

      dispatch({ type: 'ADD_LOG', payload: { msg: `> Evaluating request from ${reqProcess} visually...`, type: 'info' } });
      
      setPendingRequest({ pId: reqProcess, pIdx: pIdx, req: [...reqVector] });
      
      const result = generateSafetySteps(simAvailable, simAllocation, simNeed);
      setAnimSteps(result.steps);
      setCurrentStepIndex(0);
      setLiveWork([...simAvailable]);
      setLiveFinish(new Array(processes.length).fill(false));
      setLiveExplanation(`Simulating Request: ${reqProcess} -> [${reqVector.join(', ')}]. Init Work = [${simAvailable.join(', ')}]`);
      
      // Scroll to visualizer
      document.getElementById('bankers-visualizer')?.scrollIntoView({ behavior: 'smooth' });
      
      // Auto-start the simulation for dramatic effect
      setIsPlaying(true);
  };

  return (
    <div className="w-full flex flex-col gap-10 py-10 px-6 md:px-12 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="text-center shrink-0">
         <div className="inline-flex p-3 bg-blue-900/50 border border-blue-800 rounded-2xl mb-4">
            <Landmark size={32} className="text-blue-400"/>
         </div>
         <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Banker's Algorithm</h1>
         <p className="text-slate-400 font-medium mt-2 max-w-xl mx-auto text-lg">
            Resource Allocation & Deadlock Avoidance Simulator
         </p>
      </div>

      {/* SYSTEM DATA MATRICES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col">
         <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 text-lg">
               <Grid size={20} className="text-blue-400"/> System Matrices
            </h3>
            <div className="flex gap-3">
               <button onClick={() => dispatch({ type: 'ADD_PROCESS' })} className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors font-bold border border-slate-700 hover:border-slate-600">
                  <Plus size={16}/> Add Process
               </button>
               <button onClick={() => dispatch({ type: 'ADD_RESOURCE', payload: { instances: 1 } })} className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition-colors font-bold border border-slate-700 hover:border-slate-600">
                  <Plus size={16}/> Add Resource
               </button>
            </div>
         </div>
         
         <div className="p-8 overflow-x-auto bg-slate-900">
            {processes.length === 0 ? (
               <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                  <p className="text-slate-500 font-bold text-lg mb-2">System is Empty</p>
                  <p className="text-slate-600">Add processes and resources to begin.</p>
               </div>
            ) : (
               <table className="w-full text-center border-collapse text-lg">
                  <thead>
                     <tr>
                        <th className="p-4 border-b-2 border-slate-800 text-slate-400 font-bold text-sm uppercase tracking-wider text-left w-32">Process</th>
                        <th className="p-4 border-b-2 border-slate-800 text-slate-200 font-bold">Allocation<br/><span className="text-xs font-normal text-slate-500 tracking-widest">{resources.map(r=>r.id).join('  ')}</span></th>
                        <th className="p-4 border-b-2 border-slate-800 text-slate-200 font-bold">Max Claim<br/><span className="text-xs font-normal text-slate-500 tracking-widest">{resources.map(r=>r.id).join('  ')}</span></th>
                        <th className="p-4 border-b-2 border-slate-800 text-slate-200 font-bold">Need<br/><span className="text-xs font-normal text-slate-500 tracking-widest">{resources.map(r=>r.id).join('  ')}</span></th>
                        <th className="p-4 border-b-2 border-slate-800 text-slate-200 font-bold">Available<br/><span className="text-xs font-normal text-slate-500 tracking-widest">{resources.map(r=>r.id).join('  ')}</span></th>
                        <th className="p-4 border-b-2 border-slate-800"></th>
                     </tr>
                  </thead>
                  <tbody className="font-mono">
                     {processes.map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50">
                           <td className="p-4 font-bold text-slate-200 text-left text-2xl">{p.id}</td>
                           <td className="p-4">
                              <div className="flex justify-center gap-3">
                                 {resources.map((r, j) => (
                                    <input 
                                       key={`alloc-${r.id}`} type="number" min="0" max="20" 
                                       className="w-14 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-center py-2 text-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                       value={allocationMatrix[i]?.[j] || 0}
                                       onChange={(e) => dispatch({ type: 'SET_ALLOCATION', payload: { pId: p.id, rId: r.id, newCount: Number(e.target.value) }})}
                                    />
                                 ))}
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex justify-center gap-3">
                                 {resources.map((r, j) => (
                                    <input 
                                       key={`max-${r.id}`} type="number" min="0" max="20" 
                                       className="w-14 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-center py-2 text-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                       value={maxMatrix[i]?.[j] || 0}
                                       onChange={(e) => dispatch({ type: 'UPDATE_MAX_CLAIM', payload: { processId: p.id, resourceId: r.id, value: Number(e.target.value) }})}
                                    />
                                 ))}
                              </div>
                           </td>
                           <td className="p-4 font-bold text-orange-400 bg-orange-900/10">
                              <div className="flex justify-center gap-5">
                                  {needMatrix[i]?.map((n, idx) => <span key={idx} className="w-6">{n}</span>) || '0'}
                              </div>
                           </td>
                           <td className="p-4 font-bold text-emerald-400 bg-emerald-900/10">
                              {i === 0 && (
                                  <div className="flex justify-center gap-3">
                                     {availableVector.map((v, idx) => (
                                        <input
                                           key={`avail-${resources[idx].id}`} type="number" min="0" max="50"
                                           className="w-14 bg-emerald-950/50 border border-emerald-800/50 rounded-lg text-emerald-400 text-center py-2 text-lg hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                           value={v}
                                           onChange={(e) => {
                                              const newAvailable = Math.max(0, Number(e.target.value));
                                              const currentAllocated = allocationMatrix.reduce((sum, pAlloc) => sum + pAlloc[idx], 0);
                                              dispatch({ 
                                                 type: 'UPDATE_RESOURCE', 
                                                 payload: { id: resources[idx].id, instances: newAvailable + currentAllocated } 
                                              });
                                           }}
                                        />
                                     ))}
                                  </div>
                              )}
                           </td>
                           <td className="p-4">
                              <button onClick={() => dispatch({ type: 'REMOVE_PROCESS', payload: p.id })} className="text-slate-500 hover:text-red-400 transition-colors bg-slate-950 hover:bg-red-900/20 p-2 rounded-lg border border-slate-800 hover:border-red-800/50">
                                 <Trash2 size={20}/>
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>
      </div>

      {/* RESOURCE REQUEST CONSOLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg p-8 flex flex-col xl:flex-row items-center gap-8">
         <div className="flex items-center gap-4 shrink-0">
            <div className="p-4 rounded-full bg-blue-900/30 border border-blue-800 text-blue-400">
               <ShieldQuestion size={32} />
            </div>
            <div>
               <h3 className="text-xl font-bold text-slate-100">Custom Request</h3>
               <p className="text-slate-400 text-sm mt-1">Test an arbitrary allocation request visually.</p>
            </div>
         </div>

         <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 w-full">
            <div className="w-full sm:w-48">
               <select className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 transition-colors text-lg font-bold" value={reqProcess} onChange={e => setReqProcess(e.target.value)}>
                  <option value="">Select Process</option>
                  {processes.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
               </select>
            </div>

            <div className="flex-1 flex justify-center gap-6 bg-slate-950/50 border border-slate-800 p-3 rounded-xl w-full">
               {resources.map((r, i) => (
                  <div key={r.id} className="flex flex-col items-center gap-2">
                     <span className="text-xs font-bold text-slate-500 tracking-widest">{r.id}</span>
                     <input 
                        type="number" min="0" max="20"
                        className="w-16 h-12 bg-slate-950 border border-slate-700 rounded-lg text-center text-slate-200 focus:outline-none focus:border-blue-500 transition-colors text-xl font-bold"
                        value={reqVector[i] || 0}
                        onChange={(e) => {
                           const newVec = [...reqVector];
                           newVec[i] = Number(e.target.value);
                           setReqVector(newVec);
                        }}
                     />
                  </div>
               ))}
            </div>

            <button onClick={handleResourceRequest} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap text-lg uppercase tracking-wider flex items-center justify-center gap-2">
               Test Request <Play size={20}/>
            </button>
         </div>
      </div>

      {/* VISUAL EXECUTION STAGE */}
      <div id="bankers-visualizer" className="bg-slate-950 border-2 border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden min-h-[600px] mb-20">
         
         {/* Top Control Bar */}
         <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <h3 className="font-bold text-slate-100 uppercase tracking-widest text-lg flex items-center gap-3">
               <Activity className="text-emerald-400"/> Visual Execution Stage
            </h3>
            
            <div className="flex gap-4">
               <button onClick={initSimulation} disabled={processes.length === 0} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2">
                  <RotateCcw size={18}/> Initialize Full Safety Run
               </button>
               
               <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button onClick={handlePrevStep} disabled={currentStepIndex <= 0 || isPlaying} className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors">
                     <StepBack size={20}/>
                  </button>
                  <button onClick={togglePlay} disabled={!animSteps || currentStepIndex >= animSteps.length - 1} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-30">
                     {isPlaying ? <><Pause size={20}/> PAUSE</> : <><Play size={20}/> PLAY</>}
                  </button>
                  <button onClick={handleNextStep} disabled={!animSteps || currentStepIndex >= animSteps.length - 1 || isPlaying} className="p-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors">
                     <StepForward size={20}/>
                  </button>
               </div>
            </div>
         </div>

         {/* Trace Display Screen */}
         <div className="bg-slate-950 p-8 flex flex-col items-center border-b border-slate-800 relative min-h-[140px] justify-center">
             {!animSteps ? (
                <div className="text-slate-600 font-mono text-xl text-center">SYSTEM IDLE. Awaiting execution command.</div>
             ) : (
                <motion.div key={currentStepIndex} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="text-center w-full max-w-4xl">
                   {pendingRequest && <div className="text-orange-400 font-bold tracking-widest text-sm mb-3 uppercase">Simulating Sandbox Request</div>}
                   <h2 className={`text-2xl md:text-3xl font-mono leading-relaxed font-bold ${liveExplanation.includes('ERROR') || liveExplanation.includes('REJECTED') ? 'text-red-400' : liveExplanation.includes('WAIT') ? 'text-yellow-400' : 'text-blue-300'}`}>
                      {liveExplanation}
                   </h2>
                </motion.div>
             )}

             {/* Progress Bar */}
             {animSteps && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900">
                   <div 
                      className="h-full bg-blue-500 transition-all duration-300" 
                      style={{ width: `${(currentStepIndex / (animSteps.length - 1)) * 100}%` }}
                   />
                </div>
             )}
         </div>

         {/* Main Visualizer Area */}
         <div className="p-10 flex-1 bg-slate-950 flex flex-col xl:flex-row gap-12 relative">
             
             {/* Process Evaluation Stack */}
             <div className="flex-1 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2">System Processes</h3>
                {processes.map((p, i) => {
                   const isChecking = liveProcess === i;
                   const isFinished = liveFinish[i];
                   
                   return (
                      <motion.div key={p.id} layout className={`p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between ${
                         isFinished ? 'bg-emerald-900/10 border-emerald-800/50 text-emerald-400' : 
                         isChecking ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)] text-blue-300 scale-[1.02] z-10' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                      }`}>
                         <div className="flex items-center gap-10">
                            <div className="font-bold font-mono text-3xl w-12 text-center">{p.id}</div>
                            
                            <div className="flex gap-12">
                               <div>
                                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">Allocated</span>
                                  <div className="font-mono text-xl bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">[{allocationMatrix[i]?.join(', ')}]</div>
                               </div>
                               <div>
                                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">Need</span>
                                  <div className="font-mono text-xl bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">[{needMatrix[i]?.join(', ')}]</div>
                               </div>
                            </div>
                         </div>
                         <div className="font-bold text-sm tracking-widest uppercase">
                             {isFinished ? <span className="flex items-center gap-3 text-emerald-500 bg-emerald-950/50 px-4 py-2 rounded-lg"><CheckCircle2 size={20}/> FINISHED</span> : 
                              isChecking ? <span className="flex items-center gap-3 text-blue-400 bg-blue-950/50 px-4 py-2 rounded-lg"><Activity size={20} className="animate-spin-slow"/> EVALUATING</span> : 
                              <span className="text-slate-600 bg-slate-900 px-4 py-2 rounded-lg">WAITING</span>}
                         </div>
                      </motion.div>
                   )
                })}
             </div>

             {/* Dynamic Work Vector */}
             <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-4">
                 <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2">Current Work Vector</h3>
                 <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 sticky top-8 shadow-2xl">
                    
                    <div className="flex justify-center gap-6 font-mono text-4xl font-black text-emerald-400">
                       {resources.map((res, i) => (
                          <div key={res.id} className="flex flex-col items-center gap-4">
                             <span className="text-sm text-slate-500 tracking-widest">{res.id}</span>
                             <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
                                animSteps ? 'bg-emerald-950/50 border-emerald-800/50 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : 'bg-slate-950 border-slate-800 text-slate-700'
                             }`}>
                                 {animSteps ? (liveWork[i] || 0) : (availableVector[i] || 0)}
                             </div>
                          </div>
                       ))}
                    </div>

                    <div className="mt-10 p-6 bg-slate-950 rounded-xl border border-slate-800">
                       <p className="text-slate-400 text-sm leading-relaxed text-center">
                          The <strong className="text-slate-200">Work Vector</strong> represents the currently available resources in the simulated timeline. As processes are marked "Safe", they release their allocation back into this vector.
                       </p>
                    </div>

                 </div>
             </div>

         </div>
      </div>

    </div>
  );
}
