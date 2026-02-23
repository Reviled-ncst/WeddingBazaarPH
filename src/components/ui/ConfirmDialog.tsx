'use client';

import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    buttonClass: 'bg-red-500 hover:bg-red-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    buttonClass: 'bg-amber-500 hover:bg-amber-600',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-600',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    buttonClass: 'bg-blue-500 hover:bg-blue-600',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.iconBg}`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-800 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={config.buttonClass}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
