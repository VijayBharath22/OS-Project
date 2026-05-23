import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import useSimulationStore from '../store/useSimulationStore';

export default function Quiz() {
  const injectState = useSimulationStore(s => s.injectState);
  const addLog = useSimulationStore(s => s.addLog);
  const [activeScenario, setActiveScenario] = useState(null);
  const [activeTab, setActiveTab] = useState('practice');
  const [answers, setAnswers] = useState({});

  const scenarios = [
    { id: 1, title: "The Dining Philosophers (Simplified)", difficulty: "Beginner", goal: "Create a circular wait deadlock using exactly 3 processes and 3 single-instance resources.", instructions: ["Navigate to the RAG Builder.", "Add 3 Processes and 3 Resources.", "Create assignment edges so each process holds exactly 1 resource.", "Create request edges so each process requests the resource held by its neighbor.", "Verify the Topology Analyzer detects a Fatal Single-Instance Cycle."], setup: { resources: [{id:'R1', instances:1},{id:'R2', instances:1},{id:'R3', instances:1}], processes: [{id:'P1', max:{R1:0,R2:0,R3:0}},{id:'P2', max:{R1:0,R2:0,R3:0}},{id:'P3', max:{R1:0,R2:0,R3:0}}], edges: [] } },
    { id: 2, title: "Banker's Dilemma", difficulty: "Intermediate", goal: "Find the hidden safe sequence in a highly constrained system.", instructions: ["Click 'Load Environment' below to inject the scenario.", "Navigate to the Banker's Algorithm module.", "Run the Safety Algorithm Simulator step-by-step.", "Observe which process is forced to wait, and which process successfully executes first."], setup: { resources: [{id:'R1', instances:5}, {id:'R2', instances:3}], processes: [{id:'P1', max:{R1:4, R2:2}},{id:'P2', max:{R1:2, R2:1}},{id:'P3', max:{R1:3, R2:2}}], edges: [{source:'R1', target:'P1', type:'assignment'},{source:'R1', target:'P2', type:'assignment'},{source:'R1', target:'P2', type:'assignment'},{source:'R2', target:'P3', type:'assignment'}] } },
    { id: 3, title: "Minimum Cost Recovery", difficulty: "Advanced", goal: "Break a complex deadlock by preempting resources instead of terminating processes.", instructions: ["Click 'Load Environment' to inject a deadlocked state.", "Navigate to the Recovery Console.", "Do NOT use Process Termination.", "Use the Resource Preemption tab to seize the minimum number of resources required to break the cycle."], setup: { resources: [{id:'R1', instances:1}, {id:'R2', instances:1}, {id:'R3', instances:1}], processes: [{id:'P1', max:{R1:0,R2:0,R3:0}}, {id:'P2', max:{R1:0,R2:0,R3:0}}, {id:'P3', max:{R1:0,R2:0,R3:0}}], edges: [{source:'P1', target:'R1', type:'request'},{source:'R1', target:'P2', type:'assignment'},{source:'P2', target:'R2', type:'request'},{source:'R2', target:'P3', type:'assignment'},{source:'P3', target:'R3', type:'request'},{source:'R3', target:'P1', type:'assignment'}] } }
  ];

  const quizQuestions = [
    { id: 1, question: "A system has 3 processes (P1, P2, P3) and 12 instances of a single resource type. The max claims are P1=4, P2=5, P3=8. The current allocation is P1=2, P2=3, P3=4. What is the current state?", options: [{ text: "Safe state", isCorrect: true }, { text: "Unsafe state but not deadlocked", isCorrect: false }, { text: "Deadlocked", isCorrect: false }, { text: "Invalid state", isCorrect: false }], explanation: "Total allocated is 9. Available is 3. P1's need is 2. Since 3 >= 2, P1 can finish (Available becomes 5). P2's need is 2, so it finishes (Available becomes 8). P3's need is 4, so it finishes. A safe sequence exists." },
    { id: 2, question: "Process A holds Printer 1 and requests Scanner 1. Process B holds Scanner 1 and requests Printer 1. To prevent this using 'No Hold and Wait', what must the OS enforce?", options: [{ text: "Scanner 1 must be forcibly taken from Process B.", isCorrect: false }, { text: "Processes must request all required resources at once before execution begins.", isCorrect: true }, { text: "Resources must be requested in a strictly increasing numerical order.", isCorrect: false }, { text: "Only one process can use the printer at a time.", isCorrect: false }], explanation: "No Hold and Wait dictates that a process cannot request a new resource while holding another." },
    { id: 3, question: "In a RAG, there is a cycle: P1 → R1 → P2 → R2 → P1. R1 has 2 instances (one held by P2, one by P3). R2 has 1 instance (held by P1). Is the system deadlocked?", options: [{ text: "Yes, a cycle always implies deadlock.", isCorrect: false }, { text: "Yes, because R2 is single-instance.", isCorrect: false }, { text: "No, because R1 has multiple instances and P3 is not in the cycle.", isCorrect: true }, { text: "No, cycles only imply deadlock if all resources are single-instance.", isCorrect: false }], explanation: "A cycle is only sufficient for deadlock if ALL resources have single instances. Since R1 has 2 and P3 holds one, P3 could finish, releasing R1." },
    { id: 4, question: "A deadlock is detected between P1 (High priority, holding R1,R2), P2 (Low priority, holding R3), P3 (Medium, holding R4). Minimum cost victim?", options: [{ text: "P1, most resources held.", isCorrect: false }, { text: "P2, lowest priority.", isCorrect: true }, { text: "P3, middle of cycle.", isCorrect: false }, { text: "All must be rolled back.", isCorrect: false }], explanation: "Minimize cost by victimizing processes with lower priority, fewer resources, or less execution time." },
    { id: 5, question: "Which best describes Deadlock Avoidance (Banker's) rather than Prevention?", options: [{ text: "OS requires resources in alphabetical order.", isCorrect: false }, { text: "OS simulates allocation and checks for safe sequence before granting.", isCorrect: true }, { text: "OS periodically scans for cycles and terminates processes.", isCorrect: false }, { text: "OS forces process to release resources if request denied.", isCorrect: false }], explanation: "Avoidance evaluates requests dynamically. Prevention uses structural rules. Detection/Recovery scans periodically." }
  ];

  const handleAnswer = (qId, oIdx) => setAnswers({ ...answers, [qId]: oIdx });

  const loadScenario = (scenario) => {
    injectState(scenario.setup);
    addLog(`> Injected Quiz Scenario: ${scenario.title}`);
    setActiveScenario(scenario.id);
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(([qId, oIdx]) => quizQuestions.find(q => q.id === Number(qId))?.options[oIdx]?.isCorrect).length;

  return (
    <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto py-8">
      <div className="text-center mb-8 shrink-0">
        <div className="inline-flex p-3 bg-blue-900/50 border border-blue-800 rounded-2xl mb-4"><HelpCircle size={32} className="text-blue-400"/></div>
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Interactive Learning & Quiz</h1>
        <p className="text-slate-400 font-medium mt-2 max-w-xl mx-auto">Test your understanding of OS concepts. Solve hands-on lab scenarios or take the knowledge check.</p>
      </div>

      <div className="flex justify-center gap-4 mb-8 shrink-0">
        <button onClick={() => setActiveTab('practice')} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'practice' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}>Interactive Practice</button>
        <button onClick={() => setActiveTab('mcq')} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'mcq' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}>Knowledge Check ({correctCount}/{quizQuestions.length})</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{scenario.title}</h3>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-bold uppercase tracking-wider rounded ${scenario.difficulty === 'Beginner' ? 'bg-emerald-900/30 text-emerald-400' : scenario.difficulty === 'Intermediate' ? 'bg-orange-900/30 text-orange-400' : 'bg-red-900/30 text-red-400'}`}>{scenario.difficulty}</span>
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg mb-6"><strong className="text-slate-300 block mb-2 font-bold">Goal:</strong><p className="text-slate-400">{scenario.goal}</p></div>
                <div className="space-y-3 mb-6">
                  <strong className="text-slate-300 block text-sm uppercase tracking-wider font-bold">Instructions:</strong>
                  {scenario.instructions.map((inst, i) => (<div key={i} className="flex gap-3 text-slate-400 text-sm"><span className="shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">{i+1}</span><span className="pt-0.5">{inst}</span></div>))}
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <button onClick={() => loadScenario(scenario)} className={`border transition-colors font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 ${activeScenario === scenario.id ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-blue-900/30 border-blue-800/50 hover:bg-blue-600 hover:text-white text-blue-400'}`}>
                    {activeScenario === scenario.id ? <CheckCircle2 size={16}/> : <Play size={16}/>}
                    {activeScenario === scenario.id ? 'Scenario Active' : 'Inject Scenario'}
                  </button>
                  {activeScenario === scenario.id && <span className="text-emerald-500 text-sm font-bold animate-pulse">Environment Loaded!</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'mcq' && (
          <div className="space-y-6 pb-8">
            {quizQuestions.map((q) => {
              const selectedIdx = answers[q.id];
              const isAnswered = selectedIdx !== undefined;
              const isCorrect = isAnswered && q.options[selectedIdx].isCorrect;
              return (
                <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-200 mb-6 flex gap-3"><span className="text-blue-500 shrink-0">Q{q.id}.</span><span className="leading-relaxed">{q.question}</span></h3>
                  <div className="space-y-3">
                    {q.options.map((opt, idx) => {
                      let btnClass = "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-600";
                      if (isAnswered) {
                        if (opt.isCorrect) btnClass = "bg-emerald-900/30 border-emerald-500/50 text-emerald-400 font-bold";
                        else if (selectedIdx === idx) btnClass = "bg-red-900/30 border-red-500/50 text-red-400 font-bold";
                        else btnClass = "bg-slate-950 border-slate-800 text-slate-500 opacity-50";
                      }
                      return (<button key={idx} disabled={isAnswered} onClick={() => handleAnswer(q.id, idx)} className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between ${btnClass}`}><span>{opt.text}</span>{isAnswered && opt.isCorrect && <CheckCircle2 size={20} className="text-emerald-500"/>}</button>);
                    })}
                  </div>
                  {isAnswered && (
                    <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-6 p-4 rounded-lg bg-blue-900/20 border border-blue-800/50">
                      <strong className={`block mb-1 text-sm uppercase tracking-wider ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>{isCorrect ? 'Correct!' : 'Incorrect'}</strong>
                      <p className="text-slate-300 text-sm leading-relaxed">{q.explanation}</p>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
