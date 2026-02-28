import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

export type ModalType = 'confirm' | 'alert' | 'prompt' | 'success' | 'error' | 'warning' | 'info';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (value?: string) => void;
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  isLoading?: boolean;
  showCancel?: boolean;
  inputRequired?: boolean;
  inputLabel?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  placeholder = '',
  isLoading = false,
  showCancel = true,
  inputRequired = false,
  inputLabel = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setInputError('');
    }
  }, [isOpen]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt' && inputRequired && !inputValue.trim()) {
      setInputError('This field is required');
      return;
    }
    onConfirm?.(type === 'prompt' ? inputValue : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />;
      case 'error':
        return <AlertCircle size={28} className="text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle size={28} className="text-amber-600 dark:text-amber-400" />;
      case 'info':
        return <Info size={28} className="text-blue-600 dark:text-blue-400" />;
      case 'confirm':
      case 'prompt':
      default:
        return <AlertCircle size={28} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-500/10';
      case 'error':
        return 'bg-red-50 dark:bg-red-500/10';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-500/10';
      case 'info':
      case 'confirm':
      case 'prompt':
      default:
        return 'bg-blue-50 dark:bg-blue-500/10';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 shadow-red-600/30';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30';
      case 'info':
      case 'confirm':
      case 'prompt':
      default:
        return 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30';
    }
  };

  const isAlertType = type === 'alert' || type === 'success' || type === 'error' || type === 'warning' || type === 'info';

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[8px] pointer-events-auto" onClick={(e) => { if (!isLoading) onClose(); }} />
      <div 
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 pointer-events-auto"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0 -mt-1 -mr-1"
            >
              <X size={20} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Prompt Input */}
        {type === 'prompt' && (
          <div className="px-6 pt-4">
            {inputLabel && (
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {inputLabel}
              </label>
            )}
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setInputError('');
              }}
              placeholder={placeholder}
              rows={3}
              disabled={isLoading}
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none ${
                inputError ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
              }`}
              autoFocus
            />
            {inputError && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                {inputError}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 pt-2">
          {showCancel && !isAlertType && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 ${getConfirmButtonClass()}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? 'Processing...' : (isAlertType ? 'OK' : confirmText)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Custom hook for easy modal management
export interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  inputLabel?: string;
  inputRequired?: boolean;
  onConfirm?: (value?: string) => void;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const showModal = (options: Omit<ModalState, 'isOpen'>) => {
    setModalState({
      ...options,
      isOpen: true,
    });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setIsLoading(false);
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    return new Promise<void>((resolve) => {
      showModal({
        type,
        title,
        message,
        onConfirm: () => {
          hideModal();
          resolve();
        },
      });
    });
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showModal({
        type: 'confirm',
        title,
        message,
        confirmText: 'Confirm',
        onConfirm: () => {
          hideModal();
          resolve(true);
        },
      });
      // Handle cancel via close
      const originalOnClose = modalState.onConfirm;
      setModalState(prev => ({
        ...prev,
        onClose: () => {
          hideModal();
          resolve(false);
        }
      }));
    });
  };

  const showPrompt = (
    title: string, 
    message: string, 
    options?: { 
      placeholder?: string; 
      inputLabel?: string; 
      inputRequired?: boolean;
      confirmText?: string;
    }
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      showModal({
        type: 'prompt',
        title,
        message,
        placeholder: options?.placeholder,
        inputLabel: options?.inputLabel,
        inputRequired: options?.inputRequired ?? true,
        confirmText: options?.confirmText ?? 'Submit',
        onConfirm: (value) => {
          hideModal();
          resolve(value || null);
        },
      });
    });
  };

  return {
    modalState,
    isLoading,
    setIsLoading,
    showModal,
    hideModal,
    showAlert,
    showConfirm,
    showPrompt,
    ModalComponent: (
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        placeholder={modalState.placeholder}
        inputLabel={modalState.inputLabel}
        inputRequired={modalState.inputRequired}
        isLoading={isLoading}
      />
    ),
  };
};

export default Modal;
