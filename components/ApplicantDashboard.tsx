import React, { useMemo } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { ExamResult } from '../types';
import { BookOpenIcon, PlayIcon } from './icons';
import OnboardingChatbot from './OnboardingChatbot';

interface ApplicantDashboardProps {
  onStartExam: (examId: string) => void;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 transition-all duration-300 ease-in-out ${className}`}>
        {children}
    </div>
);

const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({ onStartExam }) => {
    const { user } = useAuth();

    const pendingExams = useMemo(() => {
        return user?.examHistory.filter(e => e.status === 'Pending') || [];
    }, [user?.examHistory]);

    return (
        <div className="space-y-8 animate-fadeInUp">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name.split(' ')[0]}!</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Here are your next steps in the application process.</p>
            </div>

            <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                    <BookOpenIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Your Assigned Exams</h3>
                </div>
                {pendingExams.length > 0 ? (
                    <ul className="space-y-3">
                        {pendingExams.map((exam: ExamResult) => (
                            <li key={exam.id} className="bg-gray-200/50 dark:bg-white/5 p-4 rounded-lg border border-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center transition-colors hover:bg-gray-300/50 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/20">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{exam.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">This exam is required to proceed with your application.</p>
                                </div>
                                <div className="mt-3 sm:mt-0">
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
                     <div className="text-center py-8">
                        <BookOpenIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-white/10" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Pending Exams</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">You have completed all required exams. We will be in touch shortly.</p>
                    </div>
                )}
            </GlassCard>
            
            <OnboardingChatbot />
        </div>
    );
};

export default ApplicantDashboard;