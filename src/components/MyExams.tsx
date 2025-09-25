import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ExamResult, ExamStatus } from '../../types';
import { BookOpenIcon, PlayIcon, ClipboardCheckIcon } from '../../components/icons';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

interface MyExamsProps {
  onStartExam: (examId: string) => void;
}

const MyExams: React.FC<MyExamsProps> = ({ onStartExam }) => {
    const { user } = useAuth();

    const { pendingExams, completedExams } = useMemo(() => {
        if (!user?.examHistory) return { pendingExams: [], completedExams: [] };
        const pending = user.examHistory.filter(e => e.status === 'Pending');
        const completed = user.examHistory.filter(e => e.status !== 'Pending');
        completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { pendingExams: pending, completedExams: completed };
    }, [user?.examHistory]);

    const getExamStatusBadge = (status: ExamStatus) => {
        switch (status) {
            case 'Passed': return 'bg-green-500/20 text-green-300';
            case 'Failed': return 'bg-red-500/20 text-red-300';
            case 'Pending': return 'bg-yellow-500/20 text-yellow-300';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return (
        <div className="space-y-8 animate-fadeInUp">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Exams</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">View your assigned exams and track your progress.</p>
            </div>
            
            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <BookOpenIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Pending Exams</h3>
                </div>
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
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400 p-4">
                        You have no pending exams. Great job!
                    </p>
                )}
            </GlassCard>

            <GlassCard>
                 <div className="flex items-center gap-3 mb-4">
                    <ClipboardCheckIcon className="w-6 h-6 text-green-500 dark:text-green-300" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Completed Exams</h3>
                </div>
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
                     <p className="text-sm text-center text-gray-600 dark:text-gray-400 p-4">
                        Your completed exams will appear here.
                    </p>
                 )}
            </GlassCard>
        </div>
    );
};

export default MyExams;