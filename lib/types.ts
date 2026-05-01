export type Role = "employee" | "manager" | "admin";

export type TimesheetStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  manager_id: string | null;
  employee_code: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  name: string;
  project_id: string;
  active: boolean;
  created_at: string;
  project?: Project;
}

export interface Timesheet {
  id: string;
  employee_id: string;
  date: string;
  project_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  hours: number;
  notes: string | null;

  employee_code?: string; // Added by me

  status: TimesheetStatus;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  // Joined fields
  employee?: Profile;
  project?: Project;
  task?: Task;
  reviewer?: Profile;
}
