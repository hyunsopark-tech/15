export type WorkflowType = "recall" | "treatment" | "claims";

export type Priority = "critical" | "high" | "medium" | "low";

export type TaskStatus =
  | "new"
  | "in-progress"
  | "attempted"
  | "scheduled"
  | "resolved"
  | "escalated";

export interface Patient {
  id: string;
  patientName: string;
  guardianName: string;
  phone: string;
  insurance: string;
  dob: string;
  lastVisit: string;
  provider: string;
  assignedStaff: string;
  priority: Priority;
  status: TaskStatus;
  daysOverdue: number;
  estimatedValue: number;
  attemptCount: number;
  nextStep: string;
  notes: string;
  workflow: WorkflowType;
  // Recall-specific
  recallType?: string;
  // Treatment-specific
  treatmentPlan?: string;
  insuranceEstimate?: number;
  preAuthStatus?: string;
  // Claims-specific
  claimNumber?: string;
  claimDate?: string;
  payerName?: string;
  denialReason?: string;
  claimAmount?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  steps?: string[];   // sub-steps shown as bullets under the label
  script?: string;    // voicemail / phone script shown expandable
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  assignedTasks: number;
  completedToday: number;
  pending: number;
  overdue: number;
  revenueRecovered: number;
  dailyScore: number;
}

export interface DailyMetrics {
  callsMade: number;
  callsGoal: number;
  textsSent: number;
  textsGoal: number;
  appointmentsScheduled: number;
  appointmentsGoal: number;
  claimsResolved: number;
  claimsGoal: number;
  treatmentScheduled: number;
  treatmentGoal: number;
  revenueRecovered: number;
  revenueGoal: number;
}

export interface SOPDocument {
  id: string;
  title: string;
  description: string;
  workflow: WorkflowType | "all";
  attached: boolean;
  lastUpdated?: string;
  fileSize?: string;
}

export interface AIAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  workflow: WorkflowType | "all";
}
