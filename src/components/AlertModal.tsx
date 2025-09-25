import React from 'react';
import Modal from './Modal';
import { AlertTriangleIcon } from '../../components/icons';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start gap-4">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-500/20 sm:mx-0 sm:h-10 sm:w-10">
          <AlertTriangleIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="mt-0 text-left">
          <p className="text-sm text-gray-300 whitespace-pre-line">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <button
          type="button"
          className="inline-flex justify-center rounded-lg border border-transparent bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          onClick={onClose}
        >
          I Understand
        </button>
      </div>
    </Modal>
  );
};

export default AlertModal;