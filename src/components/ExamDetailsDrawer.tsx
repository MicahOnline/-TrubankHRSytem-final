// FIX: Created ExamDetailsDrawer.tsx component.
// FIX: Completed component and added default export to resolve import and parsing errors.
import React, { useState, useEffect, useMemo } from 'react';
import { Exam, User, ExamStatus, Role } from '../../types';
import * as api from '../utils/api';
import { CloseIcon, UsersIcon, CheckCircleIcon, AlertTriangleIcon, UserIcon, BriefcaseIcon } from '../../components/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExamDetailsDrawerProps {
    exam: Exam | null;
    isOpen: boolean;
    onClose: () => void;
}

const ExamDetailsDrawer: React.FC<ExamDetailsDrawerProps> = ({ exam, isOpen, onClose }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        if (isOpen) {
            api.getUsers().then(setAllUsers).catch(console.error);
        }
    }, [isOpen]);

    const assignedUsers = useMemo(() => {
        if (!exam || !allUsers.length) return [];
        const userIds = new Set(exam.assignedTo.users);
        allUsers.forEach(user => {
            if (exam.assignedTo.roles.includes(user.role) || exam.assignedTo.departments.includes(user.department)) {
                userIds.add(user.id);
            }
        });
        return Array.from(userIds).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    }, [exam, allUsers]);

    const progressStats = useMemo(() => {
        if (!exam) return { data: [], total: 0 };
        const totalAssigned = assignedUsers.length;
        const stats = { Passed: 0, Failed: 0, Pending: 0 };
        
        assignedUsers.forEach(user => {
            const progress = exam.userProgress?.[user.id];
            if (progress) {
                stats[progress.status]++;
            } else {
                stats.Pending++;
            }
        });

        const data = [
            { name: 'Passed', value: stats.Passed },
            { name: 'Failed', value: stats.Failed },
            { name: 'Pending', value: stats.Pending },
        ].filter(d => d.value > 0);

        return { data, total: totalAssigned };
    }, [exam, assignedUsers]);

    const COLORS = ['#34d399', '#f87171', '#facc15'];

    if (!exam) return null;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="drawer-title"
                className={`fixed top-0 right-0 h-full w-full max-w-lg bg-black/50 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-white/10">
                        <div>
                            <h2 id="drawer-title" className="text-xl font-bold text-white">{exam.title}</h2>
                            <p className="text-sm text-gray-400">{exam.topic}</p>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close exam details">
                            <CloseIcon className="w-6 h-6 text-gray-300" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Progress Chart */}
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <h3 className="font-semibold text-white mb-2">Completion Status ({progressStats.total} assigned)</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={progressStats.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={(entry) => `${entry.name}: ${entry.value}`}>
                                        {progressStats.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.5rem' }} />
                                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Participant List */}
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                             <h3 className="font-semibold text-white mb-4">Participants</h3>
                             <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                                {assignedUsers.length > 0 ? assignedUsers.map(user => {
                                    const progress = exam.userProgress?.[user.id];
                                    const status = progress?.status || 'Pending';
                                    const getStatusIcon = (s: ExamStatus) => {
                                        switch(s) {
                                            case 'Passed': return <CheckCircleIcon className="w-5 h-5 text-green-400"/>;
                                            case 'Failed': return <AlertTriangleIcon className="w-5 h-5 text-red-400"/>;
                                            default: return <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />;
                                        }
                                    };
                                    return (
                                        <div key={user.id} className="flex items-center justify-between bg-black/20 p-2 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                             <div className="flex items-center gap-2 w-1/3">
                                                {status === 'Pending' ? (
                                                    (() => {
                                                        const totalQuestions = exam.questions.length;
                                                        const answered = progress?.answeredQuestions || 0;
                                                        const progressPercent = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;
                                                        return (
                                                            <>
                                                                <div className="w-full bg-gray-700 rounded-full h-2" title={`${answered} / ${totalQuestions} answered`}>
                                                                    <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                                                </div>
                                                                <span className="text-xs font-mono text-gray-300 w-10 text-right">{progressPercent}%</span>
                                                            </>
                                                        );
                                                    })()
                                                ) : (
                                                    <>
                                                        <div className="flex-grow text-right">
                                                            {progress && <span className="text-sm font-semibold">{progress.score}%</span>}
                                                        </div>
                                                        <div title={status} className="w-5">{getStatusIcon(status)}</div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : <p className="text-sm text-center text-gray-400">No users assigned to this exam.</p>}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExamDetailsDrawer;