export interface StaffRow { id: string; name: string; role: string; color: string; initials: string; position: number; }
export interface PatientRow { id: string; workflow: string; data: string; } // data = JSON string
export interface ActivityRow { id: string; staff_id: string; date: string; type: string; description: string; time_label: string; }
export interface BlockRow { id: string; title: string; body: string; position: number; }
export interface QARow { id: string; data: string; } // data = JSON string
export interface OverrideRow { qa_id: string; answer: string; }

export interface DbInterface {
  // Staff
  getAllStaff(): Promise<StaffRow[]>;
  upsertStaff(s: StaffRow): Promise<void>;
  deleteStaff(id: string): Promise<void>;
  // Patients
  getPatients(workflow?: string): Promise<PatientRow[]>;
  replacePatients(workflow: string, rows: PatientRow[]): Promise<void>;
  // Activity
  getAllActivity(): Promise<ActivityRow[]>;
  insertActivity(row: ActivityRow): Promise<void>;
  deleteActivity(id: string): Promise<void>;
  // Completed
  getCompleted(): Promise<string[]>;
  markComplete(patientId: string): Promise<void>;
  // SOP
  getSopBlocks(): Promise<BlockRow[]>;
  upsertSopBlock(b: BlockRow): Promise<void>;
  deleteSopBlock(id: string): Promise<void>;
  // Insurance
  getInsuranceBlocks(): Promise<BlockRow[]>;
  upsertInsuranceBlock(b: BlockRow): Promise<void>;
  deleteInsuranceBlock(id: string): Promise<void>;
  // QA
  getCustomQA(): Promise<QARow[]>;
  upsertQA(row: QARow): Promise<void>;
  deleteQA(id: string): Promise<void>;
  getOverrides(): Promise<OverrideRow[]>;
  setOverride(qaId: string, answer: string): Promise<void>;
  clearOverride(qaId: string): Promise<void>;
}
