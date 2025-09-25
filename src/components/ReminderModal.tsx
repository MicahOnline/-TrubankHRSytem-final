import React, { useState } from 'react';
import Modal from './Modal';
import { Reminder } from '../../types';
import * as api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, TrashIcon } from '../../components/icons';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    reminders: Reminder[];
    onRemindersChange: (reminders: Reminder[]) => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, date, reminders, onRemindersChange }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [color, setColor] = useState<'green' | 'blue' | 'teal' | 'yellow' | 'red'>('green');
    const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

    const handleSubmit = async () => {
        if (!title.trim() || !user) return;

        if (editingReminder) {
            const updated = await api.updateReminder(editingReminder.id, { title, color: color as any });
            const allReminders = await api.getReminders(user.id);
            onRemindersChange(allReminders);
        } else {
            await api.addReminder({ date, title, color: color as any, userId: user.id });
            const allReminders = await api.getReminders(user.id);
            onRemindersChange(allReminders);
        }
        
        setTitle('');
        setColor('green');
        setEditingReminder(null);
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        await api.deleteReminder(id);
        const allReminders = await api.getReminders(user.id);
        onRemindersChange(allReminders);
    };

    const handleEditClick = (reminder: Reminder) => {
        setEditingReminder(reminder);
        setTitle(reminder.title);
        setColor(reminder.color as any);
    };

    const colorOptions: ('green' | 'blue' | 'teal' | 'yellow' | 'red')[] = ['green', 'blue', 'teal', 'yellow', 'red'];
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reminders for ${formattedDate}`}>
            <div className="space-y-4">
                {reminders.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {reminders.map(rem => (
                            <li key={rem.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-${rem.color}-500`}></div>
                                    <span className="text-sm">{rem.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditClick(rem)} className="text-xs text-gray-400 hover:text-white">Edit</button>
                                    <button onClick={() => handleDelete(rem.id)}><TrashIcon className="w-4 h-4 text-red-400 hover:text-red-300"/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-gray-400 text-center">No reminders for this day.</p>}
                
                <div className="pt-4 border-t border-white/10">
                    <h4 className="font-semibold mb-2">{editingReminder ? 'Edit Reminder' : 'Add Reminder'}</h4>
                    <div className="flex gap-2">
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Reminder title..." className="flex-grow bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        <button onClick={handleSubmit} className="px-3 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700">{editingReminder ? 'Save' : 'Add'}</button>
                    </div>
                     <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-2">
                            {colorOptions.map(c => (
                                <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full bg-${c}-500 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''}`}></button>
                            ))}
                        </div>
                        {editingReminder && <button onClick={() => { setEditingReminder(null); setTitle(''); setColor('green'); }} className="text-xs text-gray-400 hover:text-white">Cancel Edit</button>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ReminderModal;