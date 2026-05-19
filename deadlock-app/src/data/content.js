export const RAG_EXAMPLES = {
  fig73: {
    title: "Figure 7.3 — Resource Allocation Graph with a Deadlock",
    description: "A cycle exists: P1 → R1 → P2 → R3 → P3 → R2 → P1. Since R1 and R3 have only one instance, and R2's two instances are held by processes in the cycle, deadlock is present.",
    nodes: [
      { id: 'P1', type: 'process', label: 'P1' },
      { id: 'P2', type: 'process', label: 'P2' },
      { id: 'P3', type: 'process', label: 'P3' },
      { id: 'R1', type: 'resource', instances: 1, label: 'R1' },
      { id: 'R2', type: 'resource', instances: 2, label: 'R2' },
      { id: 'R3', type: 'resource', instances: 1, label: 'R3' },
      { id: 'R4', type: 'resource', instances: 3, label: 'R4' }
    ],
    edges: [
      { source: 'P1', target: 'R1', type: 'request' },
      { source: 'P2', target: 'R3', type: 'request' },
      { source: 'P3', target: 'R2', type: 'request' },
      { source: 'R1', target: 'P2', type: 'assignment' },
      { source: 'R2', target: 'P1', type: 'assignment' },
      { source: 'R2', target: 'P2', type: 'assignment' },
      { source: 'R3', target: 'P3', type: 'assignment' }
    ]
  },
  fig74: {
    title: "Figure 7.4 — Resource Allocation Graph with a Cycle but No Deadlock",
    description: "A cycle exists: P1 → R1 → P3 → R2 → P1. However, P4 may release its instance of R2, breaking the cycle. Thus, there is no deadlock.",
    nodes: [
      { id: 'P1', type: 'process', label: 'P1' },
      { id: 'P2', type: 'process', label: 'P2' },
      { id: 'P3', type: 'process', label: 'P3' },
      { id: 'P4', type: 'process', label: 'P4' },
      { id: 'R1', type: 'resource', instances: 2, label: 'R1' },
      { id: 'R2', type: 'resource', instances: 2, label: 'R2' }
    ],
    edges: [
      { source: 'P1', target: 'R1', type: 'request' },
      { source: 'P3', target: 'R2', type: 'request' },
      { source: 'R1', target: 'P2', type: 'assignment' },
      { source: 'R1', target: 'P3', type: 'assignment' },
      { source: 'R2', target: 'P1', type: 'assignment' },
      { source: 'R2', target: 'P4', type: 'assignment' }
    ]
  }
};

export const BANKERS_EXAMPLE = {
  resourceNames: ['A', 'B', 'C'],
  totalResources: [10, 5, 7],
  processes: [
    { id: 'P0', max: [7, 5, 3], allocation: [0, 1, 0] },
    { id: 'P1', max: [3, 2, 2], allocation: [2, 0, 0] },
    { id: 'P2', max: [9, 0, 2], allocation: [3, 0, 2] },
    { id: 'P3', max: [2, 2, 2], allocation: [2, 1, 1] },
    { id: 'P4', max: [4, 3, 3], allocation: [0, 0, 2] }
  ]
};

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Which of the following is NOT one of the four necessary conditions for deadlock?",
    options: [
      "Mutual Exclusion",
      "Hold and Wait",
      "No Preemption",
      "Circular Wait",
      "Starvation"
    ],
    correctAnswer: 4,
    explanation: "Starvation is when a process waits indefinitely, but it's not a required condition for deadlock. Deadlock requires Mutual Exclusion, Hold & Wait, No Preemption, and Circular Wait simultaneously."
  },
  {
    id: 2,
    question: "In a Resource Allocation Graph, a cycle implies a deadlock if...",
    options: [
      "There is only one instance of each resource type.",
      "There are multiple instances of each resource type.",
      "A process is waiting for an I/O event.",
      "The Banker's Algorithm fails."
    ],
    correctAnswer: 0,
    explanation: "If each resource type has exactly one instance, then a cycle implies that a deadlock has occurred. If there are multiple instances, a cycle is necessary but not sufficient for deadlock."
  },
  {
    id: 3,
    question: "What is a 'Safe State' in the context of the Banker's Algorithm?",
    options: [
      "A state where no processes are running.",
      "A state where all processes have finished.",
      "A state where there exists a sequence of processes that can all finish successfully.",
      "A state where processes can hold resources indefinitely."
    ],
    correctAnswer: 2,
    explanation: "A safe state means the system can allocate resources to each process (up to its maximum) in some order and still avoid deadlock."
  },
  {
    id: 4,
    question: "Deadlock prevention differs from deadlock avoidance by...",
    options: [
      "Denying at least one of the four necessary conditions structurally.",
      "Using Banker's algorithm to check safety on every request.",
      "Detecting cycles in a RAG and killing a process.",
      "Rolling back processes to a checkpoint."
    ],
    correctAnswer: 0,
    explanation: "Prevention structurally guarantees deadlock cannot happen by negating a necessary condition (e.g., ordering resources). Avoidance (like Banker's) dynamically checks requests to ensure the system stays safe."
  },
  {
    id: 5,
    question: "Which recovery method might cause 'starvation' if the same victim is always chosen?",
    options: [
      "Process Termination",
      "Resource Preemption",
      "Ignoring the Deadlock",
      "System Reboot"
    ],
    correctAnswer: 1,
    explanation: "In resource preemption, if we always pick the same process as a victim to preempt resources from, it may never complete, resulting in starvation."
  }
];
