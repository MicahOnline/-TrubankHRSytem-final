import React, { useState, useEffect, useMemo } from 'react';
import { LeaveRequest, LeaveStatus, User, LeavePolicy } from '../../types';
import * as api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { SearchIcon, PlusIcon, CheckCircleIcon, AlertTriangleIcon, PrintIcon } from '../../components/icons';
import RequestLeaveModal from './RequestLeaveModal';
import EditLeaveRequestModal from './EditLeaveRequestModal';
import RejectReasonModal from './RejectReasonModal';
import ConfirmationModal from './ConfirmationModal';
import { getLeaveDuration } from '../utils/export';


interface LeaveManagementProps {
    addToast: (message: string, type: 'success' | 'error') => void;
    onPrintRequest: (request: LeaveRequest) => void;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ addToast, onPrintRequest }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all');
    
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
    
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [policy, setPolicy] = useState<LeavePolicy | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [requestsData, policyData] = await Promise.all([
                    api.getLeaveRequests(),
                    api.getLeavePolicy()
                ]);
                setAllRequests(requestsData);
                setPolicy(policyData);
            } catch {
                addToast('Failed to load leave data.', 'error');
            }
        };
        fetchData();
    }, [addToast]);

    const filteredRequests = useMemo(() => {
        const userRequests = isAdmin ? allRequests : allRequests.filter(r => r.userId === user?.id);
        return userRequests
            .filter(r => filterStatus === 'all' || r.status === filterStatus)
            .filter(r => r.userName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allRequests, user, isAdmin, filterStatus, searchTerm]);

    const handleAddRequest = (newRequest: LeaveRequest) => {
        setAllRequests(prev => [newRequest, ...prev]);
    };
    
    const handleEditRequest = (updatedRequest: LeaveRequest) => {
        setAllRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    };
    
    const handleUpdateStatus = async (id: string, status: LeaveStatus, remarks?: string) => {
        try {
            const updated = await api.updateLeaveRequestStatus(id, status, remarks);
            handleEditRequest(updated);
            addToast(`Request ${status.toLowerCase()}.`, 'success');
        } catch {
            addToast('Failed to update request status.', 'error');
        } finally {
            if (isRejectModalOpen) setIsRejectModalOpen(false);
            setSelectedRequest(null);
        }
    };

    const handleCancelRequest = async () => {
        if (!selectedRequest) return;
        try {
            await api.cancelLeaveRequest(selectedRequest.id);
            setAllRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            addToast('Leave request cancelled.', 'success');
        } catch {
            addToast('Failed to cancel request.', 'error');
        } finally {
            setIsConfirmCancelOpen(false);
            setSelectedRequest(null);
        }
    };

    const getStatusBadge = (status: LeaveStatus) => {
        switch (status) {
            case 'Approved': return 'bg-green-500/20 text-green-300';
            case 'Rejected': return 'bg-red-500/20 text-red-300';
            case 'Pending': return 'bg-yellow-500/20 text-yellow-300';
        }
    };

    return (
        <div className="space-y-6 animate-fadeInUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Leave Requests</h1>
                    <p className="text-gray-400 mt-1">{isAdmin ? 'Review and manage all employee leave requests.' : 'Manage your leave requests.'}</p>
                </div>
                {!isAdmin && (
                    <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105">
                        <PlusIcon className="w-5 h-5"/> New Request
                    </button>
                )}
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input type="text" placeholder="Search by employee name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={!isAdmin} className="w-full bg-black/40 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"/>
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as LeaveStatus | 'all')} className="bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10">
                                {isAdmin && <th className="p-3 text-sm font-semibold text-gray-400">Employee</th>}
                                <th className="p-3 text-sm font-semibold text-gray-400">Leave Type</th>
                                <th className="p-3 text-sm font-semibold text-gray-400">Dates</th>
                                <th className="p-3 text-sm font-semibold text-gray-400">Days</th>
                                <th className="p-3 text-sm font-semibold text-gray-400">Status</th>
                                <th className="p-3 text-sm font-semibold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => (
                                <tr key={req.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                    {isAdmin && (
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <img src={req.userAvatarUrl} alt={req.userName} className="w-10 h-10 rounded-full"/>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white truncate">{req.userName}</p>
                                                    <p className="text-sm text-gray-400 truncate">{req.reason}</p>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td className="p-3 text-gray-300">{req.leaveType}</td>
                                    <td className="p-3 text-gray-300">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-gray-300 font-semibold">{getLeaveDuration(req.startDate, req.endDate)}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span></td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {isAdmin && req.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => handleUpdateStatus(req.id, 'Approved')} className="p-1.5 rounded-full text-green-400 hover:bg-green-500/20"><CheckCircleIcon className="w-5 h-5"/></button>
                                                    <button onClick={() => { setSelectedRequest(req); setIsRejectModalOpen(true); }} className="p-1.5 rounded-full text-red-400 hover:bg-red-500/20"><AlertTriangleIcon className="w-5 h-5"/></button>
                                                </>
                                            )}
                                            {!isAdmin && req.status === 'Pending' && (
                                                <>
                                                    <button onClick={() => { setSelectedRequest(req); setIsEditModalOpen(true); }} className="text-xs text-emerald-400 hover:underline">Edit</button>
                                                    <button onClick={() => { setSelectedRequest(req); setIsConfirmCancelOpen(true); }} className="text-xs text-red-400 hover:underline">Cancel</button>
                                                </>
                                            )}
                                             <button onClick={() => onPrintRequest(req)} title="Print Form" className="p-1.5 rounded-full text-gray-400 hover:bg-white/10"><PrintIcon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <RequestLeaveModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} addToast={addToast} onAddRequest={handleAddRequest} policy={policy} />
            {selectedRequest && <EditLeaveRequestModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} addToast={addToast} onEditRequest={handleEditRequest} request={selectedRequest} policy={policy}/>}
            {selectedRequest && <RejectReasonModal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} onSubmit={(reason) => handleUpdateStatus(selectedRequest.id, 'Rejected', reason)}/>}
            {selectedRequest && <ConfirmationModal isOpen={isConfirmCancelOpen} onClose={() => setIsConfirmCancelOpen(false)} onConfirm={handleCancelRequest} title="Cancel Request" message="Are you sure you want to cancel this leave request?" confirmText="Confirm Cancel"/>}
        </div>
    );
};

export default LeaveManagement;