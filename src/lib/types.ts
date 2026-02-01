export interface SubStep {
  id: string;
  text: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface Step {
  id: string;
  text: string;
  estimatedMinutes?: number;
  completed: boolean;
  subSteps: SubStep[];
}

export interface Task {
  id:string;
  mainTask: string;
  steps: Step[];
  createdAt: number;
}

export interface UserProfile {
  task_granularity: string;
  sensory_triggers: string;
  support_requirements: string;
}
