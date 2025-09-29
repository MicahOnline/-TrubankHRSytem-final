import { User, LeaveRequest, Exam, LeaveStatus, Announcement, Reminder, Notification, LeaveLedgerEntry, LeavePolicy, EmployeeFeedback, ExamConfig, ExamResult } from '../../types';

// Helper for making API calls to the backend
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = sessionStorage.getItem('jwt');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
     // Special handling for 401 Unauthorized, which indicates an invalid/expired token.
    if (response.status === 401 && endpoint !== '/auth/login') {
      sessionStorage.removeItem('jwt');
      // Redirecting to login is a robust way to handle session expiry.
      window.location.href = '/'; 
      throw new Error('Session expired. Please log in again.');
    }
    const errorData = await response.json().catch(() => ({ message: 'An unknown server error occurred.' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  // Handle 204 No Content responses
  if (response.status === 204) {
    return;
  }
  
  return response.json();
}


// User API
export const getUsers = (): Promise<User[]> => apiFetch('/users');
export const getUser = (id: number): Promise<User> => apiFetch(`/users/${id}`);

export const authenticateUser = (emailOrPhone: string, password: string): Promise<{user: User, token: string}> => 
    apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPhone, password }),
    });

export const updateUser = (id: number, updates: Partial<User>): Promise<User> =>
    apiFetch(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });

export const updateUserProfilePicture = (userId: number): Promise<User> =>
    apiFetch(`/users/${userId}/avatar`, {
        method: 'POST',
    });

export const createUser = (userData: Omit<User, 'id' | 'lastLogin' | 'avatarUrl' | 'leaveBalances' | 'examHistory' | 'status'> & { password?: string }): Promise<User> =>
    apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });

export const resetPassword = (userId: number): Promise<{ success: boolean }> =>
    apiFetch(`/users/${userId}/reset-password`, {
        method: 'POST',
    });

export const changePassword = (userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean }> =>
    apiFetch(`/users/${userId}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
    });

// Leave Request API
export const getLeaveRequests = (): Promise<LeaveRequest[]> => apiFetch('/leave-requests');

export const addLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> =>
    apiFetch('/leave-requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
    });

export const updateLeaveRequestStatus = (id: string, status: LeaveStatus, remarks?: string): Promise<LeaveRequest> =>
    apiFetch(`/leave-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, remarks }),
    });

export const updateLeaveRequest = (id: string, updates: Partial<Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userAvatarUrl' | 'status'>>): Promise<LeaveRequest> =>
    apiFetch(`/leave-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });

export const cancelLeaveRequest = (id: string): Promise<{ success: boolean }> =>
    apiFetch(`/leave-requests/${id}`, {
        method: 'DELETE',
    });

// Leave Ledger API
export const getLeaveLedger = (userId: number): Promise<LeaveLedgerEntry[]> => apiFetch(`/leave-ledger/${userId}`);

export const addLeaveLedgerEntry = (entryData: Omit<LeaveLedgerEntry, 'id' | 'vacationBalance' | 'sickBalance'>): Promise<LeaveLedgerEntry> =>
    apiFetch('/leave-ledger', {
        method: 'POST',
        body: JSON.stringify(entryData),
    });

// Leave Policy API
export const getLeavePolicy = (): Promise<LeavePolicy> => apiFetch('/leave-policy');

export const updateLeavePolicy = (policyUpdates: LeavePolicy): Promise<LeavePolicy> =>
    apiFetch('/leave-policy', {
        method: 'PUT',
        body: JSON.stringify(policyUpdates),
    });

// Exam API
export const getExams = (): Promise<Exam[]> => apiFetch('/exams');
export const getExam = (id: string): Promise<Exam> => apiFetch(`/exams/${id}`);

export const createExam = (examData: Omit<Exam, 'id' | 'userProgress'>): Promise<Exam> =>
    apiFetch('/exams', {
        method: 'POST',
        body: JSON.stringify(examData),
    });

export const updateExam = (id: string, updates: Partial<Exam>): Promise<Exam> =>
    apiFetch(`/exams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });

export const deleteExam = (id: string): Promise<{ success: boolean }> =>
    apiFetch(`/exams/${id}`, {
        method: 'DELETE',
    });

export const submitExam = (userId: number, examId: string, answers: { [questionId: string]: number }): Promise<ExamResult> =>
    apiFetch(`/exams/${examId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ userId, answers }),
    });

// Announcement API
export const getAnnouncements = (includeScheduled = false): Promise<Announcement[]> =>
    apiFetch(`/announcements?includeScheduled=${includeScheduled}`);

export const createAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> =>
    apiFetch('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
    });

// Reminder API
export const getReminders = (userId: number): Promise<Reminder[]> => apiFetch(`/reminders?userId=${userId}`);

export const addReminder = (reminderData: Omit<Reminder, 'id'>): Promise<Reminder> =>
    apiFetch('/reminders', {
        method: 'POST',
        body: JSON.stringify(reminderData),
    });

export const updateReminder = (id: string, updates: Partial<Reminder>): Promise<Reminder> =>
    apiFetch(`/reminders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });

export const deleteReminder = (id: string): Promise<{ success: boolean }> =>
    apiFetch(`/reminders/${id}`, {
        method: 'DELETE',
    });

// Notification API
export const getNotificationsForUser = (userId: number): Promise<Notification[]> => apiFetch(`/notifications/user/${userId}`);

export const markNotificationsAsRead = (userId: number, notificationIds: string[]): Promise<void> =>
    apiFetch(`/notifications/user/${userId}/read`, {
        method: 'POST',
        body: JSON.stringify({ notificationIds }),
    });

// Employee Feedback API
export const getEmployeeFeedback = (): Promise<EmployeeFeedback[]> => apiFetch('/feedback');

// Exam Config API
export const getExamConfig = (): Promise<ExamConfig> => apiFetch('/exam-config');

export const updateExamConfig = (configUpdates: ExamConfig): Promise<ExamConfig> =>
    apiFetch('/exam-config', {
        method: 'PUT',
        body: JSON.stringify(configUpdates),
    });