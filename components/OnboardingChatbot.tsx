

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { streamOnboardingChat } from '../services/geminiService';
import { SendIcon, BotIcon, UserIcon, CloseIcon, ChatIcon } from './icons';

const OnboardingChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<ChatMessage[]>([
        { role: 'model', text: "Congratulations on your successful application! I'm here to help with any questions you have about onboarding. How can I assist you?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const handleSendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        setHistory(prev => [...prev, { role: 'model', text: '' }]);

        try {
            const stream = await streamOnboardingChat(input);
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
        }
    }, [input, isLoading]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const PromptSuggestion: React.FC<{text: string}> = ({text}) => (
        <button 
            onClick={() => setInput(text)}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-white/10 transition-colors"
        >
            {text}
        </button>
    );
    
    return (
        <>
            {/* FAB */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`fixed bottom-8 right-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full p-4 text-white shadow-lg hover:scale-110 transition-transform z-50 animate-scaleIn origin-bottom-right`}
                aria-label={isOpen ? 'Close onboarding assistant' : 'Open onboarding assistant'}
            >
                {isOpen ? <CloseIcon className="w-8 h-8"/> : <ChatIcon className="w-8 h-8"/>}
            </button>
            
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-28 right-8 w-[calc(100%-4rem)] max-w-sm h-[60vh] flex flex-col bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 animate-scaleIn origin-bottom-right">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <BotIcon className="w-6 h-6 text-emerald-300" />
                            <h3 className="font-semibold text-white">Onboarding Assistant</h3>
                        </div>
                    </div>
                    
                    {/* Message Area */}
                    <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                         {history.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && (
                                    <div className="w-7 h-7 flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                                        <BotIcon className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.role === 'user' 
                                    ? 'bg-emerald-600 rounded-br-none' 
                                    : 'bg-black/30 backdrop-blur-md border border-white/10 rounded-bl-none'
                                }`}>
                                   <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
                                   {isLoading && msg.role === 'model' && index === history.length - 1 && !msg.text && (
                                        <div className="flex items-center space-x-1">
                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse"></span>
                                        </div>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                   <div className="w-7 h-7 flex-shrink-0 bg-gray-700 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <PromptSuggestion text="What documents do I need?"/>
                            <PromptSuggestion text="What's the dress code?"/>
                            <PromptSuggestion text="When do I get my laptop?"/>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about onboarding..."
                                className="w-full bg-black/40 border border-white/20 rounded-full pl-4 pr-12 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                                disabled={isLoading}
                                aria-label="Chat input"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-green-600 p-1.5 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110"
                                aria-label="Send message"
                            >
                                <SendIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>
            {`
              .scrollbar-thin {
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
              }
              .scrollbar-thin::-webkit-scrollbar {
                width: 6px;
              }
              .scrollbar-thin::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollbar-thin::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                border: 3px solid transparent;
              }
            `}
            </style>
        </>
    );
};

export default OnboardingChatbot;