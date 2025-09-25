// FIX: Created CreateExamModal.tsx component.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Exam, Question, Role, Assignment, User } from '../../types';
import { generateExamQuestions, extractQuestionsFromPdf } from '../../services/geminiService';
import * as api from '../utils/api';
import { UploadIcon, PlusIcon, TrashIcon, GripVerticalIcon, SearchIcon, CloseIcon, UserCheckIcon, UsersIcon, BriefcaseIcon, BotIcon, ArrowUpIcon } from '../../components/icons';

interface CreateExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    addToast: (message: string, type: 'success' | 'error') => void;
    onExamCreated: (newExam: Exam) => void;
}

const CreateExamModal: React.FC<CreateExamModalProps> = ({ isOpen, onClose, addToast, onExamCreated }) => {
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
    const [assignedTo, setAssignedTo] = useState<Assignment>({ roles: [], departments: [], users: [] });
    const [scheduledDate, setScheduledDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const [isAssignerOpen, setIsAssignerOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchAssign, setSearchAssign] = useState('');
    const assignerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const assignerButtonRef = useRef<HTMLDivElement>(null);


    // Drag and drop state
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    
    useEffect(() => {
        const fetchUsers = async () => {
            if(isOpen) {
               try {
                 const users = await api.getUsers();
                 setAllUsers(users);
               } catch {
                 addToast('Could not load users for assignment.', 'error');
               }
            }
        };
        fetchUsers();
    }, [isOpen, addToast]);
    
    // Close assigner popover on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                assignerRef.current && 
                !assignerRef.current.contains(event.target as Node) &&
                assignerButtonRef.current &&
                !assignerButtonRef.current.contains(event.target as Node)
            ) {
                setIsAssignerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [assignerRef]);

    const handleGenerateQuestions = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic to generate questions.');
            return;
        }
        setError('');
        setIsGenerating(true);
        try {
            const generated = await generateExamQuestions(topic, numberOfQuestions);
            setQuestions(generated);
            addToast('Questions generated successfully!', 'success');
        } catch (err) {
            addToast('Failed to generate questions. Please try again.', 'error');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const resetInput = () => {
            if (event.target) event.target.value = '';
        };

        setIsUploading(true);
        setError('');

        const reader = new FileReader();

        const processFile = async () => {
            try {
                if (file.name.endsWith('.pdf')) {
                    reader.onload = async (e) => {
                        try {
                            const dataUrl = e.target?.result as string;
                            const base64Content = dataUrl.split(',')[1];
                            if (!base64Content) throw new Error("Could not read PDF file content.");
                            
                            addToast('Extracting questions with AI...', 'success');
                            const extractedQuestions = await extractQuestionsFromPdf(base64Content);
                            
                            if (extractedQuestions.length === 0) {
                                addToast('No questions found in the PDF.', 'error');
                            } else {
                                setQuestions(extractedQuestions);
                                addToast(`${extractedQuestions.length} questions extracted!`, 'success');
                            }
                        } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : "PDF processing failed.";
                            addToast(errorMessage, 'error');
                        } finally {
                            setIsUploading(false);
                            resetInput();
                        }
                    };
                    reader.readAsDataURL(file);
                } else if (file.name.endsWith('.json') || file.name.endsWith('.csv')) {
                    reader.onload = (e) => {
                        try {
                            const content = e.target?.result as string;
                            let parsedQuestions: Omit<Question, 'id'>[] = [];
                            if (file.name.endsWith('.json')) {
                                const data = JSON.parse(content);
                                if (!Array.isArray(data)) throw new Error("JSON must be an array.");
                                parsedQuestions = data.map((q: any) => ({
                                    text: q.text || '',
                                    options: Array.isArray(q.options) ? q.options : [],
                                    correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
                                }));
                            } else { // .csv
                                parsedQuestions = content.split('\n').filter(row => row.trim() !== '').map((row, i) => {
                                    const columns = row.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
                                    if (columns.length < 3) throw new Error(`Invalid CSV format on row ${i + 1}: requires at least a question, one option, and an index.`);
                                    const text = columns[0];
                                    const correctAnswerIndex = parseInt(columns[columns.length - 1], 10);
                                    const options = columns.slice(1, -1);
                                    if (isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
                                        throw new Error(`Invalid correct answer index on row ${i + 1}.`);
                                    }
                                    return { text, options, correctAnswerIndex };
                                });
                            }
                            setQuestions(parsedQuestions);
                            addToast('Questions uploaded successfully!', 'success');
                        } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : "File parsing failed.";
                            addToast(`Failed to parse file: ${errorMessage}`, 'error');
                        } finally {
                            setIsUploading(false);
                            resetInput();
                        }
                    };
                    reader.readAsText(file);
                } else {
                    throw new Error("Unsupported file type. Please use .json, .csv, or .pdf");
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                addToast(errorMessage, 'error');
                setIsUploading(false);
                resetInput();
            }
        };
        
        processFile();
    };

    const handleQuestionUpdate = (index: number, updatedQuestion: Partial<Omit<Question, 'id'>>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updatedQuestion };
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex].options = newOptions;
        setQuestions(newQuestions);
    };

    const handleDeleteQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleAddQuestion = () => {
        setQuestions([...questions, {
            text: '',
            options: ['', '', '', ''],
            correctAnswerIndex: 0
        }]);
    };
    
    const handleAddOption = (qIndex: number) => {
        const newQuestions = [...questions];
        const question = { ...newQuestions[qIndex] };
        question.options = [...question.options, ''];
        newQuestions[qIndex] = question;
        setQuestions(newQuestions);
    };

    const handleRemoveOption = (qIndex: number, oIndex: number) => {
        const newQuestions = [...questions];
        const question = { ...newQuestions[qIndex] };
        if (question.options.length <= 2) {
            addToast('A question must have at least 2 options.', 'error');
            return;
        }
        const oldCorrectIndex = question.correctAnswerIndex;
        question.options = question.options.filter((_, i) => i !== oIndex);
        if (oIndex === oldCorrectIndex) {
            question.correctAnswerIndex = 0;
        } else if (oIndex < oldCorrectIndex) {
            question.correctAnswerIndex = oldCorrectIndex - 1;
        }
        newQuestions[qIndex] = question;
        setQuestions(newQuestions);
    };
    
     const moveQuestion = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= questions.length) return;
        const newQuestions = [...questions];
        const [movedItem] = newQuestions.splice(fromIndex, 1);
        newQuestions.splice(toIndex, 0, movedItem);
        setQuestions(newQuestions);
    };

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        setDraggingIndex(position);
    };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
        setDragOverIndex(position);
    };
    const handleDragLeave = () => setDragOverIndex(null);
    const handleDrop = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            moveQuestion(dragItem.current, dragOverItem.current);
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setDraggingIndex(null);
        setDragOverIndex(null);
    };
    const handleDragEnd = () => {
        setDraggingIndex(null);
        setDragOverIndex(null);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();


    const handleSubmit = async () => {
        if (!title.trim() || !topic.trim() || !scheduledDate || !startTime || !dueDate || duration <= 0 || questions.length === 0) {
            setError('Please fill all fields, set a valid schedule, and add questions before submitting.');
            return;
        }
        if (new Date(dueDate) < new Date(scheduledDate)) {
            setError('Due date cannot be before the start date.');
            return;
        }
        if(assignedTo.roles.length === 0 && assignedTo.departments.length === 0 && assignedTo.users.length === 0){
            setError('You must assign the exam to at least one role, department, or user.');
            return;
        }
        if (questions.some(q => !q.text.trim() || q.options.some(o => !o.trim()))) {
            setError('Please ensure all questions and options are filled out.');
            return;
        }
        setError('');
        setIsSubmitting(true);
        try {
            const newExamData = {
                title,
                topic,
                questions: questions.map((q, i) => ({ ...q, id: `q${i}` })),
                assignedTo,
                scheduledDate,
                dueDate,
                startTime,
                duration,
            };
            const newExam = await api.createExam(newExamData);
            onExamCreated(newExam);
            addToast('Exam created successfully!', 'success');
            onClose();
            // Reset state
            setTitle('');
            setTopic('');
            setQuestions([]);
            setScheduledDate('');
            setDueDate('');
            setStartTime('');
            setDuration(60);
            setAssignedTo({ roles: [], departments: [], users: [] });
        } catch (err) {
            addToast('Failed to create exam.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignmentChange = (type: 'roles' | 'departments' | 'users', value: Role | string | number) => {
        setAssignedTo(prev => {
            const currentValues = prev[type] as (Role | string | number)[];
            const isSelected = currentValues.includes(value);
            const newValues = isSelected ? currentValues.filter(v => v !== value) : [...currentValues, value];
            return { ...prev, [type]: newValues };
        });
    };

    const allRoles: Role[] = ['Admin', 'Employee', 'Applicant'];
    const allDepartments = useMemo(() => [...new Set(allUsers.map(u => u.department).filter(d => d !== 'N/A'))], [allUsers]);
    
    const usersByRole = useMemo(() => {
        return allUsers.reduce((acc, user) => {
            if (!acc[user.role]) {
                acc[user.role] = [];
            }
            acc[user.role].push(user);
            return acc;
        }, {} as { [key in Role]?: User[] });
    }, [allUsers]);

    const filteredAssignees = useMemo(() => {
        const search = searchAssign.toLowerCase();
        if (!search) {
            return {
                roles: allRoles,
                departments: allDepartments,
                usersByRole: usersByRole,
            };
        }

        const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
        const filteredUsersByRole = filteredUsers.reduce((acc, user) => {
             if (!acc[user.role]) {
                acc[user.role] = [];
            }
            acc[user.role].push(user);
            return acc;
        }, {} as { [key in Role]?: User[] });

        return {
            roles: allRoles.filter(r => r.toLowerCase().includes(search)),
            departments: allDepartments.filter(d => d.toLowerCase().includes(search)),
            usersByRole: filteredUsersByRole,
        };
    }, [searchAssign, allUsers, allDepartments, usersByRole]);
    
    const roleOrder: Role[] = ['Applicant', 'Employee', 'Admin'];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Exam">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <input type="text" placeholder="Exam Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="text" placeholder="Exam Topic (e.g., Cybersecurity Basics)" value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                
                <div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isGenerating} className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                            {isUploading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <UploadIcon className="w-5 h-5"/>
                                    Upload File
                                </>
                            )}
                        </button>
                        <span className="text-gray-400">OR</span>
                        <input type="number" value={numberOfQuestions} onChange={e => setNumberOfQuestions(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 bg-black/40 border border-white/20 rounded-lg px-2 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button onClick={handleGenerateQuestions} disabled={isGenerating || isUploading} className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {isGenerating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <BotIcon className="w-5 h-5"/>}
                            Generate with AI
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">Upload a .json, .csv, or .pdf file to add questions in bulk.</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".json,.csv,.pdf" className="hidden"/>

                {/* Advanced Assigner */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                    <div ref={assignerButtonRef} onClick={() => setIsAssignerOpen(!isAssignerOpen)} aria-haspopup="true" aria-expanded={isAssignerOpen} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white min-h-[44px] cursor-pointer flex flex-wrap gap-2 items-center">
                        {assignedTo.roles.length === 0 && assignedTo.departments.length === 0 && assignedTo.users.length === 0 && (
                            <span className="text-gray-400">Select roles, departments, or users...</span>
                        )}
                        {assignedTo.roles.map(role => (
                            <span key={role} className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded-full text-sm">
                                {role} <button aria-label={`Remove role ${role}`} onClick={(e) => {e.stopPropagation(); handleAssignmentChange('roles', role);}}><CloseIcon className="w-3 h-3 cursor-pointer hover:text-white"/></button>
                            </span>
                        ))}
                        {assignedTo.departments.map(dept => (
                            <span key={dept} className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/30 text-green-200 rounded-full text-sm">
                                {dept} <button aria-label={`Remove department ${dept}`} onClick={(e) => {e.stopPropagation(); handleAssignmentChange('departments', dept);}}><CloseIcon className="w-3 h-3 cursor-pointer hover:text-white"/></button>
                            </span>
                        ))}
                        {assignedTo.users.map(userId => {
                            const user = allUsers.find(u => u.id === userId);
                            return user ? (
                                <span key={userId} className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/30 text-yellow-200 rounded-full text-sm">
                                    {user.name} <button aria-label={`Remove user ${user.name}`} onClick={(e) => {e.stopPropagation(); handleAssignmentChange('users', userId);}}><CloseIcon className="w-3 h-3 cursor-pointer hover:text-white"/></button>
                                </span>
                            ) : null;
                        })}
                    </div>
                    {isAssignerOpen && (
                        <div ref={assignerRef} className="absolute z-10 top-full mt-2 w-full bg-gray-900 border border-white/20 rounded-lg shadow-xl overflow-hidden animate-scaleIn origin-top">
                            <div className="p-2 border-b border-white/10">
                                <div className="relative">
                                    <input type="text" placeholder="Search..." value={searchAssign} onChange={e => setSearchAssign(e.target.value)} className="w-full bg-black/40 border-white/10 border rounded-md pl-8 pr-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                    <SearchIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"/>
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {/* Roles */}
                                {filteredAssignees.roles.length > 0 && <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400">Roles (Assign to all)</div>}
                                {filteredAssignees.roles.map(role => (
                                    <label key={role} className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/10 cursor-pointer">
                                        <input type="checkbox" checked={assignedTo.roles.includes(role)} onChange={() => handleAssignmentChange('roles', role)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600" />
                                        <span className="text-sm text-gray-200">{role}</span>
                                    </label>
                                ))}
                                {/* Departments */}
                                {filteredAssignees.departments.length > 0 && <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400">Departments (Assign to all)</div>}
                                {filteredAssignees.departments.map(dept => (
                                    <label key={dept} className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/10 cursor-pointer">
                                        <input type="checkbox" checked={assignedTo.departments.includes(dept)} onChange={() => handleAssignmentChange('departments', dept)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600" />
                                        <span className="text-sm text-gray-200">{dept}</span>
                                    </label>
                                ))}
                                {/* Users grouped by role */}
                                {Object.keys(filteredAssignees.usersByRole).length > 0 && <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400">Specific Users</div>}
                                {roleOrder.map(role => {
                                    const users = filteredAssignees.usersByRole[role];
                                    return (
                                        users && users.length > 0 && (
                                            <React.Fragment key={role}>
                                                <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 sticky top-0 bg-gray-900">{role}s</div>
                                                {users.map(user => (
                                                    <label key={user.id} className="flex items-center gap-3 px-3 py-1.5 hover:bg-white/10 cursor-pointer">
                                                        <input type="checkbox" checked={assignedTo.users.includes(user.id)} onChange={() => handleAssignmentChange('users', user.id)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600" />
                                                        <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full"/>
                                                        <div>
                                                            <p className="text-sm text-gray-200">{user.name}</p>
                                                            <p className="text-xs text-gray-500">{user.email}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </React.Fragment>
                                        )
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Available From</label>
                        <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                        <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                </div>


                {questions.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h3 className="font-semibold text-white">Exam Questions</h3>
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, qIndex)}
                                onDragEnter={(e) => handleDragEnter(e, qIndex)}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragEnd={handleDragEnd}
                                className={`bg-white/5 p-4 rounded-lg border transition-all duration-200 
                                ${dragOverIndex === qIndex ? 'border-emerald-400 scale-[1.02]' : 'border-white/10'} 
                                ${draggingIndex === qIndex ? 'opacity-50' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`${draggingIndex !== null ? 'cursor-grabbing' : 'cursor-grab'} text-gray-500`} title="Drag to reorder">
                                            <GripVerticalIcon className="w-5 h-5" />
                                        </div>
                                        <p className="font-semibold text-gray-300">Question {qIndex + 1}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                         <button onClick={() => moveQuestion(qIndex, qIndex - 1)} disabled={qIndex === 0} className="p-1 rounded-full text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Move question ${qIndex + 1} up`}>
                                            <ArrowUpIcon className="w-4 h-4"/>
                                        </button>
                                         <button onClick={() => moveQuestion(qIndex, qIndex + 1)} disabled={qIndex === questions.length - 1} className="p-1 rounded-full text-gray-400 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" aria-label={`Move question ${qIndex + 1} down`}>
                                            <ArrowUpIcon className="w-4 h-4 rotate-180"/>
                                        </button>
                                        <button onClick={() => handleDeleteQuestion(qIndex)} className="p-1 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors" aria-label={`Delete question ${qIndex + 1}`}>
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <textarea value={q.text} onChange={(e) => handleQuestionUpdate(qIndex, { text: e.target.value })} placeholder={`Enter question text...`} rows={2} className="w-full bg-black/40 border border-white/20 rounded-md p-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-y"/>
                                
                                <div className="mt-3 space-y-2">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-3 group">
                                            <input type="radio" id={`q${qIndex}o${oIndex}`} name={`correct-answer-${qIndex}`} checked={oIndex === q.correctAnswerIndex} onChange={() => handleQuestionUpdate(qIndex, { correctAnswerIndex: oIndex })} className="form-radio h-4 w-4 text-emerald-400 bg-gray-700 border-gray-600 focus:ring-emerald-500 cursor-pointer" />
                                            <label htmlFor={`q${qIndex}o${oIndex}`} className="w-full">
                                                <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} className={`w-full bg-black/40 border border-white/10 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${oIndex === q.correctAnswerIndex ? 'text-green-300 border-green-500/50' : 'text-gray-300'}`} />
                                            </label>
                                            {q.options.length > 2 && (
                                                <button onClick={() => handleRemoveOption(qIndex, oIndex)} className="p-1 rounded-full text-gray-500 hover:bg-red-500/20 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100" aria-label={`Remove option ${oIndex + 1}`}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3">
                                    <button onClick={() => handleAddOption(qIndex)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10 rounded-md transition-colors">
                                        <PlusIcon className="w-4 h-4" />
                                        Add Option
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="pt-2">
                    <button
                        onClick={handleAddQuestion}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-dashed border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:border-white/30 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Add Question Manually
                    </button>
                </div>
                
                {error && <p className="text-red-400 text-sm pt-2">{error}</p>}
            </div>
                
            <div className="flex justify-end gap-4 pt-4 mt-4 border-t border-white/10">
                <button onClick={onClose} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20">Cancel</button>
                <button onClick={handleSubmit} disabled={isSubmitting || isGenerating || isUploading} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg disabled:opacity-50 min-w-[100px] flex justify-center transition-all duration-300 transform hover:scale-105">
                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create Exam'}
                </button>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 20px;
                }
            `}</style>
        </Modal>
    );
};

export default CreateExamModal;