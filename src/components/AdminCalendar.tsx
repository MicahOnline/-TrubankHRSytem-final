import React, { useState, useMemo, useEffect } from 'react';
import { LeaveRequest, Reminder } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../../components/icons';
import ReminderModal from './ReminderModal';

interface AdminCalendarProps {
    leaveRequests: LeaveRequest[];
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ leaveRequests }) => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchReminders = async () => {
            if (user) {
                const fetched = await api.getReminders(user.id);
                setReminders(fetched);
            }
        };
        fetchReminders();
    }, [user]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const eventsByDate = useMemo(() => {
        const map = new Map<string, { leaves: LeaveRequest[], reminders: Reminder[] }>();
        
        leaveRequests.forEach(req => {
            if (req.status === 'Approved') {
                let current = new Date(req.startDate);
                current = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
                const end = new Date(req.endDate);
                const endDateUTC = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

                while (current <= endDateUTC) {
                    const dateString = current.toISOString().split('T')[0];
                    const existing = map.get(dateString) || { leaves: [], reminders: [] };
                    existing.leaves.push(req);
                    map.set(dateString, existing);
                    current.setDate(current.getDate() + 1);
                }
            }
        });

        reminders.forEach(rem => {
            const dateString = rem.date;
            const existing = map.get(dateString) || { leaves: [], reminders: [] };
            existing.reminders.push(rem);
            map.set(dateString, existing);
        });

        return map;
    }, [leaveRequests, reminders]);

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date.toISOString().split('T')[0]);
        setIsModalOpen(true);
    };
    
    const handleReminderChange = (updatedReminders: Reminder[]) => {
        setReminders(updatedReminders);
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDays = Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} className="border-r border-b border-black/10 dark:border-white/10"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        const dayEvents = eventsByDate.get(dateString) || { leaves: [], reminders: [] };
        const isToday = date.getTime() === today.getTime();

        calendarDays.push(
            <div key={day} onClick={() => handleDayClick(day)} className="relative p-2 border-r border-b border-black/10 dark:border-white/10 min-h-[100px] flex flex-col transition-colors duration-200 hover:bg-gray-200/30 dark:hover:bg-white/5 cursor-pointer group">
                <time className={`text-sm font-semibold ${isToday ? 'bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-800 dark:text-gray-200'}`}>
                    {day}
                </time>
                <div className="flex-grow mt-1 space-y-1 overflow-hidden">
                    {dayEvents.reminders.map(rem => <div key={rem.id} className={`w-full text-xs text-left p-1 rounded truncate bg-${rem.color}-500/80 text-white`}>{rem.title}</div>)}
                    {dayEvents.leaves.map((leave, index) => <div key={`${leave.id}-${index}`} className={`w-full text-xs text-left p-1 rounded truncate ${leave.leaveType === 'Vacation Leave' ? 'bg-teal-500/80' : 'bg-cyan-500/80'} text-white`}>{leave.userName}</div>)}
                </div>
                <button className="absolute top-1 right-1 p-1 rounded-full bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlusIcon className="w-4 h-4 text-white" />
                </button>
            </div>
        );
    }
    
    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{monthName}</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrevMonth} className="p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10"><ChevronLeftIcon className="w-5 h-5" /></button>
                        <button onClick={handleNextMonth} className="p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-600 dark:text-gray-400">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="p-2 border-t border-l border-b border-r border-black/10 dark:border-white/10 bg-gray-200/30 dark:bg-black/20">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 border-l border-t border-black/10 dark:border-white/10 rounded-b-lg">{calendarDays}</div>
            </div>
            {selectedDate && (
                <ReminderModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    date={selectedDate}
                    reminders={reminders.filter(r => r.date === selectedDate)}
                    onRemindersChange={handleReminderChange}
                />
            )}
        </>
    );
};

export default AdminCalendar;