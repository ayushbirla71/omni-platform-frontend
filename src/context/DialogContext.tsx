import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, Info, CheckCircle2, HelpCircle, X } from 'lucide-react';

export type DialogVariant = 'primary' | 'danger' | 'warning' | 'success' | 'info';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  variant?: DialogVariant;
}

interface DialogState {
  isOpen: boolean;
  type: 'confirm' | 'alert';
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: DialogVariant;
}

interface DialogContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  alert: (options: AlertOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'primary',
  });

  const resolverRef = useRef<((value: any) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (typeof options === 'string') {
        setDialog({
          isOpen: true,
          type: 'confirm',
          title: 'Confirm Action',
          message: options,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'primary',
        });
      } else {
        setDialog({
          isOpen: true,
          type: 'confirm',
          title: options.title || 'Confirm Action',
          message: options.message,
          confirmText: options.confirmText || 'Confirm',
          cancelText: options.cancelText || 'Cancel',
          variant: options.variant || 'primary',
        });
      }
    });
  }, []);

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (typeof options === 'string') {
        setDialog({
          isOpen: true,
          type: 'alert',
          title: 'Notice',
          message: options,
          confirmText: 'OK',
          cancelText: '',
          variant: 'info',
        });
      } else {
        setDialog({
          isOpen: true,
          type: 'alert',
          title: options.title || (options.variant === 'danger' ? 'Error' : options.variant === 'warning' ? 'Warning' : 'Notice'),
          message: options.message,
          confirmText: options.buttonText || 'OK',
          cancelText: '',
          variant: options.variant || 'info',
        });
      }
    });
  }, []);

  const handleConfirm = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      if (dialog.type === 'confirm') {
        resolverRef.current(false);
      } else {
        resolverRef.current(undefined);
      }
      resolverRef.current = null;
    }
  };

  const getVariantStyles = () => {
    switch (dialog.variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
          icon: <AlertTriangle className="w-6 h-6" />,
          button: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm shadow-red-200 dark:shadow-none',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
          icon: <AlertTriangle className="w-6 h-6" />,
          button: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-sm shadow-amber-200 dark:shadow-none',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
          icon: <CheckCircle2 className="w-6 h-6" />,
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-none',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
          icon: <Info className="w-6 h-6" />,
          button: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm shadow-blue-200 dark:shadow-none',
        };
      default:
        return {
          iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
          icon: <HelpCircle className="w-6 h-6" />,
          button: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-sm shadow-indigo-200 dark:shadow-none',
        };
    }
  };

  const currentStyles = getVariantStyles();

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={handleCancel}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 z-10 transform transition-all duration-200 animate-in zoom-in-95">
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${currentStyles.iconBg}`}>
                {currentStyles.icon}
              </div>

              <div className="flex-1 pt-0.5">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {dialog.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {dialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-2">
              {dialog.type === 'confirm' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${currentStyles.button}`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
