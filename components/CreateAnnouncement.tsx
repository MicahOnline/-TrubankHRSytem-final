import React, { useState, useEffect } from 'react';
import { Announcement } from '../types';
import * as api from '../src/utils/api';
import { MegaphoneIcon, ClockIcon } from './icons';

interface CreateAnnouncementProps {
    addToast: (message: string, type: 'success' | 'error') => void;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 transition-all duration-300 ease-in-out ${className}`}>
        {children}
    </div>
);

const CreateAnnouncement: React.FC<CreateAnnouncementProps> = ({ addToast }) => {
    // State for creating announcements
    const [newAnnouncement, setNewAnnouncement] = useState<{
        title: string;
        content: string;
        audience: ('Employee' | 'Applicant')[];
        category: Announcement['category'];
        scheduledFor: string | null;
    }>({
        title: '',
        content: '',
        audience: [],
        category: 'General',
        scheduledFor: null
    });
    const [isScheduling, setIsScheduling] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [announcementError, setAnnouncementError] = useState('');
    
    // State for listing announcements
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
     useEffect(() => {
        const fetchAnnouncements = async () => {
             try {
                const announcementsData = await api.getAnnouncements(true); // Fetch all, including scheduled
                setAnnouncements(announcementsData);
            } catch (e) {
                addToast("Failed to fetch announcements", "error");
            }
        };
        fetchAnnouncements();
    }, [addToast]);
    
    const handleAudienceChange = (role: 'Employee' | 'Applicant') => {
        setNewAnnouncement(prev => {
            const newAudience = prev.audience.includes(role)
                ? prev.audience.filter(r => r !== role)
                : [...prev.audience, role];
            return { ...prev, audience: newAudience };
        });
    };

    const handleSendAnnouncement = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim() || newAnnouncement.audience.length === 0) {
            setAnnouncementError('Title, content, and at least one audience are required.');
            return;
        }
        setAnnouncementError('');
        setIsSubmitting(true);
        try {
            const announcementToSend = {
                ...newAnnouncement,
                scheduledFor: isScheduling ? newAnnouncement.scheduledFor : null,
            };
            await api.createAnnouncement(announcementToSend);
            addToast(isScheduling ? 'Announcement scheduled successfully!' : 'Announcement sent successfully!', 'success');
            
            // Re-fetch all to get the updated list
            const allAnnouncements = await api.getAnnouncements(true);
            setAnnouncements(allAnnouncements);
            
            // Reset form
            setNewAnnouncement({ title: '', content: '', audience: [], category: 'General', scheduledFor: null });
            setIsScheduling(false);
        } catch (e) {
            setAnnouncementError('Failed to send announcement. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const getAudienceBadge = (role: 'Employee' | 'Applicant') => {
      return role === 'Employee'
        ? 'bg-blue-500/20 text-blue-300'
        : 'bg-cyan-500/20 text-cyan-300';
    };

    const getCategoryBadge = (category: Announcement['category']) => {
        switch (category) {
            case 'Urgent': return 'bg-red-500/20 text-red-300';
            case 'Event': return 'bg-green-500/20 text-green-300';
            case 'Policy Update': return 'bg-yellow-500/20 text-yellow-300';
            case 'General':
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return (
         <div className="space-y-8 animate-fadeInUp">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Announcements</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage company-wide announcements.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <GlassCard>
                    <div className="flex items-center gap-3 mb-4">
                        <MegaphoneIcon className="w-6 h-6 text-emerald-400 dark:text-emerald-300"/>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Create Announcement</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="announcement-title" className="sr-only">Announcement Title</label>
                            <input id="announcement-title" type="text" placeholder="Announcement Title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement(p => ({...p, title: e.target.value}))} className="w-full bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                             <label htmlFor="announcement-content" className="sr-only">Announcement Content</label>
                            <textarea id="announcement-content" placeholder="Announcement Content..." rows={4} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement(p => ({...p, content: e.target.value}))} className="w-full bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <fieldset>
                                <legend className="text-sm text-gray-600 dark:text-gray-300 mb-2">Audience</legend>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAnnouncement.audience.includes('Employee')} onChange={() => handleAudienceChange('Employee')} className="custom-checkbox h-4 w-4 rounded bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-emerald-500 focus:ring-emerald-600" /><span>Employees</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newAnnouncement.audience.includes('Applicant')} onChange={() => handleAudienceChange('Applicant')} className="custom-checkbox h-4 w-4 rounded bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-emerald-500 focus:ring-emerald-600" /><span>Applicants</span></label>
                                </div>
                            </fieldset>
                             <div>
                                <label htmlFor="category" className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">Category</label>
                                <select id="category" value={newAnnouncement.category} onChange={(e) => setNewAnnouncement(p => ({...p, category: e.target.value as Announcement['category']}))} className="w-full bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"><option>General</option><option>Urgent</option><option>Event</option><option>Policy Update</option></select>
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isScheduling} onChange={() => setIsScheduling(!isScheduling)} className="custom-checkbox h-4 w-4 rounded bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-emerald-500 focus:ring-emerald-600" /><span>Schedule for later?</span></label>
                            {isScheduling && (
                                <>
                                 <label htmlFor="schedule-time" className="sr-only">Schedule time</label>
                                <input id="schedule-time" type="datetime-local" value={newAnnouncement.scheduledFor || ''} onChange={(e) => setNewAnnouncement(p => ({...p, scheduledFor: e.target.value}))} className="mt-2 w-full bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                </>
                            )}
                        </div>
                        {announcementError && <p className="text-red-500 dark:text-red-400 text-sm">{announcementError}</p>}
                        <button onClick={handleSendAnnouncement} disabled={isSubmitting} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 flex items-center justify-center">
                             {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isScheduling && newAnnouncement.scheduledFor ? 'Schedule' : 'Send Now')}
                        </button>
                    </div>
                </GlassCard>
                <GlassCard>
                    <div className="flex items-center gap-3 mb-4">
                         <MegaphoneIcon className="w-6 h-6 text-cyan-400 dark:text-cyan-300"/>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Scheduled & Recent Announcements</h3>
                    </div>
                    <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-2">
                        {announcements.map(ann => {
                            const isScheduled = ann.scheduledFor && new Date(ann.scheduledFor) > new Date();
                            return (
                                <div key={ann.id} className="bg-gray-200/50 dark:bg-white/5 p-3 rounded-lg border border-gray-300/50 dark:border-white/10">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-gray-900 dark:text-white">{ann.title}</p>
                                        {isScheduled && <span className="flex items-center gap-1.5 text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full"><ClockIcon className="w-3 h-3"/> Scheduled</span>}
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{ann.content}</p>
                                    <div className="mt-2 pt-2 border-t border-gray-300 dark:border-white/10 flex items-center justify-between">
                                        <div className="flex flex-wrap gap-2">
                                            {ann.audience.map(role => <span key={role} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getAudienceBadge(role)}`}>{role}</span>)}
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadge(ann.category)}`}>{ann.category}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">{isScheduled ? `For ${new Date(ann.scheduledFor!).toLocaleDateString()}` : `On ${new Date(ann.createdAt).toLocaleDateString()}`}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>
            </div>
             <style>
              {`
              .custom-checkbox {
                  -webkit-appearance: none;
                  appearance: none;
                  transition: all 0.2s;
              }
              .custom-checkbox:checked {
                  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
                  background-size: 100% 100%;
                  background-position: center;
                  background-repeat: no-repeat;
              }
              `}
             </style>
        </div>
    );
};

export default CreateAnnouncement;