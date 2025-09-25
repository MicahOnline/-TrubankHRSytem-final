import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';
import { ArrowUpIcon, UsersIcon, AlertTriangleIcon, ClockIcon, TrendingUpIcon, CalendarIcon, BotIcon, TrendingDownIcon } from './icons';
import { useAuth } from '../src/contexts/AuthContext';
import { LeaveRequest, User, AttritionRiskResult } from '../types';
import * as api from '../src/utils/api';
import { getLeaveTrendAnalysis, getAttritionRiskAnalysis } from '../services/geminiService';
import { useTheme } from '../src/contexts/ThemeContext';
import DashboardWidgets from './DashboardWidgets';
import AdminCalendar from '../src/components/AdminCalendar';
import { getLeaveDuration } from '../src/utils/export';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 transition-all duration-300 ease-in-out hover:border-emerald-400/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 ${className}`}>
        {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.ReactNode; }> = ({ title, value, change, icon }) => (
    <GlassCard>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                 <div className="flex items-center text-sm text-green-500 dark:text-green-400 mt-2">
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                    <span>{change}</span>
                </div>
            </div>
            <div className="bg-gray-200 dark:bg-gradient-to-br dark:from-white/20 dark:to-transparent p-3 rounded-full">
                {icon}
            </div>
        </div>
    </GlassCard>
);

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const { theme } = useTheme();

    const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [leaveAnalysis, setLeaveAnalysis] = useState('');
    const [isAnalyzingLeave, setIsAnalyzingLeave] = useState(false);
    const [leaveAnalysisError, setLeaveAnalysisError] = useState('');
    
    // New state for Attrition Risk Analysis
    const [attritionRiskResults, setAttritionRiskResults] = useState<AttritionRiskResult[]>([]);
    const [isAnalyzingAttrition, setIsAnalyzingAttrition] = useState(false);
    const [attritionAnalysisError, setAttritionAnalysisError] = useState('');


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leaveData, usersData] = await Promise.all([
                    api.getLeaveRequests(),
                    api.getUsers()
                ]);
                setAllLeaveRequests(leaveData);
                setAllUsers(usersData);
            } catch (e) {
                console.error("Failed to fetch dashboard data", e);
            }
        };
        fetchData();
    }, []);
    
    const axisColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '0.5rem',
        color: theme === 'dark' ? '#e5e7eb' : '#1f2937'
    };
    
    const hiringPipelineData = useMemo(() => {
        const applicants = allUsers.filter(u => u.role === 'Applicant');
        const totalApplicants = applicants.length;
        const completedExam = applicants.filter(u => u.examHistory.some(e => e.status !== 'Pending')).length;
        const passedExam = applicants.filter(u => u.examHistory.some(e => e.status === 'Passed')).length;
        const hired = Math.max(0, passedExam - 1); // Mock data for hired

        return [
            { name: 'Total Applicants', value: totalApplicants, fill: '#10b981' },
            { name: 'Completed Exam', value: completedExam, fill: '#34d399' },
            { name: 'Passed Exam', value: passedExam, fill: '#6ee7b7' },
            { name: 'Hired', value: hired, fill: '#a7f3d0' },
        ];
    }, [allUsers]);

    const leaveByMonthData = useMemo(() => {
        const months: { [key: string]: { vacationDays: number; sickDays: number } } = {};
        
        allLeaveRequests.forEach(req => {
            if (req.status === 'Approved') {
                const month = new Date(req.startDate).toLocaleString('default', { year: '2-digit', month: 'short' });
                if (!months[month]) {
                    months[month] = { vacationDays: 0, sickDays: 0 };
                }
                const duration = getLeaveDuration(req.startDate, req.endDate);
                if (req.leaveType === 'Vacation Leave') {
                    months[month].vacationDays += duration;
                } else if (req.leaveType === 'Sick Leave') {
                    months[month].sickDays += duration;
                }
            }
        });
        
        return Object.entries(months).map(([name, values]) => ({ month: name, ...values }));
    }, [allLeaveRequests]);

    const handleGenerateLeaveAnalysis = async () => {
        setIsAnalyzingLeave(true);
        setLeaveAnalysisError('');
        setLeaveAnalysis('');
        try {
            const analysis = await getLeaveTrendAnalysis(leaveByMonthData);
            setLeaveAnalysis(analysis);
        } catch (e) {
            setLeaveAnalysisError("Failed to generate AI analysis. Please try again later.");
        } finally {
            setIsAnalyzingLeave(false);
        }
    };
    
    const handleRunAttritionAnalysis = async () => {
        setIsAnalyzingAttrition(true);
        setAttritionAnalysisError('');
        setAttritionRiskResults([]);
        try {
            const results = await getAttritionRiskAnalysis(allUsers, allLeaveRequests);
            setAttritionRiskResults(results);
        } catch (e) {
            setAttritionAnalysisError("Failed to run attrition analysis. Please try again.");
        } finally {
            setIsAnalyzingAttrition(false);
        }
    };
    
    const getRiskBadge = (level: 'High' | 'Medium' | 'Low') => {
        switch(level) {
            case 'High': return 'bg-red-500/30 text-red-300';
            case 'Medium': return 'bg-yellow-500/30 text-yellow-300';
            case 'Low': return 'bg-green-500/30 text-green-300';
        }
    };


    return (
        <div className="space-y-8 animate-fadeInUp">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name.split(' ')[0]}!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Here's your HR Command Center overview.</p>
                </div>
                <div className="w-full md:w-auto">
                    <DashboardWidgets />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Employees" value="512" change="+2.5% this month" icon={<UsersIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />} />
                <StatCard title="Attrition Risk" value="8.2%" change="-0.5% this month" icon={<AlertTriangleIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />} />
                <StatCard title="Pending Approvals" value="12" change="3 new today" icon={<ClockIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUpIcon className="w-6 h-6 text-emerald-400 dark:text-emerald-300"/>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Hiring Pipeline</h3>
                    </div>
                    <figure role="figure" aria-label="Bar chart showing hiring pipeline stages from total applicants to hired.">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={hiringPipelineData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={axisColor} strokeOpacity={0.2} />
                                <XAxis type="number" stroke={axisColor} fontSize={12} />
                                <YAxis type="category" dataKey="name" stroke={axisColor} fontSize={12} width={100} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(16, 185, 129, 0.1)'}} />
                                <Bar dataKey="value" name="Count" barSize={25} radius={[0, 4, 4, 0]}>
                                    {hiringPipelineData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </figure>
                </GlassCard>
                 <GlassCard>
                    <div className="flex items-center gap-3 mb-4">
                        <CalendarIcon className="w-6 h-6 text-teal-400 dark:text-teal-300"/>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Leave Trends</h3>
                    </div>
                    <figure role="figure" aria-label="Stacked bar chart showing vacation and sick days per month.">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={leaveByMonthData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={axisColor} strokeOpacity={0.2} />
                                <XAxis dataKey="month" stroke={axisColor} fontSize={12} />
                                <YAxis stroke={axisColor} fontSize={12} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{fill: 'rgba(16, 185, 129, 0.1)'}} />
                                <Legend wrapperStyle={{fontSize: '12px', color: axisColor}}/>
                                <Bar dataKey="vacationDays" name="Vacation" stackId="a" fill="#14b8a6" barSize={30} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="sickDays" name="Sick" stackId="a" fill="#2dd4bf" barSize={30} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </figure>
                     <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10" aria-live="polite">
                        {isAnalyzingLeave ? (
                             <div className="flex items-center justify-center flex-col text-center">
                                <div className="w-5 h-5 border-2 border-gray-400/50 dark:border-white/50 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">AI is analyzing leave trends...</p>
                            </div>
                        ) : leaveAnalysis ? (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">AI Insights:</h4>
                                <div className="text-gray-700 dark:text-gray-300 text-sm space-y-1 whitespace-pre-wrap p-3 bg-gray-200/50 dark:bg-white/5 rounded-md border border-gray-300/50 dark:border-white/10">{leaveAnalysis}</div>
                            </div>
                        ) : (
                            <div className="text-center">
                                {leaveAnalysisError && <p className="text-red-400 text-sm mb-2">{leaveAnalysisError}</p>}
                                <button onClick={handleGenerateLeaveAnalysis} className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/10 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 rounded-lg text-xs font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                                    <BotIcon className="w-4 h-4 text-emerald-400" />
                                    Generate AI Analysis
                                </button>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
            
            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <TrendingDownIcon className="w-6 h-6 text-red-400 dark:text-red-300"/>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Attrition Risk Analysis</h3>
                </div>
                <div aria-live="polite">
                    {isAnalyzingAttrition ? (
                        <div className="flex items-center justify-center flex-col text-center min-h-[200px]">
                            <div className="w-8 h-8 border-4 border-gray-400/50 dark:border-white/50 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">AI is analyzing employee data for attrition risks...</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">This may take a moment.</p>
                        </div>
                    ) : attritionRiskResults.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                             {attritionRiskResults.slice(0, 5).map(result => {
                                const user = allUsers.find(u => u.id === result.userId);
                                if (!user) return null;
                                return (
                                    <div key={user.id} className="bg-gray-200/50 dark:bg-white/5 p-3 rounded-lg border border-gray-300/50 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full"/>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{user.department}</p>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4">
                                             <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{result.reason}"</p>
                                             <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getRiskBadge(result.riskLevel)}`}>{result.riskLevel} Risk</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center min-h-[200px] flex flex-col justify-center items-center">
                             {attritionAnalysisError ? (
                                <p className="text-red-400">{attritionAnalysisError}</p>
                             ) : (
                                <>
                                    <BotIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4"/>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">Run predictive analysis to identify employees at risk of leaving.</p>
                                </>
                             )}
                            <button onClick={handleRunAttritionAnalysis} className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/10 dark:bg-white/10 border border-gray-300/50 dark:border-white/20 rounded-lg font-semibold text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                                <BotIcon className="w-5 h-5 text-emerald-400" />
                                Run Analysis
                            </button>
                        </div>
                    )}
                </div>
            </GlassCard>

            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <CalendarIcon className="w-6 h-6 text-emerald-400 dark:text-emerald-300"/>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Team Leave & Reminders Calendar</h3>
                </div>
                <AdminCalendar leaveRequests={allLeaveRequests} />
            </GlassCard>
        </div>
    );
};

export default AdminDashboard;