import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import ApplicantDashboard from './components/ApplicantDashboard';
import AiAssistant from './components/AiAssistant';
import Login from './src/components/Login';
import UserManagement from './src/components/UserManagement';
import LeaveManagement from './src/components/LeaveManagement';
import LeaveLedger from './src/components/LeaveLedger';
import ExamManagement from './src/components/ExamManagement';
import PreExamInstructions from './src/components/PreExamInstructions';
import ExamTaking from './src/components/ExamTaking';
import ProfileSettings from './src/components/ProfileSettings';
import Settings from './src/components/Settings';
import Reports from './src/components/Reports';
import { useAuth } from './src/contexts/AuthContext';
import Toast from './src/components/Toast';
import { UserIcon, MenuIcon } from './components/icons';
import { useTheme } from './src/contexts/ThemeContext';
import * as api from './src/utils/api';
import { Exam, View, LeaveRequest, User, LeaveLedgerEntry } from './types';
import MyExams from './src/components/MyExams';
import CreateAnnouncement from './components/CreateAnnouncement';
import Notifications from './src/components/Notifications';
import { generateLeaveFormPDF, generateLeaveLedgerPDF } from './src/utils/export';


export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme } = useTheme();

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const handleStartExam = async (examId: string) => {
    try {
        const examData = await api.getExam(examId);
        setActiveExam(examData);
        // Standardized flow: all users see instructions first.
        setActiveView('pre-exam-instructions');
    } catch {
        addToast("Could not load the exam. Please try again.", "error");
    }
  };

  const handleProceedToExam = () => {
    if (activeExam) {
      setActiveView('exam-taking');
    }
  }

  const handleFinishExam = () => {
    setActiveExam(null);
    setActiveView('dashboard');
  };

  const handlePrintRequest = useCallback(async (request: LeaveRequest) => {
    addToast('Generating Leave Form PDF...', 'info');
    try {
        const [userData, policyData] = await Promise.all([
            api.getUser(request.userId),
            api.getLeavePolicy()
        ]);
        generateLeaveFormPDF(request, userData, policyData);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        addToast('Could not generate PDF.', 'error');
    }
  }, [addToast]);

  const handlePrintLedger = useCallback((user: User, ledgerEntries: LeaveLedgerEntry[]) => {
    addToast('Generating Leave Ledger PDF...', 'info');
    try {
        generateLeaveLedgerPDF(user, ledgerEntries);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        addToast('Could not generate PDF.', 'error');
    }
  }, [addToast]);
  
  const renderContent = () => {
    const props = { addToast };
    
    // A helper to render the correct dashboard based on user role, used as a fallback.
    const renderUserDashboard = () => {
      if (user?.role === 'Admin') return <AdminDashboard />;
      if (user?.role === 'Employee') return <EmployeeDashboard setActiveView={setActiveView} onStartExam={handleStartExam} />;
      if (user?.role === 'Applicant') return <ApplicantDashboard onStartExam={handleStartExam} />;
      return <div className="text-center p-8">No dashboard available for your role.</div>;
    };

    switch (activeView) {
      case 'dashboard':
        return renderUserDashboard();

      case 'ai-assistant':
        // Admin and Employee view
        if (user?.role === 'Admin' || user?.role === 'Employee') return <AiAssistant {...props} />;
        return renderUserDashboard();

      case 'user-management':
        // Admin-only view
        if (user?.role === 'Admin') return <UserManagement {...props} />;
        return renderUserDashboard();

      case 'leave-requests':
        // Admin and Employee view
        if (user?.role === 'Admin' || user?.role === 'Employee') return <LeaveManagement {...props} onPrintRequest={handlePrintRequest} />;
        return renderUserDashboard();

      case 'leave-ledger':
        // Admin and Employee view
        if (user?.role === 'Admin' || user?.role === 'Employee') return <LeaveLedger {...props} onPrintLedger={handlePrintLedger} />;
        return renderUserDashboard();
        
      case 'exam-management':
        // Admin-only view
        if (user?.role === 'Admin') return <ExamManagement {...props} />;
        return renderUserDashboard();

       case 'create-announcement':
        // Admin-only view
        if (user?.role === 'Admin') return <CreateAnnouncement {...props} />;
        return renderUserDashboard();

       case 'pre-exam-instructions':
        // This view requires an active exam
        if (activeExam) {
            return <PreExamInstructions exam={activeExam} onStart={handleProceedToExam} />;
        }
        return renderUserDashboard();

      case 'exam-taking':
        // This view requires an active exam and a user
        if (user && activeExam) {
            return <ExamTaking 
                examId={activeExam.id}
                userId={user.id}
                onFinish={handleFinishExam}
                addToast={addToast}
                userRole={user.role}
            />;
        }
        return renderUserDashboard();

      case 'my-exams':
        // Employee and Applicant view
        if (user?.role === 'Employee' || user?.role === 'Applicant') {
            return <MyExams onStartExam={handleStartExam} />;
        }
        return renderUserDashboard();

      case 'profile-settings':
        return <ProfileSettings {...props} />; // All roles

      case 'settings':
        return <Settings {...props} />; // All roles

      case 'reports':
        // Admin and Employee view
        if (user?.role === 'Admin' || user?.role === 'Employee') return <Reports />;
        return renderUserDashboard();

      default:
        return renderUserDashboard();
    }
  };
  
  if (loading) {
    // You can replace this with a beautiful loading spinner component
    return (
       <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] flex items-center justify-center text-gray-800 dark:text-white">
         <UserIcon className="w-16 h-16 animate-pulse text-emerald-400"/>
       </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen font-sans relative overflow-hidden bg-gray-100 dark:bg-[#0D1117] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Background Glows */}
      {theme === 'dark' && (
        <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-600/20 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-600/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        </>
      )}
      
      <style>
        {`
          /* Fluid Typography & Mobile Enhancements */
          :root {
            font-size: clamp(14px, 1.2vw, 16px);
          }
          /* iOS Input Reset for consistent styling */
          input, textarea, select {
            -webkit-appearance: none;
          }

          :root {
             --sidebar-width: ${isSidebarOpen ? '16rem' : '5rem'};
          }
          #main-content {
            --p-base: 1rem;
            --p-sm: 1.5rem;
            --p-lg: 2rem;
            padding-top: calc(var(--p-base) + env(safe-area-inset-top, 0px));
            padding-right: calc(var(--p-base) + env(safe-area-inset-right, 0px));
            padding-bottom: calc(var(--p-base) + env(safe-area-inset-bottom, 0px));
            padding-left: calc(var(--p-base) + env(safe-area-inset-left, 0px));
          }
          @media (min-width: 640px) {
            #main-content {
                padding-top: calc(var(--p-sm) + env(safe-area-inset-top, 0px));
                padding-right: calc(var(--p-sm) + env(safe-area-inset-right, 0px));
                padding-bottom: calc(var(--p-sm) + env(safe-area-inset-bottom, 0px));
                padding-left: calc(var(--p-sm) + env(safe-area-inset-left, 0px));
            }
          }
          @media (min-width: 1024px) {
            #main-content {
                padding-top: calc(var(--p-lg) + env(safe-area-inset-top, 0px));
                padding-right: calc(var(--p-lg) + env(safe-area-inset-right, 0px));
                padding-bottom: calc(var(--p-lg) + env(safe-area-inset-bottom, 0px));
                padding-left: calc(var(--p-lg) + env(safe-area-inset-left, 0px));
            }
          }
          
          /* Global Animation System */
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fadeInUp { animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
          .animate-scaleIn { animation: scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
          .animate-fadeIn { animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
           *:focus-visible {
            outline: 3px solid #34d399;
            outline-offset: 2px;
            border-radius: 4px;
          }
          
          /* Global Custom Form Control Styles */
          .form-radio, .form-checkbox, .custom-checkbox {
              -webkit-appearance: none;
              appearance: none;
              transition: all 0.2s;
          }
          .form-radio:checked {
              background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
          }
          .form-checkbox:checked, .custom-checkbox:checked {
              background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
              background-size: 100% 100%;
              background-position: center;
              background-repeat: no-repeat;
          }
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
          
          /* Global Scrollbar Styles */
          .scrollbar-thin {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          }
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            border: 3px solid transparent;
          }

          /* Weather Icon Animations */
          @keyframes slow-pulse {
            50% { filter: brightness(1.2) drop-shadow(0 0 8px currentColor); }
          }
          .animate-slow-pulse { animation: slow-pulse 4s infinite ease-in-out; }

          @keyframes twinkle {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          .animate-twinkle { animation: twinkle 2.5s infinite; }

          @keyframes slow-drift {
            0%, 100% { transform: translateX(-2px); }
            50% { transform: translateX(2px); }
          }
          .animate-slow-drift { animation: slow-drift 8s infinite ease-in-out; }

          @keyframes rain-fall {
            to { transform: translateY(15px); opacity: 0; }
          }
          .animate-rain-fall { animation: rain-fall 1.2s infinite linear; }
        `}
      </style>

      
      <div id="app-wrapper" className="flex relative z-10">
        <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
            <div
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                aria-hidden="true"
            ></div>
        )}
        <main id="main-content" className={`flex-1 h-screen overflow-y-auto transition-all duration-300 md:ml-[var(--sidebar-width)]`}>
           <div className="flex justify-between items-center mb-6 md:justify-end">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden p-3 -m-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                    aria-label="Toggle navigation menu"
                    aria-controls="main-navigation"
                    aria-expanded={isSidebarOpen}
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
                 <Notifications addToast={addToast} setActiveView={setActiveView} />
            </div>
          {renderContent()}
        </main>
      </div>
      
      <div className="absolute top-5 right-5 z-[100]">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
};

export default App;