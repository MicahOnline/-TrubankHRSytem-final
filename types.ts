// FIX: Created types.ts to define all shared types.

export type View = 'dashboard' | 'ai-assistant' | 'user-management' | 'leave-requests' | 'leave-ledger' | 'exam-management' | 'pre-exam-instructions' | 'exam-taking' | 'profile-settings' | 'settings' | 'reports' | 'my-exams' | 'create-announcement';

export type Role = 'Admin' | 'Employee' | 'Applicant';
export type Status = 'Active' | 'Inactive' | 'Pending';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Vacation Leave' | 'Sick Leave' | 'Paternity Leave' | 'Accident Leave' | 'Vacation Leave w/o pay' | 'Sick Leave w/o pay' | 'Maternity Leave';
export type ExamStatus = 'Passed' | 'Failed' | 'Pending';

export interface LeaveBalance {
  vacation: number;
  sick: number;
}

export interface Reminder {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  color: 'purple' | 'blue' | 'green' | 'yellow' | 'red';
  userId: number;
}

export interface ExamResult {
  id: string;
  name: string;
  date: string;
  score: number;
  status: ExamStatus;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: Status;
  lastLogin: string;
  avatarUrl: string;
  leaveBalances: LeaveBalance;
  examHistory: ExamResult[];
  department: string;
  notifications?: {
    email: boolean;
    push: boolean;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface LeaveRequest {
  id: string;
  userId: number;
  userName: string;
  userAvatarUrl: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  remarks?: string;
}

export type TransactionType = 'Accrual' | 'Used - Vacation' | 'Used - Sick' | 'Adjustment - Add' | 'Adjustment - Remove' | 'Carry-over';

export interface LeaveLedgerEntry {
  id: string;
  userId: number;
  date: string; // YYYY-MM-DD
  transactionType: TransactionType;
  days: number; // can be positive or negative
  notes?: string;
  vacationBalance: number;
  sickBalance: number;
}


export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswerIndex: number;
}

export interface Assignment {
    roles: Role[];
    departments: string[];
    users: number[]; // user IDs
}

export interface Exam {
    id:string;
    title: string;
    topic: string;
    questions: Question[];
    assignedTo: Assignment;
    scheduledDate: string;
    dueDate: string;
    startTime: string;
    duration: number; // in minutes
    userProgress?: {
        [userId: number]: {
            status: ExamStatus;
            score: number;
            completedDate: string;
            answeredQuestions?: number;
        }
    }
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: ('Employee' | 'Applicant')[];
  createdAt: string; // ISO string
  category: 'General' | 'Urgent' | 'Event' | 'Policy Update';
  scheduledFor: string | null; // ISO string for future publishing
}

export interface Notification {
  id: string;
  userId: number;
  message: string;
  type: 'success' | 'error' | 'info';
  read: boolean;
  createdAt: string;
  link?: View;
}

export interface LeaveTypeSetting {
  name: LeaveType;
  enabled: boolean;
  withPay: boolean;
}

export interface LeavePolicy {
  vacationAccrualRate: number; // days per month
  sickAccrualRate: number; // days per month
  maxCarryOverDays: number;
  availableLeaveTypes: LeaveTypeSetting[];
}

export type ProctoringSensitivity = 'Strict' | 'Moderate' | 'Lenient';

export interface ExamConfig {
  passingScore: number; // percentage
  aiProctoringEnabled: boolean;
  proctoringSensitivity: ProctoringSensitivity;
  maxViolations: number;
}


export interface EmployeeFeedback {
  id: string;
  userId: number;
  date: string; // ISO String
  feedback: string;
}

export interface AttritionRiskResult {
  userId: number;
  riskLevel: 'High' | 'Medium' | 'Low';
  reason: string;
  riskScore: number;
}