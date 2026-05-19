export function calculateNeed(allocation, max) {
  return max.map((process, i) =>
    process.map((res, j) => Math.max(0, res - allocation[i][j]))
  );
}

export function checkSafeState(available, allocation, need) {
  const numProcesses = allocation.length;
  const numResources = available.length;
  
  let work = [...available];
  let finish = new Array(numProcesses).fill(false);
  
  const safeSequence = [];
  const steps = []; 
  
  let count = 0;
  let madeProgress = true;
  
  while (count < numProcesses && madeProgress) {
    madeProgress = false;
    for (let i = 0; i < numProcesses; i++) {
      steps.push({
        type: 'CHECK_PROCESS',
        processIndex: i,
        work: [...work],
        finish: [...finish],
        need: [...need[i]]
      });
      
      if (!finish[i]) {
        let canAllocate = true;
        for (let j = 0; j < numResources; j++) {
          if (need[i][j] > work[j]) {
            canAllocate = false;
            break;
          }
        }
        
        if (canAllocate) {
          steps.push({
            type: 'PROCESS_CAN_FINISH',
            processIndex: i,
            work: [...work],
            finish: [...finish]
          });
          
          for (let j = 0; j < numResources; j++) {
            work[j] += allocation[i][j];
          }
          finish[i] = true;
          safeSequence.push(i);
          count++;
          madeProgress = true;
          
          steps.push({
            type: 'PROCESS_FINISHED',
            processIndex: i,
            work: [...work],
            finish: [...finish]
          });
        } else {
          steps.push({
            type: 'PROCESS_CANNOT_FINISH',
            processIndex: i,
            work: [...work],
            finish: [...finish]
          });
        }
      } else {
        steps.push({
            type: 'PROCESS_ALREADY_FINISHED',
            processIndex: i,
            work: [...work],
            finish: [...finish]
        });
      }
    }
  }
  
  return {
    isSafe: count === numProcesses,
    safeSequence,
    steps
  };
}

export function handleRequest(request, processIndex, available, allocation, need) {
  const numResources = available.length;
  
  // 1. Check if request <= need
  for (let j = 0; j < numResources; j++) {
    if (request[j] > need[processIndex][j]) {
      return { success: false, error: "Request exceeds maximum claim." };
    }
  }
  
  // 2. Check if request <= available
  for (let j = 0; j < numResources; j++) {
    if (request[j] > available[j]) {
      return { success: false, error: "Resources not available. Process must wait." };
    }
  }
  
  // 3. Pretend to allocate
  const newAvailable = [...available];
  const newAllocation = allocation.map(row => [...row]);
  const newNeed = need.map(row => [...row]);
  
  for (let j = 0; j < numResources; j++) {
    newAvailable[j] -= request[j];
    newAllocation[processIndex][j] += request[j];
    newNeed[processIndex][j] -= request[j];
  }
  
  // 4. Check safety
  const safetyCheck = checkSafeState(newAvailable, newAllocation, newNeed);
  
  if (safetyCheck.isSafe) {
    return {
      success: true,
      newAvailable,
      newAllocation,
      newNeed,
      safetyCheck
    };
  } else {
    return {
      success: false,
      error: "State is unsafe. Request denied.",
      safetyCheck
    };
  }
}
