import React, { useState, useEffect, useMemo } from 'react';
import { User, Role, Status } from '../../types';
import * as api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { SearchIcon, PlusIcon, ArrowsUpDownIcon } from '../../components/icons';
import UserProfileDrawer from './UserProfileDrawer';
import AddUserModal from './AddUserModal';
import ConfirmationModal from './ConfirmationModal';
import SkeletonLoader from './SkeletonLoader';

interface UserManagementProps {
    addToast: (message: string, type: 'success' | 'error') => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ addToast }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<Role | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState<{ action: 'status' | 'password'; user: User; newStatus?: Status } | null>(null);

    useEffect(() => {
        setIsLoading(true);
        api.getUsers()
            .then(setUsers)
            .catch(() => addToast('Failed to load users.', 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const handleSort = (key: keyof User) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredUsers = useMemo(() => {
        let filtered = users
            .filter(u => filterRole === 'all' || u.role === filterRole)
            .filter(u => filterStatus === 'all' || u.status === filterStatus)
            .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [users, searchTerm, filterRole, filterStatus, sortConfig]);

    const handleUserUpdate = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleUserAdded = (newUser: User) => {
        setUsers(prev => [...prev, newUser]);
    };
    
    const handleViewProfile = (user: User) => {
        setSelectedUser(user);
        setIsDrawerOpen(true);
    };

    const confirmStatusChange = (user: User) => {
        const newStatus: Status = user.status === 'Active' ? 'Inactive' : 'Active';
        setActionToConfirm({ action: 'status', user, newStatus });
        setIsConfirmModalOpen(true);
    };

    const confirmPasswordReset = (user: User) => {
        setActionToConfirm({ action: 'password', user });
        setIsConfirmModalOpen(true);
    };
    
    const executeConfirmedAction = async () => {
        if (!actionToConfirm) return;
        const { action, user, newStatus } = actionToConfirm;
        
        try {
            if (action === 'status' && newStatus) {
                const updatedUser = await api.updateUser(user.id, { status: newStatus });
                handleUserUpdate(updatedUser);
                addToast(`${user.name}'s status changed to ${newStatus}.`, 'success');
            } else if (action === 'password') {
                await api.resetPassword(user.id);
                addToast(`Password reset for ${user.name}.`, 'success');
            }
        } catch {
            addToast(`Failed to perform action for ${user.name}.`, 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setActionToConfirm(null);
        }
    };

    const getStatusBadge = (status: Status) => {
        switch (status) {
            case 'Active': return 'bg-green-500/20 text-green-300';
            case 'Inactive': return 'bg-red-500/20 text-red-300';
            case 'Pending': return 'bg-yellow-500/20 text-yellow-300';
        }
    };

    const ThWithSort = ({ label, sortKey }: { label: string, sortKey: keyof User }) => (
        <th className="p-3 text-sm font-semibold text-gray-400 cursor-pointer" onClick={() => handleSort(sortKey)}>
            <div className="flex items-center gap-1">
                {label}
                {sortConfig?.key === sortKey && <ArrowsUpDownIcon className={`w-4 h-4 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />}
            </div>
        </th>
    );

    return (
        <div className="space-y-6 animate-fadeInUp">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-1">Manage all users across the organization.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105">
                    <PlusIcon className="w-5 h-5"/> Add User
                </button>
            </div>

            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="relative md:col-span-2">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                    </div>
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value as Role | 'all')} className="bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="all">All Roles</option><option value="Admin">Admin</option><option value="Employee">Employee</option><option value="Applicant">Applicant</option></select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as Status | 'all')} className="bg-black/40 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="all">All Statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option></select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-3 text-sm font-semibold text-gray-400">User</th>
                                <ThWithSort label="Role" sortKey="role" />
                                <ThWithSort label="Status" sortKey="status" />
                                <ThWithSort label="Last Login" sortKey="lastLogin" />
                                <th className="p-3 text-sm font-semibold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <SkeletonLoader rows={5} columns={5} />
                            ) : (
                                sortedAndFilteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full"/>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white truncate">{user.name}</p>
                                                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-300">{user.role}</td>
                                        <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}>{user.status}</span></td>
                                        <td className="p-3 text-gray-400">{new Date(user.lastLogin).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleViewProfile(user)} className="text-xs text-emerald-400 hover:underline">View</button>
                                                <button onClick={() => confirmStatusChange(user)} className="text-xs text-yellow-400 hover:underline">Toggle Status</button>
                                                <button onClick={() => confirmPasswordReset(user)} className="text-xs text-cyan-400 hover:underline">Reset Pass</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <UserProfileDrawer user={selectedUser} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} addToast={addToast} onUserUpdate={handleUserUpdate}/>
            <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} addToast={addToast} onUserAdded={handleUserAdded}/>
            {actionToConfirm && (
                <ConfirmationModal 
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={executeConfirmedAction}
                    title={`Confirm Action: ${actionToConfirm.user.name}`}
                    message={
                        actionToConfirm.action === 'status'
                        ? `Are you sure you want to change this user's status to ${actionToConfirm.newStatus}?`
                        : `Are you sure you want to reset this user's password? An email would be sent to them.`
                    }
                    confirmText="Confirm"
                />
            )}
        </div>
    );
};

export default UserManagement;