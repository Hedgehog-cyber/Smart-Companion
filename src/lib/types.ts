export interface SubStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Step {
  id: string;
  text: string;
  completed: boolean;
  subSteps: SubStep[];
}

export interface Task {
  id: 'current_task';
  mainTask: string;
  steps: Step[];
  createdAt: number;
}
