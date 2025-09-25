import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, User } from '../types';
import { streamChat, clearChatHistory } from '../services/geminiService';
import { SendIcon, BotIcon, UserIcon } from './icons';
import { useAuth } from '../src/contexts/AuthContext';
import * as api from '../src/utils/api';

interface AiAssistantProps {
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ addToast }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleClearChat = useCallback(() => {
        if (history.length > 0) {
            clearChatHistory();
            setHistory([]);
            addToast('Chat history cleared.', 'info');
        }
    }, [addToast, history.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                handleClearChat();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleClearChat]);

    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || isLoading || !user) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setHistory(prev => [...prev, userMessage]);
        
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setLoadingMessage('Thinking...');

        // Add a placeholder for the model's response
        setHistory(prev => [...prev, { role: 'model', text: '' }]);

        try {
            let finalPrompt = currentInput;
            const lowerInput = currentInput.toLowerCase();

            // Intent Detection Keywords
            const analysisKeywords = ['analyze', 'forecast', 'conflict', 'summary', 'overview', 'trend', 'availability', 'performance', 'pass rate', 'attrition', 'risk'];
            const isAnalysisQuery = analysisKeywords.some(keyword => lowerInput.includes(keyword));
            
            const personalKeywords = ['my ', ' my', ' i ', 'mine '];
            const isPersonalQuery = personalKeywords.some(keyword => lowerInput.includes(keyword));

            // Topic Detection Keywords
            const isLeaveTopic = lowerInput.includes('leave') || lowerInput.includes('vacation') || lowerInput.includes('time off');
            const isFeedbackTopic = lowerInput.includes('sentiment') || lowerInput.includes('feedback') || lowerInput.includes('morale');
            const isExamTopic = lowerInput.includes('exam') || lowerInput.includes('assessment') || lowerInput.includes('performance') || lowerInput.includes('pass rate');
            const isAttritionTopic = lowerInput.includes('attrition') || lowerInput.includes('risk');
            
            // --- CONTEXT BUILDING LOGIC ---

            if (user.role === 'Admin') {
                // Admin: Leave Analysis
                if (isAnalysisQuery && isLeaveTopic) {
                    setLoadingMessage('Fetching company-wide leave data...');
                    const allLeaveData = await api.getLeaveRequests();
                    const simplifiedLeave = allLeaveData.map(({ userName, leaveType, startDate, endDate, status }) => ({ userName, leaveType, startDate, endDate, status }));
                    finalPrompt += `\n\n[CONTEXT BLOCK: Today is ${new Date().toLocaleDateString()}. Here is the company-wide leave data for your analysis:\n${JSON.stringify(simplifiedLeave, null, 2)}]`;
                
                // Admin: Sentiment Analysis
                } else if (isAnalysisQuery && isFeedbackTopic) {
                    setLoadingMessage('Fetching employee feedback for analysis...');
                    const feedbackData = await api.getEmployeeFeedback();
                    const anonymousFeedback = feedbackData.map(({ date, feedback }) => ({ date, feedback }));
                    finalPrompt += `\n\n[CONTEXT BLOCK: Here is recent anonymous employee feedback for sentiment analysis:\n${JSON.stringify(anonymousFeedback, null, 2)}]`;

                // Admin: Exam Performance Analysis
                } else if (isAnalysisQuery && isExamTopic) {
                    setLoadingMessage('Fetching exam performance metrics...');
                    const [allExams, allUsers] = await Promise.all([api.getExams(), api.getUsers()]);
                    let totalSubmissions = 0;
                    let totalPassed = 0;
                    let totalScore = 0;
                    allUsers.forEach(u => {
                        u.examHistory.forEach(hist => {
                            if (hist.status !== 'Pending') {
                                totalSubmissions++;
                                totalScore += hist.score;
                                if (hist.status === 'Passed') totalPassed++;
                            }
                        });
                    });
                    const examMetrics = {
                        totalExamsAvailable: allExams.length,
                        totalCompletedSubmissions: totalSubmissions,
                        overallPassRate: totalSubmissions > 0 ? `${((totalPassed / totalSubmissions) * 100).toFixed(1)}%` : 'N/A',
                        companyWideAverageScore: totalSubmissions > 0 ? `${(totalScore / totalSubmissions).toFixed(1)}%` : 'N/A',
                    };
                    finalPrompt += `\n\n[CONTEXT BLOCK: Here are the company-wide exam performance metrics for your analysis:\n${JSON.stringify(examMetrics, null, 2)}]`;
                
                 // Admin: Attrition Risk Analysis
                } else if (isAnalysisQuery && isAttritionTopic) {
                    setLoadingMessage('Fetching data for attrition risk analysis...');
                    const [allUsers, allLeaveRequests] = await Promise.all([
                        api.getUsers(),
                        api.getLeaveRequests()
                    ]);

                    const analysisData = allUsers
                        .filter(u => u.role === 'Employee' && u.status === 'Active')
                        .map(u => {
                            const userLeave = allLeaveRequests.filter(r => r.userId === u.id);
                            const recentSickLeaveCount = userLeave.filter(r => 
                                r.leaveType === 'Sick Leave' && 
                                new Date(r.startDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                            ).length;
                            const recentFailedExamsCount = u.examHistory.filter(e => 
                                e.status === 'Failed' && 
                                new Date(e.date) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
                            ).length;
                            
                            return {
                                userId: u.id,
                                name: u.name,
                                department: u.department,
                                lastLogin: u.lastLogin,
                                recentSickLeaveCountLast90Days: recentSickLeaveCount,
                                recentFailedExamCountLast180Days: recentFailedExamsCount,
                            };
                        })
                        .filter(u => u.recentSickLeaveCountLast90Days > 1 || u.recentFailedExamCountLast180Days > 0);

                    if (analysisData.length > 0) {
                        finalPrompt += `\n\n[CONTEXT BLOCK: Today is ${new Date().toISOString()}. Here is data on employees showing potential attrition risk factors. Please analyze this data to answer my question:\n${JSON.stringify(analysisData, null, 2)}]`;
                    } else {
                         finalPrompt += `\n\n[CONTEXT BLOCK: No employees are currently showing significant attrition risk factors based on recent sick leave or failed exams.]`;
                    }
                }

            } else if (user.role === 'Employee') {
                // Employee: Personal Data Query
                if (isPersonalQuery) {
                    setLoadingMessage('Fetching your personal data...');
                    // Provide a simplified version of the user object as context
                    const personalData = {
                        name: user.name,
                        department: user.department,
                        leaveBalances: user.leaveBalances,
                        examHistory: user.examHistory
                    };
                    finalPrompt += `\n\n[CONTEXT BLOCK: Here is my personal employee data. Please use it to answer my question:\n${JSON.stringify(personalData, null, 2)}]`;
                
                // Employee: Departmental Leave Analysis
                } else if (isAnalysisQuery && isLeaveTopic) {
                    setLoadingMessage('Fetching departmental leave data...');
                    const allLeaveData = await api.getLeaveRequests();
                    const allUsers = await api.getUsers();
                    const departmentUserIds = new Set(allUsers.filter(u => u.department === user.department).map(u => u.id));
                    const contextData = allLeaveData.filter(req => departmentUserIds.has(req.userId));
                    
                    if (contextData.length > 0) {
                        const simplifiedLeave = contextData.map(({ userName, leaveType, startDate, endDate, status }) => ({ userName, leaveType, startDate, endDate, status }));
                        finalPrompt += `\n\n[CONTEXT BLOCK: Today is ${new Date().toLocaleDateString()}. Here is the leave data for the '${user.department}' department for your analysis:\n${JSON.stringify(simplifiedLeave, null, 2)}]`;
                    }
                }
            }

            setLoadingMessage('Generating response...');

            const stream = await streamChat(finalPrompt, user as User);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].text = fullResponse;
                    return newHistory;
                });
            }
        } catch (error) {
            console.error('Error streaming response:', error);
            setHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].text = 'Sorry, I encountered an error. Please try again.';
                return newHistory;
            });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [input, isLoading, user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const PromptSuggestion: React.FC<{text: string}> = ({text}) => (
        <button 
            onClick={() => setInput(text)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:bg-white/10 transition-colors"
        >
            {text}
        </button>
    );

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto animate-fadeInUp">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-white">AI HR Assistant</h1>
                <p className="text-gray-400 mt-1">Ask me anything about HR policies, analytics, or employee queries.</p>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {history.length === 0 && (
                    <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full">
                        <BotIcon className="w-16 h-16 mb-4 text-emerald-400" />
                        <p className="text-lg">How can I assist you today?</p>
                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            {user?.role === 'Employee' && <PromptSuggestion text="How many vacation days do I have left?"/>}
                            {user?.role === 'Admin' && <PromptSuggestion text="Analyze our company's exam performance"/>}
                            {user?.role === 'Admin' && <PromptSuggestion text="Analyze recent employee feedback"/>}
                            {user?.role === 'Admin' && <PromptSuggestion text="Which employees are showing signs of attrition risk?"/>}
                        </div>
                    </div>
                )}
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                                <BotIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className={`max-w-xl px-5 py-3 rounded-2xl ${msg.role === 'user' 
                            ? 'bg-emerald-600 rounded-br-none' 
                            : 'bg-black/30 backdrop-blur-md border border-white/10 rounded-bl-none'
                        }`}>
                           <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                           {isLoading && msg.role === 'model' && index === history.length - 1 && !msg.text && (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></span>
                                    </div>
                                    {loadingMessage && <span className="text-sm text-gray-400">{loadingMessage}</span>}
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                           <div className="w-8 h-8 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-6">
                <div className="relative bg-black/30 backdrop-blur-md border border-white/10 rounded-full">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask the AI Assistant... (Ctrl+K to clear)"
                        className="w-full bg-transparent pl-6 pr-14 py-3 text-white placeholder-gray-400 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-green-600 p-2 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiAssistant;