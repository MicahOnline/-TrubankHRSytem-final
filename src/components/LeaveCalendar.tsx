import React, { useState, useMemo } from 'react';
import { LeaveRequest } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';

interface LeaveCalendarProps {
    leaveRequests: LeaveRequest[];
}

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({ leaveRequests }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const leavesByDate = useMemo(() => {
        const map = new Map<string, LeaveRequest[]>();
        leaveRequests.forEach(req => {
            if (req.status === 'Approved') {
                let current = new Date(req.startDate);
                // Adjust for timezone issues by working with UTC dates
                current = new Date(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
                const end = new Date(req.endDate);
                const endDateUTC = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

                while (current <= endDateUTC) {
                    const dateString = current.toISOString().split('T')[0];
                    const existing = map.get(dateString) || [];
                    map.set(dateString, [...existing, req]);
                    current.setDate(current.getDate() + 1);
                }
            }
        });
        return map;
    }, [leaveRequests]);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-black/10 dark:border-white/10"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];
        const dayLeaves = leavesByDate.get(dateString) || [];

        const isToday = date.getTime() === today.getTime();

        calendarDays.push(
            <div key={day} className="relative p-2 border-r border-b border-black/10 dark:border-white/10 min-h-[100px] flex flex-col transition-colors duration-200 hover:bg-gray-200/30 dark:hover:bg-white/5">
                <time dateTime={dateString} className={`text-sm font-semibold ${isToday ? 'bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-800 dark:text-gray-200'}`}>
                    {day}
                </time>
                <div className="flex-grow mt-1 space-y-1 overflow-hidden">
                    {dayLeaves.map((leave, index) => (
                         <div key={`${leave.id}-${index}`} className="group relative">
                            <div className={`w-full text-xs text-left p-1 rounded truncate ${leave.leaveType === 'Vacation Leave' ? 'bg-teal-500/80 text-white' : 'bg-cyan-500/80 text-white'}`}>
                                {leave.userName}
                            </div>
                            <div className="absolute z-10 bottom-full mb-1 left-1/2 -translate-x-1/2 transform opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none w-max shadow-lg">
                                {leave.userName} ({leave.leaveType})
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{monthName}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} aria-label="Previous month" className="p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextMonth} aria-label="Next month" className="p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7">
                {daysOfWeek.map(day => (
                    <div key={day} className="p-2 text-center text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-200/30 dark:bg-black/20 border-t border-l border-b border-r border-black/10 dark:border-white/10 first:rounded-tl-lg last:border-r last:rounded-tr-lg">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 border-l border-black/10 dark:border-white/10 rounded-bl-lg rounded-br-lg">
                {calendarDays}
            </div>
        </div>
    );
};

export default LeaveCalendar;