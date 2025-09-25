import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, CloseIcon, BellIcon } from '../../components/icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      // Allow time for fade-out animation before calling onClose
      setTimeout(onClose, 300); 
    }, 4700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
      setShow(false);
      setTimeout(onClose, 300);
  }

  const typeStyles = {
    success: {
      bgColor: 'bg-green-500/20 border-green-500/50',
      textColor: 'text-green-300',
      Icon: CheckCircleIcon,
    },
    error: {
      bgColor: 'bg-red-500/20 border-red-500/50',
      textColor: 'text-red-300',
      Icon: AlertTriangleIcon,
    },
    info: {
        bgColor: 'bg-cyan-500/20 border-cyan-500/50',
        textColor: 'text-cyan-300',
        Icon: BellIcon,
    },
  };

  const { bgColor, textColor, Icon } = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`relative flex items-center p-4 mb-4 w-full max-w-xs text-white rounded-lg shadow-lg transition-all duration-300 transform ${bgColor} backdrop-blur-md border ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      role="alert"
    >
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${textColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="ml-3 text-sm font-normal text-gray-200">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white/10 text-gray-400 hover:text-white rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-white/20 inline-flex h-8 w-8"
        onClick={handleClose}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;