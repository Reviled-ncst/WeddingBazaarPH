'use client';

import { useState } from 'react';
import { X, Send, Check, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface Service {
  id: number;
  name: string;
}

interface MessageVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: number;
  vendorName: string;
  userId: number | null;
  service?: Service | null;
  onSuccess?: () => void;
}

export function MessageVendorModal({
  isOpen,
  onClose,
  vendorId,
  vendorName,
  userId,
  service,
  onSuccess,
}: MessageVendorModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Please log in to send a message');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepend service context if available
      const fullMessage = service
        ? `[Inquiry about: ${service.name}]\n\n${message.trim()}`
        : message.trim();

      const response = await fetch(`${API_URL}/messages/send.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: vendorId,
          content: fullMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(false);
          setMessage('');
        }, 2000);
      } else {
        setError(result.message || 'Failed to send message');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <h2 className="text-xl font-semibold text-white">Message {vendorName}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
              <p className="text-gray-400">
                Your message has been delivered to {vendorName}. They will respond soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Service Context */}
              {service && (
                <div className="bg-dark-800/50 rounded-xl p-4 mb-4">
                  <p className="text-gray-400 text-sm">Inquiring about:</p>
                  <p className="text-white font-medium">{service.name}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Message Input */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, I'm interested in your services for my upcoming wedding. I would like to know more about..."
                  rows={5}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 transition-colors resize-none"
                  required
                />
              </div>

              {/* Quick Message Suggestions */}
              <div className="mb-6">
                <p className="text-gray-400 text-xs mb-2">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'What dates are available?',
                    'Can I see your portfolio?',
                    'Do you offer custom packages?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setMessage((prev) => prev + (prev ? ' ' : '') + suggestion)}
                      className="px-3 py-1.5 text-xs bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-full transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !userId}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">?</span>
                    Sending...
                  </>
                ) : !userId ? (
                  'Log in to Message'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
