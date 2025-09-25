import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, ExamResult } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';
import { CloseIcon, CalendarIcon, BookOpenIcon, CheckCircleIcon, AlertTriangleIcon, CameraIcon } from '../../components/icons';

interface UserProfileDrawerProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error') => void;
  onUserUpdate: (user: User) => void;
}

const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({ user, isOpen, onClose, addToast, onUserUpdate }) => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = `drawer-title-${user?.id}`;

  const [leaveBalances, setLeaveBalances] = useState(user?.leaveBalances);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'All' | 'Passed' | 'Failed' | 'Pending'>('All');
  const [sortOption, setSortOption] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc');

  useEffect(() => {
    if (user) {
      setLeaveBalances(user.leaveBalances);
    }
  }, [user]);

  // Focus trapping for accessibility
   useEffect(() => {
    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !drawerRef.current) return;
      
      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    if (isOpen) {
        document.addEventListener('keydown', handleFocusTrap);
        // FIX: Cast querySelector result to HTMLElement to access focus method.
        setTimeout(() => (drawerRef.current?.querySelector('button, input, select') as HTMLElement)?.focus(), 100);
    }
    
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen]);

  
  const displayedExams = useMemo(() => {
    if (!user?.examHistory) return [];

    const filtered = user.examHistory.filter(exam => {
      if (filterStatus === 'All') return true;
      return exam.status === filterStatus;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'score-desc':
          return b.score - a.score;
        case 'score-asc':
          return a.score - b.score;
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [user?.examHistory, filterStatus, sortOption]);

  const handleLeaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLeaveBalances(prev => prev ? { ...prev, [name]: parseInt(value) || 0 } : undefined);
  };

  const handleSaveChanges = async () => {
    if (!user || !leaveBalances) return;
    setIsUpdating(true);
    try {
      const updatedUser = await api.updateUser(user.id, { leaveBalances });
      onUserUpdate(updatedUser);
      addToast('Leave balances updated successfully.', 'success');
      onClose();
    } catch (error) {
      addToast('Failed to update leave balances.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePictureChange = async () => {
    if (!user) return;
    setIsUploading(true);
    try {
        const updatedUser = await api.updateUserProfilePicture(user.id);
        onUserUpdate(updatedUser);
        addToast(`${user.name}'s profile picture updated!`, 'success');
    } catch (error) {
        addToast('Failed to update profile picture.', 'error');
    } finally {
        setIsUploading(false);
    }
  };

  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-300';
      case 'Inactive': return 'bg-red-500/20 text-red-300';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getExamStatusIcon = (status: ExamResult['status']) => {
    switch (status) {
        case 'Passed': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
        case 'Failed': return <AlertTriangleIcon className="w-5 h-5 text-red-400" />;
        case 'Pending': return <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />;
        default: return null;
    }
  };

  const hasLeaveChanged = useCallback(() => {
    if (!user || !leaveBalances) return false;
    return user.leaveBalances.vacation !== leaveBalances.vacation || user.leaveBalances.sick !== leaveBalances.sick;
  }, [user, leaveBalances]);

  if (!user) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-black/50 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 id={titleId} className="text-xl font-bold text-white">User Profile</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close user profile">
              <CloseIcon className="w-6 h-6 text-gray-300" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border-2 border-emerald-400" />
                 {isAdmin && (
                    <button
                        onClick={handlePictureChange}
                        disabled={isUploading}
                        aria-label={`Change ${user.name}'s profile picture`}
                        className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center text-white opacity-70 hover:opacity-100 transition-opacity"
                    >
                        {isUploading 
                            ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            : <CameraIcon className="w-8 h-8" />
                        }
                    </button>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                <p className="text-gray-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm px-2 py-1 bg-white/10 rounded-full">{user.role}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusBadge(user.status)}`}>{user.status}</span>
                </div>
              </div>
            </div>

            {/* Leave Balance */}
            {user.role !== 'Applicant' && (
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                      <CalendarIcon className="w-6 h-6 text-emerald-300" />
                      <h4 className="text-lg font-semibold text-white">Leave Balance</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="vacation-days" className="text-sm text-gray-400 block mb-1">Vacation Days</label>
                          {isAdmin ? (
                              <input id="vacation-days" type="number" name="vacation" value={leaveBalances?.vacation} onChange={handleLeaveChange} className="w-full bg-black/40 border border-white/20 rounded-md px-3 py-2 text-white text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                          ) : (
                              <p className="text-xl font-semibold text-white">{user.leaveBalances.vacation}</p>
                          )}
                      </div>
                       <div>
                          <label htmlFor="sick-days" className="text-sm text-gray-400 block mb-1">Sick Days</label>
                          {isAdmin ? (
                              <input id="sick-days" type="number" name="sick" value={leaveBalances?.sick} onChange={handleLeaveChange} className="w-full bg-black/40 border border-white/20 rounded-md px-3 py-2 text-white text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                          ) : (
                              <p className="text-xl font-semibold text-white">{user.leaveBalances.sick}</p>
                          )}
                      </div>
                  </div>
                   {isAdmin && hasLeaveChanged() && (
                      <div className="mt-4 flex justify-end">
                           <button
                              onClick={handleSaveChanges}
                              disabled={isUpdating}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg text-sm hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                              {isUpdating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Changes'}
                          </button>
                      </div>
                  )}
              </div>
            )}

            {/* Exam History */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <BookOpenIcon className="w-6 h-6 text-emerald-300" />
                  <h4 className="text-lg font-semibold text-white">Exam History</h4>
                </div>
                {user.examHistory.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="exam-filter-status" className="sr-only">Filter exams by status</label>
                    <select
                      id="exam-filter-status"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Passed' | 'Failed' | 'Pending')}
                      className="bg-black/40 border border-white/20 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Passed">Passed</option>
                      <option value="Failed">Failed</option>
                       <option value="Pending">Pending</option>
                    </select>
                     <label htmlFor="exam-sort-option" className="sr-only">Sort exams</label>
                    <select
                      id="exam-sort-option"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc')}
                      className="bg-black/40 border border-white/20 rounded-md px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="score-desc">Score: High-Low</option>
                      <option value="score-asc">Score: Low-High</option>
                    </select>
                  </div>
                )}
              </div>
              <ul className="space-y-3">
                {displayedExams.length > 0 ? displayedExams.map(exam => (
                  <li key={exam.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{exam.name}</p>
                       <p className="text-sm text-gray-400">
                        {exam.status === 'Pending' ? 'Pending submission' : `Completed on ${new Date(exam.date).toLocaleDateString()}`}
                       </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {exam.status !== 'Pending' && <span className="text-lg font-semibold text-white">{exam.score}%</span>}
                        {getExamStatusIcon(exam.status)}
                    </div>
                  </li>
                )) : (
                    <p className="text-center text-gray-400 py-4">
                        {user.examHistory.length > 0 ? 'No exams match your filters.' : 'No exam history found.'}
                    </p>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfileDrawer;