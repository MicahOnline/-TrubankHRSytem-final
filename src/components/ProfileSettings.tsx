import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../utils/api';
import { UserIcon, ShieldCheckIcon, BellIcon, CameraIcon } from '../../components/icons';

interface ProfileSettingsProps {
    addToast: (message: string, type: 'success' | 'error') => void;
}

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ addToast }) => {
    const { user, login } = useAuth(); // Use login to refresh user state
    const [profileData, setProfileData] = useState({ name: '', department: '' });
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [notificationPrefs, setNotificationPrefs] = useState({ email: true, push: true });
    
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, department: user.department });
            setNotificationPrefs(user.notifications || { email: true, push: true });
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setNotificationPrefs(prev => ({ ...prev, [name]: checked }));
    };

    const handlePictureChange = async () => {
        if (!user) return;
        setIsUploading(true);
        try {
            await api.updateUserProfilePicture(user.id);
            await login(String(user.id)); // Refresh user state globally
            addToast('Profile picture updated!', 'success');
        } catch (error) {
            addToast('Failed to update profile picture.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        if (!profileData.name.trim()) {
            addToast('Name cannot be empty.', 'error');
            return;
        }

        setIsSavingProfile(true);
        try {
            await api.updateUser(user.id, profileData);
            await login(String(user.id)); // Refresh global user state
            addToast('Profile updated successfully!', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile.';
            addToast(errorMessage, 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };
    
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (passwordData.new !== passwordData.confirm) {
            addToast('New passwords do not match.', 'error');
            return;
        }
        if (passwordData.new.length < 8) {
             addToast('New password must be at least 8 characters.', 'error');
            return;
        }
        setIsChangingPassword(true);
        try {
            await api.changePassword(user.id, passwordData.current, passwordData.new);
            addToast('Password changed successfully!', 'success');
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error) {
            addToast('Failed to change password. Check your current password.', 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };
    
    const handleSaveNotifications = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSavingNotifications(true);
        try {
            await api.updateUser(user.id, { notifications: notificationPrefs });
            await login(String(user.id)); // Refresh global user state
            addToast('Notification settings saved!', 'success');
        } catch (error) {
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSavingNotifications(false);
        }
    };
    
    const renderButtonContent = (isLoading: boolean, text: string) => isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : text;
    
    const inputClasses = "w-full bg-gray-200/50 dark:bg-black/40 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-fadeInUp">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal information and preferences.</p>
            </div>

            <form onSubmit={handleSaveProfile}>
                <GlassCard>
                    <div className="flex items-center gap-3 mb-4">
                        <UserIcon className="w-6 h-6 text-emerald-500 dark:text-emerald-300" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Profile Information</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="relative group flex-shrink-0">
                                <img src={user?.avatarUrl} alt="Your profile avatar" className="w-20 h-20 rounded-full border-2 border-emerald-400" />
                                <button
                                    type="button"
                                    onClick={handlePictureChange}
                                    disabled={isUploading}
                                    aria-label="Change profile picture"
                                    className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity"
                                >
                                    {isUploading 
                                        ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        : <CameraIcon className="w-8 h-8" />
                                    }
                                </button>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="profile-name" className={labelClasses}>Full Name</label>
                                <input id="profile-name" type="text" name="name" value={profileData.name} onChange={handleProfileChange} className={inputClasses} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="profile-email" className={labelClasses}>Email Address</label>
                            <input id="profile-email" type="email" value={user?.email} readOnly className="w-full bg-gray-300/50 dark:bg-black/80 border border-gray-400/50 dark:border-white/10 rounded-lg px-4 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                        </div>
                        <div>
                            <label htmlFor="profile-department" className={labelClasses}>Department</label>
                            <input id="profile-department" type="text" name="department" value={profileData.department} onChange={handleProfileChange} className={inputClasses} />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button type="submit" disabled={isSavingProfile} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                           {renderButtonContent(isSavingProfile, 'Save Changes')}
                        </button>
                    </div>
                </GlassCard>
            </form>
            
            <form onSubmit={handleChangePassword}>
                <GlassCard>
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheckIcon className="w-6 h-6 text-blue-500 dark:text-blue-300" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Change Password</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                           <label htmlFor="password-current" className={labelClasses}>Current Password</label>
                           <input id="password-current" type="password" name="current" placeholder="Current Password" value={passwordData.current} onChange={handlePasswordChange} className={inputClasses} autoComplete="current-password" />
                        </div>
                        <div>
                           <label htmlFor="password-new" className={labelClasses}>New Password</label>
                           <input id="password-new" type="password" name="new" placeholder="New Password" value={passwordData.new} onChange={handlePasswordChange} className={inputClasses} autoComplete="new-password" />
                        </div>
                        <div>
                           <label htmlFor="password-confirm" className={labelClasses}>Confirm New Password</label>
                           <input id="password-confirm" type="password" name="confirm" placeholder="Confirm New Password" value={passwordData.confirm} onChange={handlePasswordChange} className={inputClasses} autoComplete="new-password" />
                        </div>
                    </div>
                     <div className="mt-6 flex justify-end">
                        <button type="submit" disabled={isChangingPassword} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 flex items-center justify-center min-w-[160px]">
                           {renderButtonContent(isChangingPassword, 'Change Password')}
                        </button>
                    </div>
                </GlassCard>
            </form>

            <form onSubmit={handleSaveNotifications}>
                <GlassCard>
                     <div className="flex items-center gap-3 mb-4">
                        <BellIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-300" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Notifications</h3>
                    </div>
                    <div className="space-y-3">
                        <label htmlFor="email-notifications" className="flex items-center justify-between p-3 bg-gray-200/50 dark:bg-white/5 rounded-lg border border-gray-300/50 dark:border-white/10 cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Receive emails for leave approvals, exam assignments, and announcements.</p>
                            </div>
                            <input id="email-notifications" type="checkbox" role="switch" aria-checked={notificationPrefs.email} name="email" checked={notificationPrefs.email} onChange={handleNotificationChange} className="form-switch h-5 w-5 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600" />
                        </label>
                         <label htmlFor="push-notifications" className="flex items-center justify-between p-3 bg-gray-200/50 dark:bg-white/5 rounded-lg border border-gray-300/50 dark:border-white/10 cursor-pointer">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Get real-time alerts on your devices (PWA feature).</p>
                            </div>
                            <input id="push-notifications" type="checkbox" role="switch" aria-checked={notificationPrefs.push} name="push" checked={notificationPrefs.push} onChange={handleNotificationChange} className="form-switch h-5 w-5 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-600" />
                        </label>
                    </div>
                     <div className="mt-6 flex justify-end">
                        <button type="submit" disabled={isSavingNotifications} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 flex items-center justify-center min-w-[180px]">
                           {renderButtonContent(isSavingNotifications, 'Save Notification Prefs')}
                        </button>
                    </div>
                </GlassCard>
            </form>
            <style>{`
                .form-switch {
                    -webkit-appearance: none;
                    appearance: none;
                    transition: all 0.2s;
                    width: 2.5rem;
                    height: 1.5rem;
                    border-radius: 9999px;
                    background-color: rgb(209 213 219);
                    position: relative;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .dark .form-switch {
                     background-color: rgb(55 65 81);
                }
                .form-switch:before {
                    content: '';
                    position: absolute;
                    top: 0.25rem;
                    left: 0.25rem;
                    width: 1rem;
                    height: 1rem;
                    background-color: white;
                    border-radius: 50%;
                    transition: transform 0.2s;
                }
                .form-switch:checked {
                    background-color: #34d399;
                }
                 .form-switch:checked:before {
                    transform: translateX(1rem);
                }
            `}</style>
        </div>
    );
};

export default ProfileSettings;