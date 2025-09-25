import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { SunIcon, MoonIcon, TrashIcon, ClipboardListIcon, BookOpenIcon } from '../../components/icons';
import * as api from '../utils/api';
import { LeavePolicy, ExamConfig, ProctoringSensitivity } from '../../types';
import { clearChatHistory } from '../../services/geminiService';


interface SettingsProps {
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 transition-colors duration-300 ${className}`}>
        {children}
    </div>
);

const SettingsToggle: React.FC<{ label: string; description: string; children: React.ReactNode; isChecked: boolean; onToggle: () => void }> = ({ label, description, children, isChecked, onToggle }) => (
    <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10">
        <div>
            <p className="font-medium text-gray-900 dark:text-white">{label}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <button 
            role="switch"
            aria-checked={isChecked}
            onClick={onToggle} 
            className="p-2 rounded-full bg-white/50 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            aria-label={`Toggle ${label}`}
        >
            {children}
        </button>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ addToast }) => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';
    const [activeTab, setActiveTab] = useState('Appearance');
    
    // Leave Policy State
    const [leavePolicy, setLeavePolicy] = useState<LeavePolicy | null>(null);
    const [isSavingPolicy, setIsSavingPolicy] = useState(false);

    // Exam Config State
    const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
    const [isSavingExamConfig, setIsSavingExamConfig] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            api.getLeavePolicy()
                .then(setLeavePolicy)
                .catch(() => addToast('Failed to load leave policy.', 'error'));
            api.getExamConfig()
                .then(setExamConfig)
                .catch(() => addToast('Failed to load exam configuration.', 'error'));
        }
    }, [isAdmin, addToast]);
    
    const handlePolicyChange = (field: keyof LeavePolicy, value: any) => {
        if (leavePolicy) {
            setLeavePolicy({ ...leavePolicy, [field]: value });
        }
    };

    const handleLeaveTypeToggle = (index: number) => {
        if (leavePolicy) {
            const updatedTypes = [...leavePolicy.availableLeaveTypes];
            updatedTypes[index].enabled = !updatedTypes[index].enabled;
            setLeavePolicy({ ...leavePolicy, availableLeaveTypes: updatedTypes });
        }
    };
    
    const handleLeaveTypeWithPayToggle = (index: number) => {
        if (leavePolicy) {
            const updatedTypes = [...leavePolicy.availableLeaveTypes];
            updatedTypes[index].withPay = !updatedTypes[index].withPay;
            setLeavePolicy({ ...leavePolicy, availableLeaveTypes: updatedTypes });
        }
    };

    const handleSavePolicy = async () => {
        if (!leavePolicy) return;
        setIsSavingPolicy(true);
        try {
            await api.updateLeavePolicy(leavePolicy);
            addToast('Leave policy updated successfully!', 'success');
        } catch {
            addToast('Failed to save leave policy.', 'error');
        } finally {
            setIsSavingPolicy(false);
        }
    };

    const handleExamConfigChange = (field: keyof ExamConfig, value: any) => {
        if (examConfig) {
            setExamConfig({ ...examConfig, [field]: value });
        }
    };
    
    const handleSaveExamConfig = async () => {
        if (!examConfig) return;
        setIsSavingExamConfig(true);
        try {
            await api.updateExamConfig(examConfig);
            addToast('Exam configuration saved successfully!', 'success');
        } catch {
            addToast('Failed to save exam configuration.', 'error');
        } finally {
            setIsSavingExamConfig(false);
        }
    };

    const handleClearHistory = () => {
        clearChatHistory();
        addToast('AI Assistant history cleared!', 'info');
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-fadeInUp">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your experience and manage system policies.</p>
            </div>
            
            <div className="border-b border-gray-300/50 dark:border-white/10">
                <div className="flex items-center gap-2" role="tablist">
                    <button onClick={() => setActiveTab('Appearance')} role="tab" aria-selected={activeTab === 'Appearance'} className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === 'Appearance' ? 'border-emerald-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>Appearance</button>
                    {isAdmin && (
                        <>
                            <button onClick={() => setActiveTab('Leave Policies')} role="tab" aria-selected={activeTab === 'Leave Policies'} className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === 'Leave Policies' ? 'border-emerald-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>Leave Policies</button>
                            <button onClick={() => setActiveTab('Exam Config')} role="tab" aria-selected={activeTab === 'Exam Config'} className={`px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${activeTab === 'Exam Config' ? 'border-emerald-400 text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}>Exam Config</button>
                        </>
                    )}
                </div>
            </div>
            
            {activeTab === 'Appearance' && (
                <div role="tabpanel" className="space-y-8">
                     <GlassCard>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Appearance</h3>
                        <SettingsToggle label="Theme" description={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onToggle={toggleTheme} isChecked={theme === 'dark'}>
                            {theme === 'light' ? <MoonIcon className="w-6 h-6 text-gray-700"/> : <SunIcon className="w-6 h-6 text-yellow-300"/>}
                        </SettingsToggle>
                    </GlassCard>
                    {(user?.role === 'Admin' || user?.role === 'Employee') && (
                        <GlassCard>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4">Data Management</h3>
                            <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">AI Assistant History</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Clear your conversation history with the AI.</p>
                                </div>
                                <button onClick={handleClearHistory} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-md text-sm font-semibold hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-colors">
                                    <TrashIcon className="w-4 h-4"/>Clear
                                </button>
                            </div>
                        </GlassCard>
                    )}
                </div>
            )}

            {isAdmin && activeTab === 'Leave Policies' && (
                // FIX: The GlassCard component does not accept a 'role' prop. The role="tabpanel" should be on a wrapper div for accessibility.
                <div role="tabpanel">
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <ClipboardListIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Leave Policies</h3>
                        </div>
                        {leavePolicy ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="vacation-accrual" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vacation Accrual Rate (days/month)</label>
                                        <input id="vacation-accrual" type="number" step="0.01" value={leavePolicy.vacationAccrualRate} onChange={e => handlePolicyChange('vacationAccrualRate', parseFloat(e.target.value) || 0)} className="w-full bg-gray-200/50 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white"/>
                                    </div>
                                     <div>
                                        <label htmlFor="sick-accrual" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sick Leave Accrual Rate (days/month)</label>
                                        <input id="sick-accrual" type="number" step="0.01" value={leavePolicy.sickAccrualRate} onChange={e => handlePolicyChange('sickAccrualRate', parseFloat(e.target.value) || 0)} className="w-full bg-gray-200/50 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white"/>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="carry-over" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Carry-over Days (Vacation)</label>
                                    <input id="carry-over" type="number" value={leavePolicy.maxCarryOverDays} onChange={e => handlePolicyChange('maxCarryOverDays', parseInt(e.target.value) || 0)} className="w-full bg-gray-200/50 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white"/>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Leave Types</label>
                                    <div className="space-y-2">
                                        {leavePolicy.availableLeaveTypes.map((type, index) => (
                                            <div key={type.name} className="flex items-center justify-between p-3 bg-white/40 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10">
                                                <span className="font-medium text-gray-900 dark:text-white">{type.name}</span>
                                                <div className="flex items-center gap-6">
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                                                        <input type="checkbox" role="switch" aria-checked={type.withPay} checked={type.withPay} onChange={() => handleLeaveTypeWithPayToggle(index)} className="form-switch h-5 w-5 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600" />
                                                        With Pay
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                                                        <input type="checkbox" role="switch" aria-checked={type.enabled} checked={type.enabled} onChange={() => handleLeaveTypeToggle(index)} className="form-switch h-5 w-5 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600" />
                                                        Enabled
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button onClick={handleSavePolicy} disabled={isSavingPolicy} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[140px] flex justify-center">
                                        {isSavingPolicy ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Policies'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">Loading leave policies...</p>
                        )}
                    </GlassCard>
                </div>
            )}

            {isAdmin && activeTab === 'Exam Config' && (
                // FIX: The GlassCard component does not accept a 'role' prop. The role="tabpanel" should be on a wrapper div for accessibility.
                <div role="tabpanel">
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-4">
                            <BookOpenIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Exam Configuration</h3>
                        </div>
                        {examConfig ? (
                            <div className="space-y-6">
                                 <div>
                                    <label htmlFor="passing-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Passing Score: <span className="font-bold text-emerald-400">{examConfig.passingScore}%</span></label>
                                    <input id="passing-score" type="range" min="0" max="100" value={examConfig.passingScore} onChange={e => handleExamConfigChange('passingScore', parseInt(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"/>
                                </div>
                                
                                <label className="flex items-center justify-between p-3 bg-white/40 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 cursor-pointer">
                                    <p className="font-medium text-gray-900 dark:text-white">Enable AI Proctoring</p>
                                    <input type="checkbox" role="switch" aria-checked={examConfig.aiProctoringEnabled} checked={examConfig.aiProctoringEnabled} onChange={e => handleExamConfigChange('aiProctoringEnabled', e.target.checked)} className="form-switch"/>
                                </label>
                                
                                {examConfig.aiProctoringEnabled && (
                                    <div className="pl-4 border-l-2 border-emerald-500/50 space-y-4">
                                         <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proctoring Sensitivity</label>
                                            <div className="flex items-center gap-4">
                                                {(['Lenient', 'Moderate', 'Strict'] as ProctoringSensitivity[]).map(level => (
                                                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" name="sensitivity" value={level} checked={examConfig.proctoringSensitivity === level} onChange={() => handleExamConfigChange('proctoringSensitivity', level)} className="form-radio h-4 w-4 text-emerald-500 bg-gray-700 border-gray-600 focus:ring-emerald-600"/>
                                                        <span className="text-gray-800 dark:text-gray-200">{level}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="max-violations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Rule Violations</label>
                                            <input id="max-violations" type="number" min="1" value={examConfig.maxViolations} onChange={e => handleExamConfigChange('maxViolations', parseInt(e.target.value) || 1)} className="w-full bg-gray-200/50 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white"/>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button onClick={handleSaveExamConfig} disabled={isSavingExamConfig} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[140px] flex justify-center">
                                        {isSavingExamConfig ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Config'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                             <p className="text-gray-500 dark:text-gray-400">Loading exam configuration...</p>
                        )}
                    </GlassCard>
                </div>
            )}

        </div>
    );
};

export default Settings;
