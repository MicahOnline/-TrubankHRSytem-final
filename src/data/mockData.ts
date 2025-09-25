// FIX: Created mockData.ts to provide data for the application.

import { User, LeaveRequest, Exam, Question, ExamResult, Role, Status, LeaveStatus, ExamStatus, LeaveType, Announcement, Reminder, Notification, LeaveLedgerEntry, LeavePolicy, EmployeeFeedback, ExamConfig } from '../../types';

const generateAvatar = (id: number) => `https://i.pravatar.cc/150?u=${id}`;

const examResults: { [userId: number]: ExamResult[] } = {
    2: [
        { id: 'exam1', name: 'Annual Security Training', date: '2024-05-15T10:00:00Z', score: 95, status: 'Passed' },
    ],
    3: [
        { id: 'exam1', name: 'Annual Security Training', date: '2024-05-16T11:00:00Z', score: 88, status: 'Passed' },
        { id: 'exam3', name: 'Cognitive Skills Assessment', date: '2024-08-20', score: 0, status: 'Pending' },
    ],
    4: [
        { id: 'exam2', name: 'Aptitude Test', date: '2024-07-01T14:30:00Z', score: 78, status: 'Passed' },
    ],
    5: [
        { id: 'exam2', name: 'Aptitude Test', date: '2024-07-02T09:00:00Z', score: 65, status: 'Failed' },
    ],
    8: [
      { id: 'exam-sec-aptitude', name: 'Security & Aptitude Assessment', date: '2024-09-01', score: 0, status: 'Pending' }
    ],
};

const users: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@trubank.com', phone: '555-0101', role: 'Admin', status: 'Active', lastLogin: new Date().toISOString(), avatarUrl: generateAvatar(1), leaveBalances: { vacation: 20, sick: 10 }, examHistory: [], department: 'HR', notifications: { email: true, push: false } },
  { id: 2, name: 'Employee One', email: 'employee1@trubank.com', phone: '555-0102', role: 'Employee', status: 'Active', lastLogin: '2024-07-20T10:00:00Z', avatarUrl: generateAvatar(2), leaveBalances: { vacation: 15, sick: 7 }, examHistory: examResults[2] || [], department: 'Engineering', notifications: { email: true, push: true } },
  { id: 3, name: 'Employee Two', email: 'employee2@trubank.com', phone: '555-0103', role: 'Employee', status: 'Active', lastLogin: '2024-07-21T09:30:00Z', avatarUrl: generateAvatar(3), leaveBalances: { vacation: 12, sick: 5 }, examHistory: examResults[3] || [], department: 'Engineering', notifications: { email: false, push: true } },
  { id: 4, name: 'Applicant One', email: 'applicant1@example.com', phone: '555-0104', role: 'Applicant', status: 'Pending', lastLogin: '2024-07-15T14:00:00Z', avatarUrl: generateAvatar(4), leaveBalances: { vacation: 0, sick: 0 }, examHistory: examResults[4] || [], department: 'N/A', notifications: { email: true, push: false } },
  { id: 5, name: 'Applicant Two', email: 'applicant2@example.com', phone: '555-0105', role: 'Applicant', status: 'Pending', lastLogin: '2024-07-16T11:00:00Z', avatarUrl: generateAvatar(5), leaveBalances: { vacation: 0, sick: 0 }, examHistory: examResults[5] || [], department: 'N/A', notifications: { email: true, push: true } },
  { id: 6, name: 'Inactive Employee', email: 'employee3@trubank.com', phone: '555-0106', role: 'Employee', status: 'Inactive', lastLogin: '2024-01-10T17:00:00Z', avatarUrl: generateAvatar(6), leaveBalances: { vacation: 0, sick: 0 }, examHistory: [], department: 'Sales', notifications: { email: false, push: false } },
  { id: 7, name: 'Marketing Lead', email: 'mlead@trubank.com', phone: '555-0107', role: 'Employee', status: 'Active', lastLogin: '2024-07-22T11:00:00Z', avatarUrl: generateAvatar(7), leaveBalances: { vacation: 18, sick: 8 }, examHistory: [], department: 'Marketing', notifications: { email: true, push: true } },
  { id: 8, name: 'Applicant Three', email: 'applicant3@example.com', phone: '555-0108', role: 'Applicant', status: 'Pending', lastLogin: '2024-07-23T11:00:00Z', avatarUrl: generateAvatar(8), leaveBalances: { vacation: 0, sick: 0 }, examHistory: examResults[8] || [], department: 'N/A', notifications: { email: true, push: false } },
];

const leaveRequests: LeaveRequest[] = [
  { id: 'lr1', userId: 2, userName: 'Employee One', userAvatarUrl: generateAvatar(2), leaveType: 'Vacation Leave', startDate: '2024-08-01', endDate: '2024-08-05', reason: 'Family vacation.', status: 'Approved' },
  { id: 'lr2', userId: 3, userName: 'Employee Two', userAvatarUrl: generateAvatar(3), leaveType: 'Sick Leave', startDate: '2024-07-22', endDate: '2024-07-22', reason: 'Feeling unwell.', status: 'Approved' },
  { id: 'lr3', userId: 2, userName: 'Employee One', userAvatarUrl: generateAvatar(2), leaveType: 'Vacation Leave', startDate: '2024-09-10', endDate: '2024-09-15', reason: 'Trip to the mountains.', status: 'Pending' },
  { id: 'lr4', userId: 3, userName: 'Employee Two', userAvatarUrl: generateAvatar(3), leaveType: 'Vacation Leave', startDate: '2024-08-03', endDate: '2024-08-07', reason: 'Attending a wedding.', status: 'Pending' },
  { id: 'lr5', userId: 2, userName: 'Employee One', userAvatarUrl: generateAvatar(2), leaveType: 'Sick Leave', startDate: '2024-06-10', endDate: '2024-06-11', reason: 'Doctor\'s appointment and recovery.', status: 'Rejected', remarks: 'Insufficient notice provided.' },
];

const leaveLedger: LeaveLedgerEntry[] = [
    // Employee One (ID: 2)
    { id: 'll1', userId: 2, date: '2024-01-01', transactionType: 'Carry-over', days: 5, notes: 'Carry-over from 2023', vacationBalance: 20, sickBalance: 10 },
    { id: 'll2', userId: 2, date: '2024-06-01', transactionType: 'Accrual', days: 1.5, notes: 'Monthly accrual', vacationBalance: 21.5, sickBalance: 10 },
    { id: 'll3', userId: 2, date: '2024-07-01', transactionType: 'Accrual', days: 1.5, notes: 'Monthly accrual', vacationBalance: 23, sickBalance: 10 },
    { id: 'll4', userId: 2, date: '2024-08-05', transactionType: 'Used - Vacation', days: -5, notes: 'Family vacation', vacationBalance: 18, sickBalance: 10 },
    { id: 'll5', userId: 2, date: '2024-08-10', transactionType: 'Adjustment - Add', days: 2, notes: 'Project completion bonus', vacationBalance: 20, sickBalance: 10 },
    // Employee Two (ID: 3)
    { id: 'll6', userId: 3, date: '2024-07-01', transactionType: 'Carry-over', days: 2, notes: 'Carry-over from 2023', vacationBalance: 13, sickBalance: 6 },
    { id: 'll7', userId: 3, date: '2024-07-22', transactionType: 'Used - Sick', days: -1, notes: 'Feeling unwell', vacationBalance: 13, sickBalance: 5 },
    { id: 'll8', userId: 3, date: '2024-08-01', transactionType: 'Accrual', days: 1, notes: 'Monthly accrual', vacationBalance: 14, sickBalance: 5 },
];

const leavePolicy: LeavePolicy = {
  vacationAccrualRate: 1.25,
  sickAccrualRate: 1,
  maxCarryOverDays: 5,
  availableLeaveTypes: [
    { name: 'Vacation Leave', enabled: true, withPay: true },
    { name: 'Sick Leave', enabled: true, withPay: true },
    { name: 'Paternity Leave', enabled: true, withPay: true },
    { name: 'Accident Leave', enabled: false, withPay: true },
    { name: 'Vacation Leave w/o pay', enabled: true, withPay: false },
    { name: 'Sick Leave w/o pay', enabled: true, withPay: false },
    { name: 'Maternity Leave', enabled: true, withPay: true },
  ],
};

const examConfig: ExamConfig = {
  passingScore: 70,
  aiProctoringEnabled: true,
  proctoringSensitivity: 'Moderate',
  maxViolations: 3,
};


const questions: { [examId: string]: Question[] } = {
    'exam1': [
        { id: 'q1-1', text: 'What is phishing?', options: ['A type of fishing', 'A fraudulent attempt to obtain sensitive information', 'A server configuration', 'A software bug'], correctAnswerIndex: 1 },
        { id: 'q1-2', text: 'What is a strong password?', options: ['12345678', 'password', 'A long mix of characters, numbers, and symbols', 'Your pet\'s name'], correctAnswerIndex: 2 },
    ],
    'exam2': [
        { id: 'q2-1', text: 'If a train travels 60 miles in 1 hour, how far will it travel in 3.5 hours?', options: ['180 miles', '210 miles', '240 miles', '150 miles'], correctAnswerIndex: 1 },
        { id: 'q2-2', text: 'Which number comes next in the sequence: 2, 5, 11, 23, ...?', options: ['47', '46', '34', '51'], correctAnswerIndex: 0 },
    ],
    'exam3': [
        { id: 'q3-1', text: 'What is 15% of 300?', options: ['30', '45', '50', '60'], correctAnswerIndex: 1 },
        { id: 'q3-2', text: 'Complete the analogy: Pen is to Writer as Brush is to ___?', options: ['Painter', 'Canvas', 'Color', 'Easel'], correctAnswerIndex: 0 },
    ],
    'exam-sec-aptitude': [
        { id: 'q-sec-1', text: "You receive an email from 'IT Support' asking you to click a link to update your password immediately due to a security breach. The link looks slightly unusual. What is the safest course of action?", options: ["Click the link and update your password as requested to secure your account.", "Forward the email to a colleague to see if they received it too.", "Delete the email and do not click the link. Report it to the actual IT department through official channels.", "Reply to the email and ask for verification."], correctAnswerIndex: 2 },
        { id: 'q-sec-2', text: "Which of the following represents the strongest password?", options: ["Password123", "TrubankExam2024!", "MyDogsNameIsBuddy", "R#8b^@!pZ*qT"], correctAnswerIndex: 3 },
        { id: 'q-sec-3', text: "What is the primary purpose of Two-Factor Authentication (2FA)?", options: ["To make your password twice as long.", "To add a second layer of security beyond just a password, usually a code from your phone or another device.", "To allow two users to log into the same account.", "To speed up the login process."], correctAnswerIndex: 1 },
        { id: 'q-sec-4', text: "Find the next number in the sequence: 3, 6, 12, 24, __", options: ["36", "48", "30", "60"], correctAnswerIndex: 1 },
        { id: 'q-sec-5', text: "A core principle of information security is 'Confidentiality, Integrity, and Availability', often called the CIA triad. Which of these best describes 'Integrity'?", options: ["Ensuring that information is accessible only to authorized individuals.", "Ensuring that systems are running and data is available when needed.", "This is a very long option designed specifically to test how the user interface handles text that might wrap onto multiple lines or even overflow its container if not handled properly. It is crucial for UI/UX design to account for variable content lengths to maintain a clean and readable layout. This option ensures that the design is robust.", "Ensuring that data is accurate and trustworthy, and has not been tampered with by unauthorized parties."], correctAnswerIndex: 3 },
    ]
};

const exams: Exam[] = [
  { 
      id: 'exam1', 
      title: 'Annual Security Training', 
      topic: 'Cybersecurity basics',
      questions: questions['exam1'],
      assignedTo: { roles: ['Employee'], departments: [], users: [] },
      scheduledDate: '2024-12-31',
      dueDate: '2025-01-15',
      startTime: '09:00',
      duration: 60,
      userProgress: {
        2: { status: 'Passed', score: 95, completedDate: '2024-05-15T10:00:00Z' },
        3: { status: 'Passed', score: 88, completedDate: '2024-05-16T11:00:00Z' },
      }
  },
  { 
      id: 'exam2', 
      title: 'Aptitude Test', 
      topic: 'Logical reasoning and quantitative analysis',
      questions: questions['exam2'],
      assignedTo: { roles: ['Applicant'], departments: [], users: [] },
      scheduledDate: '2024-08-15',
      dueDate: '2024-08-30',
      startTime: '14:00',
      duration: 90,
      userProgress: {
        4: { status: 'Passed', score: 78, completedDate: '2024-07-01T14:30:00Z' },
        5: { status: 'Failed', score: 65, completedDate: '2024-07-02T09:00:00Z' },
      }
  },
  { 
      id: 'exam3', 
      title: 'Cognitive Skills Assessment', 
      topic: 'Problem-solving and critical thinking',
      questions: questions['exam3'],
      assignedTo: { roles: ['Applicant', 'Employee'], departments: [], users: [] },
      scheduledDate: '2024-08-20',
      dueDate: '2024-09-05',
      startTime: '10:00',
      duration: 30,
      userProgress: {}
  },
  { 
      id: 'exam-sec-aptitude', 
      title: 'Security & Aptitude Assessment', 
      topic: 'Fundamental Security Concepts and Logical Reasoning',
      questions: questions['exam-sec-aptitude'],
      assignedTo: { roles: ['Applicant'], departments: [], users: [] },
      scheduledDate: '2024-09-01',
      dueDate: '2024-09-15',
      startTime: '10:00',
      duration: 15,
      userProgress: {}
  },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const announcements: Announcement[] = [
  {
    id: 'anno1',
    title: 'Welcome to the New HR Portal!',
    content: 'We are excited to launch our new AI-powered HR system. Please explore the features and let us know your feedback.',
    audience: ['Employee', 'Applicant'],
    createdAt: '2024-07-20T10:00:00Z',
    category: 'General',
    scheduledFor: null,
  },
  {
    id: 'anno2',
    title: 'Q3 Performance Reviews',
    content: 'A reminder that Q3 performance reviews are due by the end of the month. Please schedule a meeting with your manager.',
    audience: ['Employee'],
    createdAt: '2024-07-22T14:00:00Z',
    category: 'Urgent',
    scheduledFor: null,
  },
  {
    id: 'anno3',
    title: 'Application Deadline Extension',
    content: 'The deadline for the Senior Software Engineer position has been extended to August 15th. We encourage all qualified candidates to apply.',
    audience: ['Applicant'],
    createdAt: '2024-07-23T09:00:00Z',
    category: 'Policy Update',
    scheduledFor: null,
  },
  {
    id: 'anno4',
    title: 'Upcoming Town Hall Meeting',
    content: 'Join us for the quarterly town hall next Friday. An agenda will be sent out shortly.',
    audience: ['Employee'],
    createdAt: new Date().toISOString(),
    category: 'Event',
    scheduledFor: tomorrow.toISOString(),
  }
];

const reminders: Reminder[] = [];

const notifications: Notification[] = [];

const employeeFeedback: EmployeeFeedback[] = [
  { id: 'fb1', userId: 2, date: '2024-07-15T10:00:00Z', feedback: "The new project management tool is a game-changer! It's so much easier to track tasks now." },
  { id: 'fb2', userId: 3, date: '2024-07-16T11:30:00Z', feedback: "I'm feeling a bit burnt out. The workload has been intense lately, and the deadlines are very tight. It's becoming stressful." },
  { id: 'fb3', userId: 7, date: '2024-07-18T14:00:00Z', feedback: "The quarterly town hall was really informative. It's great to have transparency from leadership." },
  { id: 'fb4', userId: 2, date: '2024-07-20T09:00:00Z', feedback: "Communication between the engineering and marketing teams could be improved. Sometimes we get requirements very late in the cycle." },
  { id: 'fb5', userId: 6, date: '2024-07-21T16:45:00Z', feedback: "While the projects are challenging, I don't feel like there are enough opportunities for career growth or promotions in my current role." },
];


export const mockUsers = users;
export const mockLeaveRequests = leaveRequests;
export const mockExams = exams;
export const mockAnnouncements = announcements;
export const mockReminders = reminders;
export const mockNotifications = notifications;
export const mockLeaveLedger = leaveLedger;
export const mockLeavePolicy = leavePolicy;
export const mockEmployeeFeedback = employeeFeedback;
export const mockExamConfig = examConfig;