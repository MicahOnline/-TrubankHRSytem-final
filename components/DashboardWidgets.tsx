import React, { useState, useEffect, useMemo } from 'react';
import { SunIcon, MoonIcon, CloudIcon, CloudySunIcon, CloudyMoonIcon, RainIcon } from './icons';

const DashboardWidgets: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    
    const weather = useMemo(() => {
        const hour = time.getHours();
        
        if (hour >= 22 || hour < 5) { // Late night
            return { Icon: MoonIcon, text: "Clear", temp: 15 };
        } else if (hour >= 18) { // Evening
            return { Icon: CloudyMoonIcon, text: "Cloudy", temp: 19 };
        } else if (hour >= 12) { // Afternoon
            return { Icon: SunIcon, text: "Sunny", temp: 24 };
        } else if (hour >= 6) { // Morning
            return { Icon: CloudySunIcon, text: "Partly Cloudy", temp: 18 };
        } else { // Early Morning
            return { Icon: CloudIcon, text: "Foggy", temp: 14 };
        }
    }, [time]);

    const formatDate = (date: Date) => date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const formatTime = (date: Date) => date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <div className={`
            bg-white/60 dark:bg-black/30 backdrop-blur-xl 
            border border-black/10 dark:border-white/10 rounded-xl px-4 py-2
            flex items-center justify-between gap-4
            shadow-lg transition-all duration-300
        `}>
            {/* Weather Section */}
            <div className="flex items-center gap-3">
                <weather.Icon className="w-8 h-8 text-gray-800 dark:text-white flex-shrink-0" />
                <div>
                    <p className="font-bold text-xl text-gray-900 dark:text-white">{weather.temp}°</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 -mt-1">{weather.text}</p>
                </div>
            </div>

            <div className="w-px h-10 bg-black/10 dark:bg-white/10"></div>

            {/* Time Section */}
            <div className="text-right">
                <p className="font-mono text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    {formatTime(time)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(time)}</p>
            </div>
        </div>
    );
};

export default DashboardWidgets;