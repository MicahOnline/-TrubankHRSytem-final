import React from 'react';
import { DashboardIcon, ChatIcon, SettingsIcon, UserIcon, LogoutIcon, LogoIcon, UsersManagementIcon, CalendarIcon, BookOpenIcon, MegaphoneIcon, ChevronLeftIcon, LedgerIcon, ClipboardListIcon, ChartBarIcon } from './icons';
import { useAuth } from '../src/contexts/AuthContext';
// FIX: The 'View' type is exported from `types.ts`, not `App.tsx`.
import { View } from '../types';


interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}> = ({ icon, label, isActive, onClick, isCollapsed }) => (
  <div title={isCollapsed ? label : undefined}>
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 ease-in-out transform ${
        isActive
          ? 'bg-emerald-100 dark:bg-white/20 text-emerald-600 dark:text-white shadow-lg'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/40 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
      } ${isCollapsed ? 'justify-center hover:scale-110' : 'hover:translate-x-1'}`}
    >
      {icon}
      {!isCollapsed && <span className="ml-4 font-medium whitespace-nowrap">{label}</span>}
    </button>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  
  const handleNavigation = (view: View) => {
    setActiveView(view);
    // The `md` breakpoint in Tailwind is 768px.
    // On smaller screens, close the sidebar after navigation.
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };
  
  const commonNav = (isCollapsed: boolean) => (
       <nav className="flex-1 flex flex-col gap-2 px-2">
        <NavItem
          icon={<DashboardIcon className="w-6 h-6" />}
          label="Dashboard"
          isActive={activeView === 'dashboard'}
          onClick={() => handleNavigation('dashboard')}
          isCollapsed={isCollapsed}
        />
        {(user?.role === 'Admin' || user?.role === 'Employee') && (
          <NavItem
            icon={<ChatIcon className="w-6 h-6" />}
            label="AI Assistant"
            isActive={activeView === 'ai-assistant'}
            onClick={() => handleNavigation('ai-assistant')}
            isCollapsed={isCollapsed}
          />
        )}
        {user?.role === 'Admin' && (
          <>
            <NavItem
              icon={<UsersManagementIcon className="w-6 h-6" />}
              label="User Management"
              isActive={activeView === 'user-management'}
              onClick={() => handleNavigation('user-management')}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<MegaphoneIcon className="w-6 h-6" />}
              label="Announcements"
              isActive={activeView === 'create-announcement'}
              onClick={() => handleNavigation('create-announcement')}
              isCollapsed={isCollapsed}
            />
             <NavItem
              icon={<ClipboardListIcon className="w-6 h-6" />}
              label="Exam Management"
              isActive={activeView === 'exam-management'}
              onClick={() => handleNavigation('exam-management')}
              isCollapsed={isCollapsed}
            />
          </>
        )}
        {(user?.role === 'Admin' || user?.role === 'Employee') && (
          <>
            <NavItem
              icon={<CalendarIcon className="w-6 h-6" />}
              label="Leave Requests"
              isActive={activeView === 'leave-requests'}
              onClick={() => handleNavigation('leave-requests')}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<LedgerIcon className="w-6 h-6" />}
              label="Leave Ledger"
              isActive={activeView === 'leave-ledger'}
              onClick={() => handleNavigation('leave-ledger')}
              isCollapsed={isCollapsed}
            />
          </>
        )}
         {(user?.role === 'Employee' || user?.role === 'Applicant') && (
            <NavItem
                icon={<BookOpenIcon className="w-6 h-6" />}
                label="My Exams"
                isActive={activeView === 'my-exams'}
                onClick={() => handleNavigation('my-exams')}
                isCollapsed={isCollapsed}
            />
        )}
        {(user?.role === 'Admin' || user?.role === 'Employee') && (
           <NavItem
              icon={<ChartBarIcon className="w-6 h-6" />}
              label="Reports"
              isActive={activeView === 'reports'}
              onClick={() => handleNavigation('reports')}
              isCollapsed={isCollapsed}
          />
        )}
        <NavItem
          icon={<UserIcon className="w-6 h-6" />}
          label="Profile"
          isActive={activeView === 'profile-settings'}
          onClick={() => handleNavigation('profile-settings')}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={<SettingsIcon className="w-6 h-6" />}
          label="Settings"
          isActive={activeView === 'settings'}
          onClick={() => handleNavigation('settings')}
          isCollapsed={isCollapsed}
        />
      </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="main-navigation"
        role="navigation"
        aria-label="Main navigation"
        className={`hidden md:flex flex-col bg-gray-200/50 dark:bg-black/30 backdrop-blur-xl border-r border-gray-300/50 dark:border-white/10 h-screen fixed top-0 left-0 z-20 transition-all duration-300 print:hidden ${isOpen ? 'w-64' : 'w-20'}`}
      >
        <div className={`flex items-center p-4 mb-8 ${isOpen ? 'justify-start' : 'justify-center'}`}>
            <LogoIcon className="w-10 h-10 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            {isOpen && <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">TRUBank HR</h1>}
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin">
            {commonNav(!isOpen)}
        </div>

        <div className="mt-auto p-2">
         <div 
            className={`flex items-center mb-2 px-2 py-3 rounded-lg transition-all duration-200 ${isOpen ? 'bg-black/10 dark:bg-white/5' : ''}`}
            title={!isOpen ? user?.name : undefined}
          >
            <img src={user?.avatarUrl} alt="Your avatar" className="w-10 h-10 rounded-full flex-shrink-0" />
            {isOpen && (
                <div className="ml-3 overflow-hidden">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
            )}
          </div>
         <NavItem
          icon={<LogoutIcon className="w-6 h-6" />}
          label="Logout"
          isActive={false}
          onClick={logout}
          isCollapsed={!isOpen}
        />
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-full flex justify-center items-center p-3 mt-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-300/40 dark:hover:bg-white/10 transition-all"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isOpen}
        >
          <ChevronLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}/>
        </button>
      </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
       <aside
        id="main-navigation-mobile"
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 h-full flex flex-col bg-gray-200/80 dark:bg-black/50 backdrop-blur-xl border-r border-gray-300/50 dark:border-white/10 z-40 transition-transform duration-300 md:hidden print:hidden ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}
      >
        <div className="flex items-center p-4 mb-8">
            <LogoIcon className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">TRUBank HR</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin">
            {commonNav(false)}
        </div>

        <div className="mt-auto p-2">
         <div className="flex items-center mb-2 px-2 py-3 rounded-lg bg-black/10 dark:bg-white/5">
            <img src={user?.avatarUrl} alt="Your avatar" className="w-10 h-10 rounded-full" />
            <div className="ml-3 overflow-hidden">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
         <NavItem
          icon={<LogoutIcon className="w-6 h-6" />}
          label="Logout"
          isActive={false}
          onClick={logout}
          isCollapsed={false}
        />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;