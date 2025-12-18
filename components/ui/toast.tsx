import React from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, onClose }) => {
  const config = {
    success: {
      icon: <CheckCircle className="text-emerald-500" size={20} />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      accent: 'bg-emerald-500'
    },
    error: {
      icon: <XCircle className="text-red-500" size={20} />,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      accent: 'bg-red-500'
    },
    info: {
      icon: <AlertCircle className="text-blue-500" size={20} />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'bg-blue-500'
    }
  };

  const { icon, bg, border, accent } = config[type];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div 
      className={`
        ${bg} ${border} border rounded-xl shadow-lg overflow-hidden
        min-w-80 max-w-md animate-in slide-in-from-right-full duration-300
        backdrop-blur-xl
      `}
    >
      <div className={`h-1 ${accent}`} />
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h4>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message?: string;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};
