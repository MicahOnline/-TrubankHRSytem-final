import React, { useState } from 'react';
import Modal from './Modal';

interface RejectReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('A reason for rejection is required.');
            return;
        }
        setError('');
        onSubmit(reason);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reason for Rejection">
            <div className="space-y-4">
                <p className="text-sm text-gray-300">Please provide a reason for rejecting this leave request. This will be visible to the employee.</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="e.g., Overlapping with critical project deadline, insufficient notice..."
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex justify-end gap-4 pt-2">
                    <button onClick={onClose} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">Confirm Rejection</button>
                </div>
            </div>
        </Modal>
    );
};

export default RejectReasonModal;