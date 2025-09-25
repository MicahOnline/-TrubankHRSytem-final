import React, { useState } from 'react';
import Modal from './Modal';
import * as api from '../utils/api';
import { User, LeaveLedgerEntry, TransactionType } from '../../types';

interface ManualAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    addToast: (message: string, type: 'success' | 'error') => void;
    onLedgerUpdate: (entry: LeaveLedgerEntry) => void;
}

const ManualAdjustmentModal: React.FC<ManualAdjustmentModalProps> = ({ isOpen, onClose, user, addToast, onLedgerUpdate }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [transactionType, setTransactionType] = useState<TransactionType>('Adjustment - Add');
    const [days, setDays] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!date || days === 0) {
            setError('Date and a non-zero day value are required.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        try {
            const newEntry = await api.addLeaveLedgerEntry({
                userId: user.id,
                date,
                transactionType,
                days: Math.abs(days),
                notes: notes.trim() || undefined,
            });
            onLedgerUpdate(newEntry);
            addToast(`Adjustment posted for ${user.name}.`, 'success');
            onClose();
            // Reset form
            setDate(new Date().toISOString().split('T')[0]);
            setTransactionType('Adjustment - Add');
            setDays(0);
            setNotes('');
        } catch (err) {
            addToast('Failed to post adjustment.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const adjustmentTypes: TransactionType[] = [
        'Adjustment - Add',
        'Adjustment - Remove',
        'Carry-over',
        'Accrual',
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manual Adjustment for ${user.name}`}>
             <div className="space-y-4">
                <div>
                    <label htmlFor="adj-date" className="block text-sm font-medium text-gray-300 mb-2">Transaction Date</label>
                    <input type="date" id="adj-date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white" />
                </div>
                <div>
                     <label htmlFor="adj-type" className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
                     <select id="adj-type" value={transactionType} onChange={e => setTransactionType(e.target.value as TransactionType)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white">
                        {adjustmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                     </select>
                </div>
                <div>
                    <label htmlFor="adj-days" className="block text-sm font-medium text-gray-300 mb-2">Days (Vacation)</label>
                    <input type="number" id="adj-days" value={days} onChange={e => setDays(Number(e.target.value))} placeholder="e.g., 5 or -2" className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white" />
                    <p className="text-xs text-gray-400 mt-1">Use a positive number for additions and a negative number for deductions.</p>
                </div>
                 <div>
                    <label htmlFor="adj-notes" className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
                    <textarea id="adj-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white resize-y" placeholder="e.g., Annual carry-over adjustment"></textarea>
                </div>
                
                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg disabled:opacity-50 min-w-[120px] flex justify-center"
                    >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Post Adjustment'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ManualAdjustmentModal;
