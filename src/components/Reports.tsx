import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';
import { LeaveRequest, Exam, User, ExamResult } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { DownloadIcon, CalendarIcon, BookOpenIcon, CheckCircleIcon, AlertTriangleIcon, PrintIcon } from '../../components/icons';
import { exportToCSV, exportToPDF, getLeaveDuration } from '../utils/export';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white/40 dark:bg-white/5 p-4 rounded-lg border border-black/5 dark:border-white/10">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-200/50 dark:bg-black/20 rounded-full">{icon}</div>
            <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            </div>
        </div>
    </div>
);

type AdminTab = 'Leave' | 'Exams';

const LEAVE_TYPE_COLORS = ['#14b8a6', '#2dd4bf']; // teal, cyan
const EXAM_OUTCOME_COLORS = ['#34d399', '#f87171', '#facc15']; // Corresponds to Passed, Failed, Pending

const Reports: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { theme } = useTheme();
    const isAdmin = currentUser?.role === 'Admin';
    
    // Admin State
    const [adminTab, setAdminTab] = useState<AdminTab>('Leave');
    const [allLeave, setAllLeave] = useState<LeaveRequest[]>([]);
    const [allExams, setAllExams] = useState<Exam[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [leaveDateFilter, setLeaveDateFilter] = useState({ start: '', end: '' });
    const [examDateFilter, setExamDateFilter] = useState({ start: '', end: '' });

    // Employee State
    const [myLeave, setMyLeave] = useState<LeaveRequest[]>([]);
    const [myExams, setMyExams] = useState<ExamResult[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (isAdmin) {
                    const [leaves, exams, users] = await Promise.all([
                        api.getLeaveRequests(),
                        api.getExams(),
                        api.getUsers()
                    ]);
                    setAllLeave(leaves);
                    setAllExams(exams);
                    setAllUsers(users);
                } else if(currentUser) {
                    const [leaves, user] = await Promise.all([
                        api.getLeaveRequests(),
                        api.getUser(currentUser.id)
                    ]);
                    setMyLeave(leaves.filter(l => l.userId === currentUser.id));
                    setMyExams(user.examHistory);
                }
            } catch {
                // Add toast notification here
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isAdmin, currentUser]);

    // Chart styles and data processing
    const axisColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#e5e7eb' : '#1f2937'
    };

    const leaveStats = useMemo(() => {
        const approved = allLeave.filter(l => l.status === 'Approved');
        const totalDays = approved.reduce((acc, req) => acc + getLeaveDuration(req.startDate, req.endDate), 0);
        const byType = approved.reduce((acc, req) => {
            acc[req.leaveType] = (acc[req.leaveType] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        
        return {
            totalRequests: allLeave.length,
            pendingRequests: allLeave.filter(l => l.status === 'Pending').length,
            totalDays,
            byTypeChartData: Object.entries(byType).map(([name, value]) => ({name, value}))
        };
    }, [allLeave]);

    const leaveByMonthData = useMemo(() => {
        const months: { [key: string]: { days: number } } = {};
        allLeave.forEach(req => {
            if (req.status === 'Approved') {
                const month = new Date(req.startDate).toLocaleString('default', { month: 'short' });
                if (!months[month]) months[month] = { days: 0 };
                months[month].days += getLeaveDuration(req.startDate, req.endDate);
            }
        });
        return Object.entries(months).map(([name, values]) => ({ name, ...values }));
    }, [allLeave]);
    
    const detailedExamResults = useMemo(() => {
        const results: any[] = [];
        allExams.forEach(exam => {
            const participants = allUsers.filter(user => 
                exam.assignedTo.roles.includes(user.role) ||
                exam.assignedTo.departments.includes(user.department) ||
                exam.assignedTo.users.includes(user.id)
            );
            participants.forEach(user => {
                const progress = exam.userProgress?.[user.id];
                results.push({
                    examTitle: exam.title,
                    participantName: user.name,
                    status: progress?.status || 'Pending',
                    score: progress?.score ?? '-',
                    completionDate: progress?.completedDate ? new Date(progress.completedDate).toLocaleDateString() : '-'
                });
            });
        });
        return results;
    }, [allExams, allUsers]);

    const examStats = useMemo(() => {
        const outcomes = { Passed: 0, Failed: 0, Pending: 0 };
        let totalScore = 0;
        let completedCount = 0;

        detailedExamResults.forEach(result => {
            if (result.status in outcomes) outcomes[result.status as keyof typeof outcomes]++;
            if (result.status !== 'Pending' && typeof result.score === 'number') {
                totalScore += result.score;
                completedCount++;
            }
        });
        
        const averageScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
        const passRate = completedCount > 0 ? Math.round((outcomes.Passed / completedCount) * 100) : 0;
        
        const outcomesChartData = Object.entries(outcomes).map(([name, value]) => ({name, value}));
        
        const avgScoreByExam = allExams.map(exam => {
            let examTotalScore = 0;
            let examCompletedCount = 0;
            if (exam.userProgress) {
                Object.values(exam.userProgress).forEach(p => {
                    if (p.status !== 'Pending') {
                        examTotalScore += p.score;
                        examCompletedCount++;
                    }
                });
            }
            return {
                name: exam.title,
                'Average Score': examCompletedCount > 0 ? Math.round(examTotalScore / examCompletedCount) : 0
            };
        });

        return { passRate, averageScore, outcomesChartData, avgScoreByExam };
    }, [detailedExamResults, allExams]);


    const handleExport = (format: 'csv' | 'pdf', type: 'leave' | 'exams') => {
        if (type === 'leave') {
            let filteredLeave = allLeave;
            if (leaveDateFilter.start && leaveDateFilter.end) {
                const startDate = new Date(leaveDateFilter.start);
                const endDate = new Date(leaveDateFilter.end);
                endDate.setHours(23, 59, 59, 999);
                filteredLeave = allLeave.filter(req => {
                    const reqDate = new Date(req.startDate);
                    return reqDate >= startDate && reqDate <= endDate;
                });
            }
            
            const dataToExport = filteredLeave.map(req => ({
                employee: req.userName,
                type: req.leaveType,
                startDate: req.startDate,
                endDate: req.endDate,
                durationDays: getLeaveDuration(req.startDate, req.endDate),
                status: req.status,
                reason: req.reason
            }));
            const columns = [
                { header: 'Employee', dataKey: 'employee' },
                { header: 'Type', dataKey: 'type' },
                { header: 'Start Date', dataKey: 'startDate' },
                { header: 'End Date', dataKey: 'endDate' },
                { header: 'Duration (Days)', dataKey: 'durationDays' },
                { header: 'Status', dataKey: 'status' },
                { header: 'Reason', dataKey: 'reason' },
            ];
            if (format === 'csv') exportToCSV(dataToExport, 'leave_report');
            else exportToPDF(columns, dataToExport, 'leave_report', 'Leave Requests Report');
        } else { // Exams
            let filteredExams = detailedExamResults;
            if (examDateFilter.start && examDateFilter.end) {
                const startDate = new Date(examDateFilter.start);
                const endDate = new Date(examDateFilter.end);
                endDate.setHours(23, 59, 59, 999);
                filteredExams = detailedExamResults.filter(result => {
                    if (result.completionDate === '-') return false;
                    const completionDate = new Date(result.completionDate);
                    return completionDate >= startDate && completionDate <= endDate;
                });
            }

            const columns = [
                { header: 'Exam Title', dataKey: 'examTitle' },
                { header: 'Participant', dataKey: 'participantName' },
                { header: 'Status', dataKey: 'status' },
                { header: 'Score', dataKey: 'score' },
                { header: 'Completion Date', dataKey: 'completionDate' },
            ];
            if (format === 'csv') exportToCSV(filteredExams, 'exam_results_report');
            else exportToPDF(columns, filteredExams, 'exam_results_report', 'Exam Results Report');
        }
    };

    const renderAdminReports = () => (
        <>
            <div className="border-b border-gray-300/50 dark:border-white/10 mb-6">
                <div className="flex items-center gap-2" role="tablist">
                    <button onClick={() => setAdminTab('Leave')} role="tab" className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${adminTab === 'Leave' ? 'border-emerald-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>Leave Analytics</button>
                    <button onClick={() => setAdminTab('Exams')} role="tab" className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${adminTab === 'Exams' ? 'border-emerald-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>Exam Analytics</button>
                </div>
            </div>

            {adminTab === 'Leave' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Approved Days" value={leaveStats.totalDays} icon={<CalendarIcon className="w-6 h-6 text-emerald-400"/>} />
                        <StatCard title="Total Requests" value={leaveStats.totalRequests} icon={<CalendarIcon className="w-6 h-6 text-green-400"/>} />
                        <StatCard title="Pending Requests" value={leaveStats.pendingRequests} icon={<CalendarIcon className="w-6 h-6 text-yellow-400"/>} />
                    </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GlassCard>
                             <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Leave by Type</h3>
                             <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={leaveStats.byTypeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                         {leaveStats.byTypeChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={LEAVE_TYPE_COLORS[index % LEAVE_TYPE_COLORS.length]} />
                                         ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{color: axisColor}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </GlassCard>
                        <GlassCard>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Approved Leave by Month</h3>
                             <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={leaveByMonthData}>
                                    <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
                                    <YAxis stroke={axisColor} fontSize={12} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                                    <Bar dataKey="days" fill="#14b8a6" name="Approved Days"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    </div>
                     <GlassCard>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">All Leave Requests</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <input type="date" name="start" value={leaveDateFilter.start} onChange={(e) => setLeaveDateFilter(p => ({...p, start: e.target.value}))} className="bg-white/10 dark:bg-black/40 border border-gray-300/50 dark:border-white/20 rounded-md px-2 py-1 text-xs text-gray-800 dark:text-white"/>
                                <input type="date" name="end" value={leaveDateFilter.end} onChange={(e) => setLeaveDateFilter(p => ({...p, end: e.target.value}))} className="bg-white/10 dark:bg-black/40 border border-gray-300/50 dark:border-white/20 rounded-md px-2 py-1 text-xs text-gray-800 dark:text-white"/>
                                <button onClick={() => setLeaveDateFilter({start: '', end: ''})} className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md">Clear</button>
                                <button onClick={() => handleExport('csv', 'leave')} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 rounded-lg text-xs font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"><DownloadIcon className="w-4 h-4" /> CSV</button>
                                <button onClick={() => handleExport('pdf', 'leave')} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 rounded-lg text-xs font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"><DownloadIcon className="w-4 h-4" /> PDF</button>
                            </div>
                        </div>
                         <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left text-sm">
                                <thead><tr className="border-b border-gray-300/50 dark:border-white/10"><th className="p-2">Employee</th><th className="p-2">Type</th><th className="p-2">Dates</th><th className="p-2">Status</th></tr></thead>
                                <tbody>{allLeave.map(req => <tr key={req.id} className="border-b border-gray-300/20 dark:border-white/5 align-middle"><td className="p-2">{req.userName}</td><td className="p-2">{req.leaveType}</td><td className="p-2">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td><td className="p-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${req.status === 'Approved' ? 'bg-green-500/20 text-green-300' : req.status === 'Rejected' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{req.status}</span></td></tr>)}</tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            )}
             {adminTab === 'Exams' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Overall Pass Rate" value={`${examStats.passRate}%`} icon={<CheckCircleIcon className="w-6 h-6 text-green-400"/>} />
                        <StatCard title="Average Score" value={`${examStats.averageScore}%`} icon={<BookOpenIcon className="w-6 h-6 text-green-400"/>} />
                        <StatCard title="Total Submissions" value={detailedExamResults.filter(r => r.status !== 'Pending').length} icon={<BookOpenIcon className="w-6 h-6 text-cyan-400"/>} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GlassCard>
                             <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Exam Outcomes</h3>
                             <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={examStats.outcomesChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                         {examStats.outcomesChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={EXAM_OUTCOME_COLORS[index % EXAM_OUTCOME_COLORS.length]} />
                                         ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{color: axisColor}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </GlassCard>
                        <GlassCard>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Average Score by Exam</h3>
                             <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={examStats.avgScoreByExam} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                                    <XAxis type="number" domain={[0, 100]} stroke={axisColor} fontSize={12} />
                                    <YAxis type="category" dataKey="name" stroke={axisColor} fontSize={10} width={80} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                                    <Bar dataKey="Average Score" fill="#34d399" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </GlassCard>
                    </div>
                     <GlassCard>
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">All Exam Results</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <input type="date" name="start" value={examDateFilter.start} onChange={(e) => setExamDateFilter(p => ({...p, start: e.target.value}))} className="bg-white/10 dark:bg-black/40 border border-gray-300/50 dark:border-white/20 rounded-md px-2 py-1 text-xs text-gray-800 dark:text-white"/>
                                <input type="date" name="end" value={examDateFilter.end} onChange={(e) => setExamDateFilter(p => ({...p, end: e.target.value}))} className="bg-white/10 dark:bg-black/40 border border-gray-300/50 dark:border-white/20 rounded-md px-2 py-1 text-xs text-gray-800 dark:text-white"/>
                                <button onClick={() => setExamDateFilter({start: '', end: ''})} className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md">Clear</button>
                                <button onClick={() => handleExport('csv', 'exams')} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 rounded-lg text-xs font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"><DownloadIcon className="w-4 h-4" /> CSV</button>
                                <button onClick={() => handleExport('pdf', 'exams')} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 rounded-lg text-xs font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"><DownloadIcon className="w-4 h-4" /> PDF</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                             <table className="w-full text-left text-sm">
                                <thead><tr className="border-b border-gray-300/50 dark:border-white/10"><th className="p-2">Exam</th><th className="p-2">Participant</th><th className="p-2">Status</th><th className="p-2">Score</th></tr></thead>
                                <tbody>{detailedExamResults.map((res, i) => <tr key={i} className="border-b border-gray-300/20 dark:border-white/5 align-middle"><td className="p-2">{res.examTitle}</td><td className="p-2">{res.participantName}</td><td className="p-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${res.status === 'Passed' ? 'bg-green-500/20 text-green-300' : res.status === 'Failed' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{res.status}</span></td><td className="p-2 font-semibold">{res.score}{res.status !== 'Pending' && '%'}</td></tr>)}</tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            )}
        </>
    );
    
    const renderEmployeeReports = () => (
        <div className="space-y-6">
            <GlassCard>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">My Leave History</h3>
                {myLeave.length > 0 ? (
                    <ul className="space-y-2">
                        {myLeave.map(req => (
                            <li key={req.id} className="p-3 bg-gray-200/50 dark:bg-white/5 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{req.leaveType} Leave</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${req.status === 'Approved' ? 'bg-green-500/20 text-green-300' : req.status === 'Rejected' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{req.status}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center text-gray-500 dark:text-gray-400 py-4">No leave history found.</p>}
            </GlassCard>
             <GlassCard>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">My Exam History</h3>
                 {myExams.length > 0 ? (
                    <ul className="space-y-2">
                        {myExams.map(exam => (
                            <li key={exam.id} className="p-3 bg-gray-200/50 dark:bg-white/5 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{exam.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{exam.status === 'Pending' ? 'Pending' : `Completed on ${new Date(exam.date).toLocaleDateString()}`}</p>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 mr-2 text-xs font-semibold rounded-full ${exam.status === 'Passed' ? 'bg-green-500/20 text-green-300' : exam.status === 'Failed' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{exam.status}</span>
                                    {exam.status !== 'Pending' && <span className="font-bold text-gray-900 dark:text-white">{exam.score}%</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                 ) : <p className="text-center text-gray-500 dark:text-gray-400 py-4">No exam history found.</p>}
            </GlassCard>
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeInUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isAdmin ? 'View insights into company-wide HR metrics.' : 'Review your personal HR records.'}
                    </p>
                </div>
            </div>
            
            {loading ? <div className="text-center text-gray-500 dark:text-gray-400">Loading reports...</div> : (isAdmin ? renderAdminReports() : renderEmployeeReports())}
        </div>
    );
};

export default Reports;