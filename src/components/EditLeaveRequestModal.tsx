import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import * as api from '../utils/api';
import { LeaveRequest, LeaveType, LeavePolicy } from '../../types';

interface EditLeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    addToast: (message: string, type: 'success' | 'error') => void;
    onEditRequest: (request: LeaveRequest) => void;
    request: LeaveRequest;
    policy: LeavePolicy | null;
}

const EditLeaveRequestModal: React.FC<EditLeaveRequestModalProps> = ({ isOpen, onClose, addToast, onEditRequest, request, policy }) => {
    const [leaveType, setLeaveType] = useState<LeaveType>('Vacation Leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const availableTypes = policy?.availableLeaveTypes.filter(t => t.enabled) || [];

    useEffect(() => {
        if (request) {
            setLeaveType(request.leaveType);
            setStartDate(request.startDate);
            setEndDate(request.endDate);
            setReason(request.reason);
        }
    }, [request]);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for your leave.');
            return;
        }
        if (!startDate || !endDate) {
            setError('Please select both a start and end date.');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('Start date cannot be after the end date.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        try {
            const updatedRequest = await api.updateLeaveRequest(request.id, {
                leaveType,
                startDate,
                endDate,
                reason: reason.trim(),
            });
            onEditRequest(updatedRequest);
            addToast('Leave request updated successfully.', 'success');
            onClose();
        } catch {
            addToast('Failed to update leave request.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Leave Request">
            <div className="space-y-6">
                <div>
                    <label htmlFor="leaveTypeEdit" className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
                    <select
                        id="leaveTypeEdit"
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    >
                        {availableTypes.map(type => (
                            <option key={type.name} value={type.name}>{type.name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDateEdit" className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                        <input type="date" id="startDateEdit" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                    </div>
                    <div>
                        <label htmlFor="endDateEdit" className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                        <input type="date" id="endDateEdit" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                    </div>
                </div>
                 <div>
                    <label htmlFor="reasonEdit" className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
                    <textarea
                        id="reasonEdit"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="Please provide a brief reason for your leave..."
                    />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex justify-end gap-4 pt-4">
                    <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors"
                    >
                    Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                    >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : 'Save Changes'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditLeaveRequestModal;