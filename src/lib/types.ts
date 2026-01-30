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
  id: string;
  mainTask: string;
  steps: Step[];
  createdAt: number;
}
