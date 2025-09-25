import React, { useState } from 'react';
import Modal from './Modal';
import * as api from '../utils/api';
import { User, Role } from '../../types';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    addToast: (message: string, type: 'success' | 'error') => void;
    onUserAdded: (user: User) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, addToast, onUserAdded }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('Employee');
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Name, email, and password are required.');
            return;
        }
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setError('');
        setIsSubmitting(true);
        try {
            const newUser = await api.createUser({
                name,
                email,
                role,
                department,
                password,
            });
            onUserAdded(newUser);
            addToast(`User ${name} created successfully.`, 'success');
            onClose();
            // Reset form
            setName('');
            setEmail('');
            setRole('Employee');
            setDepartment('');
            setPassword('');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create user. Email may already be in use.';
            addToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New User">
             <div className="space-y-4">
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" className={inputClasses} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className={inputClasses} />
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department (e.g., Engineering)" className={inputClasses} />
                <select value={role} onChange={e => setRole(e.target.value as Role)} className={inputClasses}>
                    <option value="Employee">Employee</option>
                    <option value="Applicant">Applicant</option>
                    <option value="Admin">Admin</option>
                </select>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Initial Password" className={inputClasses} />
                
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
                    ) : 'Add User'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddUserModal;