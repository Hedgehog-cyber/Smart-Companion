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
  granularity_level: 'Normal' | 'High';
  specific_triggers: string;
  preferred_support: string;
}
