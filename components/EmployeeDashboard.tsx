import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import * as api from '../src/utils/api';
import { getLeaveAnalysis } from '../services/geminiService';
// FIX: The 'View' type is exported from `types.ts`, not `App.tsx`. Consolidated imports.
import { LeaveRequest, LeaveStatus, ExamResult, Announcement, ExamStatus, View } from '../types';
import { CalendarIcon, BriefcaseIcon, CheckCircleIcon, AlertTriangleIcon, BookOpenIcon, CloseIcon, BotIcon, MegaphoneIcon, PlayIcon } from './icons';
import DashboardWidgets from './DashboardWidgets';
import LeaveCalendar from '../src/components/LeaveCalendar';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 transition-all duration-300 ease-in-out hover:border-emerald-400/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 ${className}`}>
        {children}
    </div>
);

interface EmployeeDashboardProps {
  setActiveView: (view: View) => void;
  onStartExam: (examId: string) => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ setActiveView, onStartExam }) => {
    const { user } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [forecast, setForecast] = useState<string | null>(null);
    const [isForecasting, setIsForecasting] = useState(false);
    const [forecastError, setForecastError] = useState<string | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>(() => {
        const saved = sessionStorage.getItem('dismissedAnnouncements');
        return saved ? JSON.parse(saved) : [];
    });


    useEffect(() => {
        const fetchRequests = async () => {
            if (user) {
                const allRequests = await api.getLeaveRequests();
                const userRequests = allRequests.filter(req => req.userId === user.id);
                setLeaveRequests(userRequests);
            }
        };
        const fetchAnnouncements = async () => {
            try {
                const allAnnouncements = await api.getAnnouncements(); // Fetches only published
                const relevant = allAnnouncements.filter(a => a.audience.includes('Employee'));
                setAnnouncements(relevant);
            } catch (e) {
                console.error("Failed to fetch announcements");
            }
        };
        fetchRequests();
        fetchAnnouncements();
    }, [user]);

    const handleGenerateForecast = async () => {
        if (!user) return;
        setIsForecasting(true);
        setForecast(null);
        setForecastError(null);
        try {
            const allRequests = await api.getLeaveRequests();
            const relevantRequests = allRequests.filter(r => r.status !== 'Rejected');
            const analysis = await getLeaveAnalysis(relevantRequests, user.name);
            setForecast(analysis);
        } catch (error) {
            setForecastError("Sorry, the AI forecast is unavailable right now. Please try again later.");
            console.error(error);
        } finally {
            setIsForecasting(false);
        }
    };

    const handleDismissAnnouncement = (id: string) => {
        const newDismissed = [...dismissedAnnouncements, id];
        setDismissedAnnouncements(newDismissed);
        sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    };

    const visibleAnnouncements = useMemo(() => {
        return announcements.filter(a => !dismissedAnnouncements.includes(a.id));
    }, [announcements, dismissedAnnouncements]);


    const recentRequests = useMemo(() => {
        return leaveRequests
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .slice(0, 3);
    }, [leaveRequests]);
    
    const { pendingExams, completedExams } = useMemo(() => {
        if (!user?.examHistory) return { pendingExams: [], completedExams: [] };
        const pending = user.examHistory.filter(e => e.status === 'Pending');
        const completed = user.examHistory.filter(e => e.status !== 'Pending');
        completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { pendingExams: pending, completedExams: completed };
    }, [user?.examHistory]);

    const getStatusInfo = (status: LeaveStatus): { icon: React.ReactNode, color: string } => {
        switch (status) {
            case 'Approved': return { icon: <CheckCircleIcon className="w-5 h-5" />, color: 'text-green-500 dark:text-green-400' };
            case 'Rejected': return { icon: <AlertTriangleIcon className="w-5 h-5" />, color: 'text-red-500 dark:text-red-400' };
            case 'Pending': return { icon: <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />, color: 'text-yellow-500 dark:text-yellow-400' };
            default: return { icon: null, color: 'text-gray-500 dark:text-gray-400' };
        }
    };

    const getExamStatusBadge = (status: ExamStatus) => {
        switch (status) {
            case 'Passed': return 'bg-green-500/20 text-green-300';
            case 'Failed': return 'bg-red-500/20 text-red-300';
            case 'Pending': return 'bg-yellow-500/20 text-yellow-300';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    const getCategoryBadge = (category: Announcement['category']) => {
        switch (category) {
            case 'Urgent': return 'bg-red-500/20 text-red-300';
            case 'Event': return 'bg-green-500/20 text-green-300';
            case 'Policy Update': return 'bg-yellow-500/20 text-yellow-300';
            case 'General':
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return (
        <div className="space-y-8 animate-fadeInUp">
            {visibleAnnouncements.map(announcement => (
                <GlassCard key={announcement.id} className="border-emerald-400/50 relative">
                    <button onClick={() => handleDismissAnnouncement(announcement.id)} aria-label={`Dismiss announcement titled ${announcement.title}`} className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors z-10">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 p-3 rounded-full flex-shrink-0 mt-1">
                            <MegaphoneIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{announcement.title}</h3>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadge(announcement.category)}`}>{announcement.category}</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{announcement.content}</p>
                            <p className="text-xs text-gray-500 mt-2">Posted on {new Date(announcement.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </GlassCard>
            ))}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name.split(' ')[0]}!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">This is your personal work hub.</p>
                </div>
                <div className="w-full md:w-auto">
                    <DashboardWidgets />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <CalendarIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">My Leave Balance</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">{user?.leaveBalances.vacation}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Vacation Days</p>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white">{user?.leaveBalances.sick}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Sick Days</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="flex flex-col">
                    <div className="flex-grow">
                         <div className="flex items-center gap-3 mb-4">
                            <BriefcaseIcon className="w-6 h-6 text-green-500 dark:text-green-300" />
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Quick Actions</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Need to take time off? Submit a request here.</p>
                    </div>
                    <button
                        // FIX: Changed 'leave-management' to 'leave-requests' to match the valid View types.
                        onClick={() => setActiveView('leave-requests')}
                        className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                    >
                        Request Leave
                    </button>
                </GlassCard>
            </div>
            
            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <CalendarIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-lg">Recent Leave Requests</h3>
                </div>
                {recentRequests.length > 0 ? (
                    <ul className="space-y-2">
                        {recentRequests.map(req => {
                            const { icon, color } = getStatusInfo(req.status);
                            return (
                                <li key={req.id} className="bg-gray-200/50 dark:bg-white/5 p-3 rounded-lg border border-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center transition-colors hover:bg-gray-300/50 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/20">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{req.leaveType} Leave</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-2 font-semibold text-sm ${color} mt-2 sm:mt-0`}>
                                        {icon}
                                        <span>{req.status}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-white/10" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No recent requests</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Your submitted leave requests will appear here once you make them.</p>
                    </div>
                )}
            </GlassCard>

            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <BookOpenIcon className="w-6 h-6 text-green-500 dark:text-green-300" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">My Refresher Exams & Tasks</h3>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">Pending Exams</h4>
                    {pendingExams.length > 0 ? (
                        <ul className="space-y-2">
                            {pendingExams.map((exam: ExamResult) => (
                                <li key={exam.id} className="bg-gray-200/50 dark:bg-white/5 p-3 rounded-lg border border-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center transition-colors hover:bg-gray-300/50 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/20">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{exam.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Awaiting completion</p>
                                    </div>
                                    <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                                        <button
                                            onClick={() => onStartExam(exam.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                                        >
                                            <PlayIcon className="w-5 h-5" />
                                            <span>Start Exam</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-200/50 dark:bg-white/5 rounded-lg text-center">
                            You have no pending exams.
                        </p>
                    )}
                </div>

                <div className="my-6 border-t border-black/10 dark:border-white/10"></div>

                <div>
                     <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">Exam History</h4>
                     {completedExams.length > 0 ? (
                        <ul className="space-y-2">
                            {completedExams.map((exam: ExamResult) => (
                                <li key={exam.id} className="bg-gray-200/50 dark:bg-white/5 p-3 rounded-lg border border-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center transition-colors">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{exam.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Completed on {new Date(exam.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-3 mt-2 sm:mt-0">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getExamStatusBadge(exam.status)}`}>
                                            {exam.status}
                                        </span>
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{exam.score}%</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                     ) : (
                         <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-200/50 dark:bg-white/5 rounded-lg text-center">
                            Your completed exams will appear here.
                        </p>
                     )}
                </div>
            </GlassCard>

            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <BotIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-300" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">AI Team Availability Forecast</h3>
                </div>
                
                <div aria-live="polite">
                    {isForecasting && (
                        <div className="flex items-center justify-center flex-col h-32 text-center">
                            <div className="w-5 h-5 border-2 border-gray-400/50 dark:border-white/50 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-gray-600 dark:text-gray-400">Our AI is analyzing the team schedule...</p>
                        </div>
                    )}

                    {!isForecasting && forecast && (
                        <div>
                            <div className="text-gray-700 dark:text-gray-300 space-y-2 whitespace-pre-wrap p-3 bg-gray-200/50 dark:bg-white/5 rounded-md border border-gray-300/50 dark:border-white/10">
                                {forecast}
                            </div>
                            <div className="text-center">
                                <button
                                    onClick={handleGenerateForecast}
                                    className="mt-4 text-xs text-emerald-600 dark:text-emerald-300 hover:text-emerald-500 dark:hover:text-emerald-200"
                                >
                                    Regenerate Forecast
                                </button>
                            </div>
                        </div>
                    )}

                    {!isForecasting && !forecast && (
                        <div className="text-center py-4">
                            {forecastError && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{forecastError}</p>}
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Get AI-powered insights into your team's upcoming leave to plan your time off effectively.
                            </p>
                            <button
                                onClick={handleGenerateForecast}
                                disabled={isForecasting}
                                className="px-4 py-2 bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                            >
                                Generate Forecast
                            </button>
                        </div>
                    )}
                </div>
            </GlassCard>

            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <CalendarIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">My Leave Calendar</h3>
                </div>
                <LeaveCalendar leaveRequests={leaveRequests} />
            </GlassCard>
        </div>
    );
};

export default EmployeeDashboard;