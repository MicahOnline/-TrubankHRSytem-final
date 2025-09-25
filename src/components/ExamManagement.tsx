import React, { useState, useEffect, useMemo } from 'react';
import { Exam, User } from '../../types';
import * as api from '../utils/api';
import { SearchIcon, PlusIcon, ClockIcon, BookOpenIcon, CheckCircleIcon } from '../../components/icons';
import CreateExamModal from './CreateExamModal';
import ExamDetailsDrawer from './ExamDetailsDrawer';
import ConfirmationModal from './ConfirmationModal';

interface ExamManagementProps {
    addToast: (message: string, type: 'success' | 'error') => void;
}

const ExamManagement: React.FC<ExamManagementProps> = ({ addToast }) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsData, usersData] = await Promise.all([
                    api.getExams(),
                    api.getUsers()
                ]);
                setExams(examsData);
                setUsers(usersData);
            } catch {
                addToast('Failed to load exam data.', 'error');
            }
        };
        fetchData();
    }, [addToast]);

    const filteredExams = useMemo(() => {
        return exams.filter(exam => 
            exam.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            exam.topic.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [exams, searchTerm]);
    
    const getExamProgress = (exam: Exam) => {
        const assignedUserIds = new Set<number>();
        users.forEach(user => {
            if (
                exam.assignedTo.roles.includes(user.role) ||
                exam.assignedTo.departments.includes(user.department) ||
                exam.assignedTo.users.includes(user.id)
            ) {
                assignedUserIds.add(user.id);
            }
        });
        const totalAssigned = assignedUserIds.size;
        const completedCount = exam.userProgress ? Object.keys(exam.userProgress).length : 0;
        const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
        return { totalAssigned, completedCount, completionRate };
    };

    const handleExamCreated = (newExam: Exam) => {
        setExams(prev => [newExam, ...prev]);
    };
    
    const handleViewDetails = (exam: Exam) => {
        setSelectedExam(exam);
        setIsDetailsDrawerOpen(true);
    };
    
    const handleDeleteExam = async () => {
        if (!examToDelete) return;
        try {
            await api.deleteExam(examToDelete.id);
            setExams(prev => prev.filter(e => e.id !== examToDelete.id));
            addToast(`Exam "${examToDelete.title}" deleted.`, 'success');
        } catch {
            addToast('Failed to delete exam.', 'error');
        } finally {
            setExamToDelete(null);
        }
    };
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

    return (
        <div className="space-y-6 animate-fadeInUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Exam Management</h1>
                    <p className="text-gray-400 mt-1">Create, assign, and monitor exams.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105">
                    <PlusIcon className="w-5 h-5"/> New Exam
                </button>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="relative mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <input type="text" placeholder="Search by title or topic..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                </div>
                <div className="space-y-3">
                    {filteredExams.map(exam => {
                        const { completionRate } = getExamProgress(exam);
                        return (
                            <div key={exam.id} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-emerald-400/50 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{exam.title}</h3>
                                        <p className="text-sm text-gray-400">{exam.topic}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleViewDetails(exam)} className="text-xs font-semibold px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-white hover:bg-white/20">View Details</button>
                                        <button onClick={() => setExamToDelete(exam)} className="text-xs font-semibold px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-md text-red-300 hover:bg-red-500/20">Delete</button>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-300">
                                    <div className="flex items-center gap-2"><BookOpenIcon className="w-4 h-4 text-emerald-300"/>{exam.questions.length} Questions</div>
                                    <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-emerald-300"/>{exam.duration} mins</div>
                                    <div className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4 text-emerald-300"/>Due: {formatDate(exam.dueDate)}</div>
                                </div>
                                <div className="mt-3">
                                    <div className="w-full bg-black/40 rounded-full h-2.5">
                                        <div className="bg-emerald-400 h-2.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
                                    </div>
                                    <p className="text-xs text-right text-gray-400 mt-1">{completionRate}% Completed</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <CreateExamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} addToast={addToast} onExamCreated={handleExamCreated}/>
            <ExamDetailsDrawer exam={selectedExam} isOpen={isDetailsDrawerOpen} onClose={() => setIsDetailsDrawerOpen(false)} />
            {examToDelete && (
                <ConfirmationModal 
                    isOpen={!!examToDelete}
                    onClose={() => setExamToDelete(null)}
                    onConfirm={handleDeleteExam}
                    title="Delete Exam"
                    message={`Are you sure you want to delete the exam "${examToDelete.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                />
            )}
        </div>
    );
};

export default ExamManagement;