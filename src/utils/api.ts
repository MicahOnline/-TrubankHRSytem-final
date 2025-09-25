// FIX: Created api.ts to mock API interactions.

import { User, LeaveRequest, Exam, LeaveStatus, Question, Role, Assignment, Announcement, ExamResult, ExamStatus, Reminder, Notification, LeaveLedgerEntry, LeavePolicy, EmployeeFeedback, ExamConfig } from '../../types';
import { mockUsers, mockLeaveRequests, mockExams, mockAnnouncements, mockReminders, mockNotifications, mockLeaveLedger, mockLeavePolicy, mockEmployeeFeedback, mockExamConfig } from '../data/mockData';

// Simulate API latency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

let users: User[] = JSON.parse(JSON.stringify(mockUsers));
let leaveRequests: LeaveRequest[] = JSON.parse(JSON.stringify(mockLeaveRequests));
let exams: Exam[] = JSON.parse(JSON.stringify(mockExams));
let announcements: Announcement[] = JSON.parse(JSON.stringify(mockAnnouncements));
let reminders: Reminder[] = JSON.parse(JSON.stringify(mockReminders));
let notifications: Notification[] = JSON.parse(JSON.stringify(mockNotifications));
let leaveLedger: LeaveLedgerEntry[] = JSON.parse(JSON.stringify(mockLeaveLedger));
let leavePolicy: LeavePolicy = JSON.parse(JSON.stringify(mockLeavePolicy));
let employeeFeedback: EmployeeFeedback[] = JSON.parse(JSON.stringify(mockEmployeeFeedback));
let examConfig: ExamConfig = JSON.parse(JSON.stringify(mockExamConfig));


// User API
export const getUsers = async (): Promise<User[]> => {
  await delay(500);
  return users;
};

export const getUser = async (id: number): Promise<User> => {
    await delay(300);
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
};

export const authenticateUser = async (emailOrPhone: string, password: string): Promise<User> => {
    await delay(800); // Simulate network latency
    // In a real app, you would NEVER send a plain password.
    // The backend would receive the password, hash it, and compare it to the stored hash.
    // For this mock, we accept any non-empty password for a valid user.
    
    const trimmedInput = emailOrPhone.trim();

    const user = users.find(u => {
        const isEmailMatch = u.email.toLowerCase() === trimmedInput.toLowerCase();
        
        let isPhoneMatch = false;
        // More robust phone matching: ignore non-digit characters
        if (u.phone && trimmedInput) {
            const storedPhoneDigits = u.phone.replace(/\D/g, '');
            const inputDigits = trimmedInput.replace(/\D/g, '');
            if (inputDigits.length > 0 && storedPhoneDigits === inputDigits) {
                isPhoneMatch = true;
            }
        }
        
        return isEmailMatch || isPhoneMatch;
    });

    // FIX: Add a check to prevent applicants who have failed an exam from logging in.
    const isFailedApplicant = user?.role === 'Applicant' && user.examHistory.some(exam => exam.status === 'Failed');


    if (!user || !password || user.status === 'Inactive' || isFailedApplicant) { // Simple check for mock
        throw new Error('Invalid credentials. Please try again.');
    }

    return user;
};


export const updateUser = async (id: number, updates: Partial<User>): Promise<User> => {
    await delay(700);
    // Simulate server-side validation
    if (updates.name !== undefined && updates.name.trim() === '') {
        throw new Error('Server validation: Name cannot be empty.');
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    users[userIndex] = { ...users[userIndex], ...updates };
    return users[userIndex];
};

export const updateUserProfilePicture = async (userId: number): Promise<User> => {
    await delay(900); // Simulate upload time
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('User not found');
    
    // Generate a new random avatar to simulate upload
    const newAvatarUrl = `https://i.pravatar.cc/150?u=${userId}&t=${Date.now()}`;
    users[userIndex].avatarUrl = newAvatarUrl;

    // Also update avatar URL in any leave requests made by this user for consistency
    leaveRequests.forEach(req => {
        if (req.userId === userId) {
            req.userAvatarUrl = newAvatarUrl;
        }
    });

    return users[userIndex];
};

export const createUser = async (userData: Omit<User, 'id' | 'lastLogin' | 'avatarUrl' | 'leaveBalances' | 'examHistory' | 'status'> & { password?: string }): Promise<User> => {
    await delay(800);
    
    // Simulate server-side validation
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('Email address is already in use.');
    }
    if (!userData.password || userData.password.length < 8) {
        throw new Error('Server validation: Password must be at least 8 characters long.');
    }
    if (!userData.name || userData.name.trim().length === 0) {
        throw new Error('Server validation: Name cannot be empty.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
        throw new Error('Server validation: Invalid email format.');
    }

    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    // Do not store the plain password on the user object
    const { password, ...restOfUserData } = userData;

    const newUser: User = {
        ...restOfUserData,
        id: newId,
        lastLogin: new Date().toISOString(),
        avatarUrl: `https://i.pravatar.cc/150?u=${newId}`,
        leaveBalances: { vacation: 0, sick: 0 },
        examHistory: [],
        status: 'Active',
        department: userData.department || 'N/A',
    };
    users.push(newUser);
    return newUser;
};

export const resetPassword = async (userId: number): Promise<{ success: boolean }> => {
    await delay(500);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    // In a real app, this would trigger an email with a reset link.
    console.log(`Password reset triggered for ${user.name}. A temporary password would be sent to ${user.email}.`);
    return { success: true };
};


export const changePassword = async (userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
    await delay(1000);
    // In a real app, you'd validate the currentPassword against a hash.
    // For this mock, we'll just pretend it worked as long as a value is provided.
    if (!currentPassword || !newPassword) throw new Error("Passwords cannot be empty.");
    console.log(`Password changed for user ${userId}.`);
    return { success: true };
};


// Leave Request API
export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    await delay(500);
    return leaveRequests;
};

export const addLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> => {
    await delay(800);
    const newRequest: LeaveRequest = {
        ...requestData,
        id: `lr${Date.now()}`,
        status: 'Pending',
    };
    leaveRequests.unshift(newRequest);
    return newRequest;
};

export const updateLeaveRequestStatus = async (id: string, status: LeaveStatus, remarks?: string): Promise<LeaveRequest> => {
    await delay(600);
    const requestIndex = leaveRequests.findIndex(r => r.id === id);
    if (requestIndex === -1) throw new Error('Leave request not found');
    
    const originalStatus = leaveRequests[requestIndex].status;
    leaveRequests[requestIndex].status = status;
    if (status === 'Rejected' && remarks) {
        leaveRequests[requestIndex].remarks = remarks;
    }
    
    // Create a notification for the employee if the status changed from Pending
    if (originalStatus === 'Pending' && (status === 'Approved' || status === 'Rejected')) {
        const request = leaveRequests[requestIndex];
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            userId: request.userId,
            message: `Your ${request.leaveType.toLowerCase()} for ${new Date(request.startDate).toLocaleDateString()} has been ${status.toLowerCase()}.`,
            type: status === 'Approved' ? 'success' : 'error',
            read: false,
            createdAt: new Date().toISOString(),
            link: 'leave-requests',
        };
        notifications.unshift(newNotification);
    }
    
    return leaveRequests[requestIndex];
};

export const updateLeaveRequest = async (id: string, updates: Partial<Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userAvatarUrl' | 'status'>>): Promise<LeaveRequest> => {
    await delay(700);
    const requestIndex = leaveRequests.findIndex(r => r.id === id);
    if (requestIndex === -1) throw new Error('Leave request not found');
    leaveRequests[requestIndex] = { ...leaveRequests[requestIndex], ...updates };
    return leaveRequests[requestIndex];
};

export const cancelLeaveRequest = async (id: string): Promise<{ success: boolean }> => {
    await delay(500);
    const initialLength = leaveRequests.length;
    leaveRequests = leaveRequests.filter(r => r.id !== id);
    if (leaveRequests.length === initialLength) throw new Error('Leave request not found');
    return { success: true };
};

// Leave Ledger API
export const getLeaveLedger = async (userId: number): Promise<LeaveLedgerEntry[]> => {
    await delay(400);
    return leaveLedger
        .filter(entry => entry.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addLeaveLedgerEntry = async (entryData: Omit<LeaveLedgerEntry, 'id' | 'vacationBalance' | 'sickBalance'>): Promise<LeaveLedgerEntry> => {
    await delay(600);
    const userIndex = users.findIndex(u => u.id === entryData.userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = users[userIndex];
    let newVacationBalance = user.leaveBalances.vacation;
    let newSickBalance = user.leaveBalances.sick;
    
    switch(entryData.transactionType) {
        case 'Accrual':
        case 'Adjustment - Add':
        case 'Carry-over':
            // This is a simplification; a real system would differentiate between sick/vacation accrual.
            newVacationBalance += entryData.days;
            break;
        case 'Adjustment - Remove':
            newVacationBalance -= entryData.days;
            break;
        case 'Used - Vacation':
            newVacationBalance -= entryData.days;
            break;
        case 'Used - Sick':
            newSickBalance -= entryData.days;
            break;
    }
    
    // Update the master user record
    user.leaveBalances = { vacation: newVacationBalance, sick: newSickBalance };

    const newEntry: LeaveLedgerEntry = {
        ...entryData,
        id: `ledger-${Date.now()}`,
        vacationBalance: newVacationBalance,
        sickBalance: newSickBalance,
        days: entryData.transactionType.includes('Used') || entryData.transactionType.includes('Remove') ? -Math.abs(entryData.days) : Math.abs(entryData.days)
    };
    
    leaveLedger.push(newEntry);
    return newEntry;
};

// Leave Policy API
export const getLeavePolicy = async (): Promise<LeavePolicy> => {
    await delay(400);
    return JSON.parse(JSON.stringify(leavePolicy));
};

export const updateLeavePolicy = async (policyUpdates: LeavePolicy): Promise<LeavePolicy> => {
    await delay(700);
    leavePolicy = JSON.parse(JSON.stringify(policyUpdates));
    return leavePolicy;
};


// Exam API
export const getExams = async (): Promise<Exam[]> => {
    await delay(500);
    return exams;
};

export const getExam = async (id: string): Promise<Exam> => {
    await delay(300);
    const exam = exams.find(e => e.id === id);
    if (!exam) throw new Error('Exam not found');
    return exam;
};

export const createExam = async (examData: Omit<Exam, 'id' | 'userProgress'>): Promise<Exam> => {
    await delay(1000);
    
    const assignedUserIds = new Set<number>();
    
    users.forEach(user => {
        const { roles, departments, users: userIds } = examData.assignedTo;
        if (
            roles.includes(user.role) ||
            departments.includes(user.department) ||
            userIds.includes(user.id)
        ) {
            assignedUserIds.add(user.id);
        }
    });
    
    const newExam: Exam = {
        ...examData,
        id: `exam${Date.now()}`,
        userProgress: {},
    };

    exams.unshift(newExam);
    
    // Add pending exam to assigned users' history and create notifications
    assignedUserIds.forEach(userId => {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].examHistory.push({
                id: newExam.id,
                name: newExam.title,
                date: newExam.scheduledDate,
                score: 0,
                status: 'Pending',
            });
            
            const newNotification: Notification = {
                id: `notif-${Date.now()}-${userId}`,
                userId: userId,
                message: `You have been assigned a new exam: "${newExam.title}".`,
                type: 'info',
                read: false,
                createdAt: new Date().toISOString(),
                link: 'my-exams'
            };
            notifications.unshift(newNotification);
        }
    });

    return newExam;
};

export const updateExam = async (id: string, updates: Partial<Exam>): Promise<Exam> => {
    await delay(700);
    const examIndex = exams.findIndex(e => e.id === id);
    if (examIndex === -1) throw new Error('Exam not found');
    exams[examIndex] = { ...exams[examIndex], ...updates };
    return exams[examIndex];
};

export const deleteExam = async (id: string): Promise<{ success: boolean }> => {
    await delay(700);
    const initialLength = exams.length;
    exams = exams.filter(e => e.id !== id);
    if (exams.length === initialLength) throw new Error('Exam not found');
    
    // Remove from user history
    users.forEach(user => {
        user.examHistory = user.examHistory.filter(e => e.id !== id);
    });

    return { success: true };
};

export const submitExam = async (userId: number, examId: string, answers: { [questionId: string]: number }): Promise<ExamResult> => {
    await delay(1000);
    const exam = exams.find(e => e.id === examId);
    const userIndex = users.findIndex(u => u.id === userId);

    if (!exam || userIndex === -1) {
        throw new Error('Exam or user not found');
    }

    let correctAnswers = 0;
    exam.questions.forEach(q => {
        if (answers[q.id] === q.correctAnswerIndex) {
            correctAnswers++;
        }
    });

    const score = exam.questions.length > 0 ? Math.round((correctAnswers / exam.questions.length) * 100) : 0;
    const status: ExamStatus = score >= examConfig.passingScore ? 'Passed' : 'Failed';
    const completedDate = new Date().toISOString();
    
    // Update exam's userProgress
    if (!exam.userProgress) {
        exam.userProgress = {};
    }
    exam.userProgress[userId] = { status, score, completedDate };

    // Update user's examHistory
    const userExamHistoryIndex = users[userIndex].examHistory.findIndex(e => e.id === examId);
    if (userExamHistoryIndex !== -1) {
        users[userIndex].examHistory[userExamHistoryIndex] = {
            ...users[userIndex].examHistory[userExamHistoryIndex],
            score,
            status,
            date: completedDate
        };
    }
    
    const result: ExamResult = {
        id: examId,
        name: exam.title,
        date: completedDate,
        score,
        status
    };

    return result;
};

// Announcement API
export const getAnnouncements = async (includeScheduled = false): Promise<Announcement[]> => {
    await delay(400);
    const now = new Date();
    const filtered = includeScheduled
        ? [...announcements]
        : [...announcements].filter(a => !a.scheduledFor || new Date(a.scheduledFor) <= now);
    
    return filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
    });
};

export const createAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    await delay(800);
    const newAnnouncement: Announcement = {
        ...data,
        id: `anno${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    announcements.unshift(newAnnouncement);
    
    // Create notifications for the target audience if it's not scheduled for the future
    if (!newAnnouncement.scheduledFor || new Date(newAnnouncement.scheduledFor) <= new Date()) {
        const usersToNotify = users.filter(u => newAnnouncement.audience.includes(u.role as 'Employee' | 'Applicant'));
        usersToNotify.forEach(user => {
             const newNotification: Notification = {
                id: `notif-${Date.now()}-${user.id}`,
                userId: user.id,
                message: `New Announcement: "${newAnnouncement.title}".`,
                type: 'info',
                read: false,
                createdAt: new Date().toISOString(),
                link: 'dashboard',
            };
            notifications.unshift(newNotification);
        });
    }

    return newAnnouncement;
};

// Reminder API
export const getReminders = async (userId: number): Promise<Reminder[]> => {
    await delay(300);
    return reminders.filter(r => r.userId === userId);
};

export const addReminder = async (reminderData: Omit<Reminder, 'id'>): Promise<Reminder> => {
    await delay(500);
    const newReminder: Reminder = {
        ...reminderData,
        id: `rem${Date.now()}`,
    };
    reminders.push(newReminder);
    return newReminder;
};

export const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
    await delay(500);
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reminder not found');
    reminders[index] = { ...reminders[index], ...updates };
    return reminders[index];
};

export const deleteReminder = async (id: string): Promise<{ success: boolean }> => {
    await delay(400);
    reminders = reminders.filter(r => r.id !== id);
    return { success: true };
};

// Notification API
export const getNotificationsForUser = async (userId: number): Promise<Notification[]> => {
    await delay(200);
    return notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const markNotificationsAsRead = async (userId: number, notificationIds: string[]): Promise<void> => {
    await delay(150);
    notifications.forEach(n => {
        if (n.userId === userId && notificationIds.includes(n.id)) {
            n.read = true;
        }
    });
};

// Employee Feedback API
export const getEmployeeFeedback = async (): Promise<EmployeeFeedback[]> => {
    await delay(450);
    return employeeFeedback;
};

// Exam Config API
export const getExamConfig = async (): Promise<ExamConfig> => {
    await delay(300);
    return JSON.parse(JSON.stringify(examConfig));
};

export const updateExamConfig = async (configUpdates: ExamConfig): Promise<ExamConfig> => {
    await delay(600);
    examConfig = JSON.parse(JSON.stringify(configUpdates));
    return examConfig;
};