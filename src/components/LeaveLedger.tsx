import React, { useState, useEffect, useMemo } from 'react';
import { LeaveLedgerEntry, User } from '../../types';
import * as api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { LedgerIcon, PlusIcon, PrintIcon } from '../../components/icons';
import ManualAdjustmentModal from './ManualAdjustmentModal';
import SkeletonLoader from './SkeletonLoader';

interface LeaveLedgerProps {
  addToast: (message: string, type: 'success' | 'error') => void;
  onPrintLedger: (user: User, ledgerEntries: LeaveLedgerEntry[]) => void;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

const LeaveLedger: React.FC<LeaveLedgerProps> = ({ addToast, onPrintLedger }) => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'Admin';
    
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(isAdmin ? null : currentUser!.id);
    const [ledgerEntries, setLedgerEntries] = useState<LeaveLedgerEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            api.getUsers().then(users => {
                const employees = users.filter(u => u.role === 'Employee' || u.role === 'Admin');
                setAllUsers(employees);
            }).catch(() => addToast('Failed to load users.', 'error'));
        }
    }, [isAdmin, addToast]);
    
    useEffect(() => {
        if (selectedUserId) {
            setLoading(true);
            api.getLeaveLedger(selectedUserId)
                .then(setLedgerEntries)
                .catch(() => addToast('Failed to load leave ledger.', 'error'))
                .finally(() => setLoading(false));
        } else {
            setLedgerEntries([]);
        }
    }, [selectedUserId, addToast]);
    
    const selectedUser = useMemo(() => {
        if (isAdmin) return allUsers.find(u => u.id === selectedUserId);
        return currentUser;
    }, [isAdmin, allUsers, selectedUserId, currentUser]);
    
    const handleLedgerUpdate = (newEntry: LeaveLedgerEntry) => {
        setLedgerEntries(prev => [newEntry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        if (isAdmin && selectedUser) {
           const updatedUsers = allUsers.map(u => u.id === selectedUser.id ? { ...u, leaveBalances: { vacation: newEntry.vacationBalance, sick: newEntry.sickBalance } } : u);
           setAllUsers(updatedUsers);
        }
    };

    const getTransactionColor = (days: number) => {
        return days > 0 ? 'text-green-400' : 'text-red-400';
    };

    return (
        <>
            <div className="space-y-8 animate-fadeInUp">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Leave Ledger</h1>
                        <p className="text-gray-400 mt-1">View a detailed history of leave transactions.</p>
                    </div>
                    {isAdmin && selectedUser && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => onPrintLedger(selectedUser, ledgerEntries)} className="px-4 py-2 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"><PrintIcon className="w-5 h-5"/> Print Ledger</button>
                            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"><PlusIcon className="w-5 h-5"/> Manual Adjustment</button>
                        </div>
                    )}
                     {!isAdmin && selectedUser && (
                        <button onClick={() => onPrintLedger(selectedUser, ledgerEntries)} className="px-4 py-2 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"><PrintIcon className="w-5 h-5"/> Print Ledger</button>
                    )}
                </div>
                
                {isAdmin && (
                    <GlassCard>
                         <label htmlFor="user-select-ledger" className="block text-sm font-medium text-gray-300 mb-2">Select Employee</label>
                         <select id="user-select-ledger" value={selectedUserId || ''} onChange={(e) => setSelectedUserId(Number(e.target.value))} className="w-full md:w-1/2 bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                             <option value="" disabled>-- Select an employee --</option>
                             {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                         </select>
                    </GlassCard>
                )}
                
                {selectedUser && (
                     <GlassCard>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedUser.name}'s Ledger</h2>
                                    <p className="text-gray-400">{selectedUser.department}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-white">{selectedUser.leaveBalances.vacation}</p>
                                    <p className="text-sm text-gray-400">Vacation Days</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{selectedUser.leaveBalances.sick}</p>
                                    <p className="text-sm text-gray-400">Sick Days</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="p-3 text-sm font-semibold text-gray-400">Date</th>
                                        <th className="p-3 text-sm font-semibold text-gray-400">Transaction</th>
                                        <th className="p-3 text-sm font-semibold text-gray-400 text-right">Days</th>
                                        <th className="p-3 text-sm font-semibold text-gray-400 text-right">Vacation Balance</th>
                                        <th className="p-3 text-sm font-semibold text-gray-400 text-right">Sick Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <SkeletonLoader rows={5} columns={5} />
                                    ) : ledgerEntries.length > 0 ? (
                                        ledgerEntries.map(entry => (
                                            <tr key={entry.id} className="border-b border-white/10 align-middle">
                                                <td className="p-3 text-gray-300">{new Date(entry.date + 'T00:00:00').toLocaleDateString()}</td>
                                                <td className="p-3 text-gray-300">
                                                    {entry.transactionType}
                                                    {entry.notes && <p className="text-xs text-gray-500">{entry.notes}</p>}
                                                </td>
                                                <td className={`p-3 font-mono text-right ${getTransactionColor(entry.days)}`}>
                                                    {entry.days > 0 ? `+${entry.days.toFixed(2)}` : entry.days.toFixed(2)}
                                                </td>
                                                <td className="p-3 font-mono text-right text-white">{entry.vacationBalance.toFixed(2)}</td>
                                                <td className="p-3 font-mono text-right text-white">{entry.sickBalance.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="text-center p-8 text-gray-400">No transactions found for this user.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                     </GlassCard>
                )}
                
                {!selectedUser && isAdmin && (
                     <div className="text-center p-8 text-gray-400">
                        <LedgerIcon className="w-12 h-12 mx-auto mb-4 text-gray-600"/>
                        Please select an employee to view their leave ledger.
                    </div>
                )}
            </div>
             {selectedUser && (
                <ManualAdjustmentModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    user={selectedUser} 
                    addToast={addToast} 
                    onLedgerUpdate={handleLedgerUpdate}
                />
            )}
            <style>{`.animate-fadeInUp { animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </>
    );
};

export default LeaveLedger;