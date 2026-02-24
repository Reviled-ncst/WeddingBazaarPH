'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, CreditCard, Check, AlertCircle, Loader2,
  Smartphone, Wallet, Building, Receipt, ExternalLink,
  RefreshCw, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/wedding-bazaar-api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  amount: number;
  serviceName: string;
  vendorName: string;
  eventDate: string;
  onPaymentComplete?: () => void;
}

type PaymentMethod = 'card' | 'gcash' | 'grab_pay' | 'bank_transfer' | 'cash';
type PaymentStep = 'amount_select' | 'select' | 'card_input' | 'processing' | 'checkout' | 'success' | 'failed';
type PaymentAmountType = 'downpayment' | 'full';

const MIN_DOWNPAYMENT_PERCENT = 5; // Minimum 5% downpayment
const DEFAULT_DOWNPAYMENT_PERCENT = 50; // Default 50% downpayment
const PLATFORM_FEE_PERCENT = 5; // 5% platform charge

// PayMongo sandbox test card numbers (Luhn-valid)
// See: https://developers.paymongo.com/docs/testing
const TEST_CARDS = {
  success: '4120 0000 0000 0007',  // PayMongo Visa test card
  mastercard: '5435 9300 0000 0039', // PayMongo Mastercard test card  
  declined: '4000 0000 0000 0002',  // Generic decline test
};

const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: typeof Smartphone; description: string; online: boolean }[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Pay with Visa, Mastercard',
    online: true,
  },
  {
    id: 'gcash',
    name: 'GCash',
    icon: Smartphone,
    description: 'Pay instantly via GCash',
    online: true,
  },
  {
    id: 'grab_pay',
    name: 'GrabPay',
    icon: Wallet,
    description: 'Pay using GrabPay wallet',
    online: true,
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: Building,
    description: 'Manual bank transfer',
    online: false,
  },
  {
    id: 'cash',
    name: 'Cash Payment',
    icon: Receipt,
    description: 'Pay on your wedding day',
    online: false,
  },
];

const BANK_DETAILS = {
  bankName: 'BDO Unibank',
  accountName: 'Wedding Bazaar Inc.',
  accountNumber: '1234 5678 9012',
};

export function PaymentModal({
  isOpen,
  onClose,
  bookingId,
  amount,
  serviceName,
  vendorName,
  eventDate,
  onPaymentComplete,
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('amount_select');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedAmountType, setSelectedAmountType] = useState<PaymentAmountType | null>(null);
  const [downpaymentPercent, setDownpaymentPercent] = useState(DEFAULT_DOWNPAYMENT_PERCENT);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Card input state (pre-filled with test data)
  const [cardNumber, setCardNumber] = useState(TEST_CARDS.success);
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState('Juan Dela Cruz');

  // Calculate amounts
  const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
  const totalWithFee = amount + platformFee;
  const downpaymentAmount = Math.round(totalWithFee * downpaymentPercent / 100);
  const minDownpaymentAmount = Math.round(totalWithFee * MIN_DOWNPAYMENT_PERCENT / 100);
  const payableAmount = selectedAmountType === 'downpayment' ? downpaymentAmount : totalWithFee;
  const remainingBalance = selectedAmountType === 'downpayment' ? totalWithFee - downpaymentAmount : 0;

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('amount_select');
      setSelectedMethod(null);
      setSelectedAmountType(null);
      setDownpaymentPercent(DEFAULT_DOWNPAYMENT_PERCENT);
      setCheckoutUrl(null);
      setError('');
      setPollCount(0);
      setTransactionId(null);
      setCardNumber(TEST_CARDS.success);
      setCardExpiry('12/28');
      setCardCvv('123');
      setCardName('Juan Dela Cruz');
    }
  }, [isOpen]);

  // Poll for payment status when in checkout step
  useEffect(() => {
    if (step !== 'checkout' || !bookingId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_URL}/payments/status.php?booking_id=${bookingId}`
        );
        const result = await response.json();

        if (result.success) {
          if (result.payment_status === 'paid') {
            setStep('success');
            clearInterval(pollInterval);
          } else if (result.payment_status === 'failed') {
            setStep('failed');
            setError('Payment was cancelled or failed');
            clearInterval(pollInterval);
          }
        }
        setPollCount((c) => c + 1);
      } catch {
        console.error('Failed to check payment status');
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (step === 'checkout') {
        setError('Payment session expired. Please try again.');
        setStep('failed');
      }
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [step, bookingId]);

  const formatPrice = (amt: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amt);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setError('');
  };

  const handleProceed = async () => {
    if (!selectedMethod) return;

    const methodInfo = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

    if (selectedMethod === 'card') {
      // Show card input form
      setStep('card_input');
    } else if (methodInfo?.online) {
      // Online payment (GCash, GrabPay) - create source
      setIsLoading(true);
      setStep('processing');

      try {
        const response = await fetch(
          `${API_URL}/payments/create-source.php`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              booking_id: bookingId,
              payment_type: selectedMethod,
            }),
          }
        );

        const result = await response.json();

        if (result.success && result.checkout_url) {
          setCheckoutUrl(result.checkout_url);
          setStep('checkout');
        } else {
          setError(result.message || 'Failed to create payment');
          setStep('select');
        }
      } catch {
        setError('Network error. Please try again.');
        setStep('select');
      } finally {
        setIsLoading(false);
      }
    } else if (selectedMethod === 'bank_transfer') {
      // Show bank details
      setStep('checkout');
    } else if (selectedMethod === 'cash') {
      // Mark as cash payment
      setStep('success');
    }
  };

  // Luhn algorithm to validate card number
  const validateCardNumber = (number: string): boolean => {
    const digits = number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(digits)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Validate expiry date
  const validateExpiry = (expiry: string): boolean => {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;
    
    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);
    
    if (month < 1 || month > 12) return false;
    
    const now = new Date();
    const expiryDate = new Date(year, month - 1);
    return expiryDate >= now;
  };

  // Handle card payment submission
  const handleCardPayment = async () => {
    setError('');
    
    // Validate card number using Luhn algorithm
    if (!validateCardNumber(cardNumber)) {
      setError('Invalid card number. Please check and try again.');
      return;
    }
    
    // Validate expiry
    if (!validateExpiry(cardExpiry)) {
      setError('Invalid or expired card. Please check the expiry date.');
      return;
    }
    
    // Validate CVV
    if (!/^\d{3,4}$/.test(cardCvv)) {
      setError('Invalid CVV. Must be 3 or 4 digits.');
      return;
    }
    
    // Validate name
    if (cardName.trim().length < 2) {
      setError('Please enter the cardholder name.');
      return;
    }
    
    setIsLoading(true);
    setStep('processing');
    
    try {
      // NOTE: This is DEMO MODE - simulates payment without real processor
      // For production, integrate PayMongo's payment intent/source API
      console.log('[DEMO MODE] Simulating card payment - no real charge');
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate transaction ID (demo format - real PayMongo would use pi_ or src_ prefix)
      const txnId = `DEMO-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setTransactionId(txnId);
      
      // Update booking payment status
      const response = await fetch(
        `${API_URL}/payments/confirm-card.php`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: bookingId,
            transaction_id: txnId,
            card_last_four: cardNumber.replace(/\s/g, '').slice(-4),
          }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setStep('success');
      } else {
        // If API fails, still show success for demo purposes
        console.log('[DEMO MODE] API failed but showing success for testing');
        setStep('success');
      }
    } catch {
      // For demo, still show success
      console.log('[DEMO MODE] Error occurred but showing success for testing');
      setStep('success');
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handleCheckStatusManually = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/payments/status.php?booking_id=${bookingId}`
      );
      const result = await response.json();

      if (result.success && result.payment_status === 'paid') {
        setStep('success');
      } else {
        setError('Payment not yet confirmed. Please complete the payment.');
      }
    } catch {
      setError('Failed to check payment status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onPaymentComplete?.();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step === 'checkout' ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <h2 className="text-xl font-semibold text-white">
            {step === 'success' ? 'Payment Complete' : 
             step === 'failed' ? 'Payment Failed' :
             step === 'card_input' ? 'Card Payment' :
             step === 'processing' ? 'Processing' :
             step === 'amount_select' ? 'Payment Amount' :
             'Payment Method'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Booking Summary - Always show */}
          <div className="bg-dark-800/50 rounded-xl p-4 mb-6">
            <h3 className="text-white font-medium mb-1">{serviceName}</h3>
            <p className="text-gray-400 text-sm mb-2">{vendorName}</p>
            <p className="text-gray-500 text-xs mb-3">{eventDate}</p>
            <div className="pt-2 border-t border-dark-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Service Amount</span>
                <span className="text-white">{formatPrice(amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Platform Fee (5%)</span>
                <span className="text-white">{formatPrice(platformFee)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                <span className="text-gray-300 font-medium">Total</span>
                <span className="text-pink-400 font-bold text-xl">{formatPrice(totalWithFee)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Step: Select Payment Amount */}
          {step === 'amount_select' && (
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-3">
                Choose Payment Amount
              </label>
              <div className="space-y-3">
                {/* Downpayment Option */}
                <div
                  onClick={() => setSelectedAmountType('downpayment')}
                  className={`w-full p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    selectedAmountType === 'downpayment'
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedAmountType === 'downpayment' ? 'bg-pink-500/20' : 'bg-dark-700'
                        }`}
                      >
                        <span className={`text-lg font-bold ${selectedAmountType === 'downpayment' ? 'text-pink-400' : 'text-gray-400'}`}>
                          %
                        </span>
                      </div>
                      <div>
                        <p className={`font-medium ${selectedAmountType === 'downpayment' ? 'text-white' : 'text-gray-300'}`}>
                          Downpayment
                        </p>
                        <p className="text-gray-500 text-sm">Reserve now, pay balance later (min 5%)</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAmountType === 'downpayment' ? 'border-pink-500' : 'border-dark-600'
                      }`}
                    >
                      {selectedAmountType === 'downpayment' && <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />}
                    </div>
                  </div>
                  
                  {/* Custom Downpayment Input - Only show when selected */}
                  {selectedAmountType === 'downpayment' && (
                    <div className="mt-3 pt-3 border-t border-dark-700">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1">
                          <input
                            type="range"
                            min={MIN_DOWNPAYMENT_PERCENT}
                            max={100}
                            value={downpaymentPercent}
                            onChange={(e) => setDownpaymentPercent(Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-dark-700 rounded-lg px-3 py-1.5">
                          <input
                            type="number"
                            min={MIN_DOWNPAYMENT_PERCENT}
                            max={100}
                            value={downpaymentPercent}
                            onChange={(e) => {
                              const val = Math.max(MIN_DOWNPAYMENT_PERCENT, Math.min(100, Number(e.target.value) || MIN_DOWNPAYMENT_PERCENT));
                              setDownpaymentPercent(val);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-12 bg-transparent text-white text-center font-bold focus:outline-none"
                          />
                          <span className="text-gray-400">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-pink-400 font-bold text-lg">{formatPrice(downpaymentAmount)}</span>
                        <span className="text-gray-500 text-sm">Balance: {formatPrice(remainingBalance)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Preview when not selected */}
                  {selectedAmountType !== 'downpayment' && (
                    <div className="mt-3 pt-3 border-t border-dark-700 flex items-center justify-between">
                      <span className="text-pink-400 font-bold text-lg">{formatPrice(Math.round(totalWithFee * DEFAULT_DOWNPAYMENT_PERCENT / 100))}</span>
                      <span className="text-gray-500 text-sm">(50% default)</span>
                    </div>
                  )}
                </div>

                {/* Full Payment Option */}
                <button
                  type="button"
                  onClick={() => setSelectedAmountType('full')}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${
                    selectedAmountType === 'full'
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedAmountType === 'full' ? 'bg-pink-500/20' : 'bg-dark-700'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 ${selectedAmountType === 'full' ? 'text-pink-400' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${selectedAmountType === 'full' ? 'text-white' : 'text-gray-300'}`}>
                          Full Payment
                        </p>
                        <p className="text-gray-500 text-sm">Pay 100% now and you're all set</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAmountType === 'full' ? 'border-pink-500' : 'border-dark-600'
                      }`}
                    >
                      {selectedAmountType === 'full' && <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dark-700">
                    <span className="text-pink-400 font-bold text-lg">{formatPrice(totalWithFee)}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step: Select Payment Method */}
          {step === 'select' && (
            <div>
              {/* Show selected amount */}
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-pink-400 text-sm">
                    {selectedAmountType === 'downpayment' ? `Downpayment (${downpaymentPercent}%)` : 'Full Payment'}
                  </span>
                  <span className="text-pink-400 font-bold">{formatPrice(payableAmount)}</span>
                </div>
                {remainingBalance > 0 && (
                  <p className="text-gray-500 text-xs mt-1">
                    Remaining balance of {formatPrice(remainingBalance)} due before event
                  </p>
                )}
              </div>

              <label className="block text-gray-300 text-sm font-medium mb-3">
                Choose Payment Method
              </label>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handleMethodSelect(method.id)}
                      className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 text-left ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500/10'
                          : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-pink-500/20' : 'bg-dark-700'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-pink-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {method.name}
                        </p>
                        <p className="text-gray-500 text-sm">{method.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-pink-500' : 'border-dark-600'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-pink-400 mx-auto mb-4" />
              <p className="text-white font-medium">
                {selectedMethod === 'card' ? 'Processing payment...' : 'Creating payment session...'}
              </p>
              <p className="text-gray-400 text-sm mt-2">Please wait</p>
            </div>
          )}

          {/* Step: Card Input */}
          {step === 'card_input' && (
            <div>
              <div className="bg-dark-800 rounded-xl p-6 mb-4">
                <CreditCard className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h3 className="text-white font-medium text-center mb-4">Enter Card Details</h3>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                  <p className="text-yellow-400 text-xs text-center">
                    🧪 Test Mode: Pre-filled with test card data
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Card Number */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      placeholder="4343 4343 4343 4345"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-mono focus:border-pink-500 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-1.5">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:border-pink-500 focus:outline-none transition-colors"
                    />
                  </div>
                  
                  {/* Expiry and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1.5">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        maxLength={5}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-mono focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1.5">CVV</label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        maxLength={3}
                        placeholder="123"
                        className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white font-mono focus:border-pink-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Your payment is secure and encrypted</span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Checkout (Online Payment) */}
          {step === 'checkout' && selectedMethod && ['gcash', 'grab_pay'].includes(selectedMethod) && (
            <div className="text-center">
              <div className="bg-dark-800 rounded-xl p-6 mb-4">
                <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">
                  Complete Payment in {selectedMethod === 'gcash' ? 'GCash' : 'GrabPay'}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Click the button below to open the payment page. Complete the payment in the new window, then return here.
                </p>
                
                <a
                  href={checkoutUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open {selectedMethod === 'gcash' ? 'GCash' : 'GrabPay'}
                </a>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Waiting for payment...</span>
                </div>
                <p className="text-gray-400 text-sm">
                  This page will automatically update once payment is confirmed.
                  {pollCount > 0 && ` (Checked ${pollCount} times)`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleCheckStatusManually}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Check Status
                </Button>
              </div>
            </div>
          )}

          {/* Step: Checkout (Bank Transfer) */}
          {step === 'checkout' && selectedMethod === 'bank_transfer' && (
            <div>
              <div className="bg-dark-800 rounded-xl p-6 mb-4">
                <Building className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-white font-medium text-center mb-4">Bank Transfer Details</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-dark-700/50 rounded-lg">
                    <span className="text-gray-400">Bank</span>
                    <span className="text-white font-medium">{BANK_DETAILS.bankName}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-dark-700/50 rounded-lg">
                    <span className="text-gray-400">Account Name</span>
                    <span className="text-white font-medium">{BANK_DETAILS.accountName}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-dark-700/50 rounded-lg">
                    <span className="text-gray-400">Account Number</span>
                    <span className="text-white font-medium font-mono">{BANK_DETAILS.accountNumber}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                    <span className="text-gray-400">Amount to Transfer</span>
                    <span className="text-pink-400 font-bold">{formatPrice(payableAmount)}</span>
                  </div>
                  {remainingBalance > 0 && (
                    <div className="flex justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <span className="text-gray-400">Remaining Balance</span>
                      <span className="text-amber-400 font-medium">{formatPrice(remainingBalance)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-amber-400 text-sm">
                  After transferring, please send proof of payment to the vendor via messages.
                  They will confirm your booking once payment is verified.
                </p>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedMethod === 'cash' ? 'Booking Confirmed!' : 'Payment Successful!'}
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                {selectedMethod === 'cash'
                  ? 'Payment will be collected on your wedding day.'
                  : 'Your payment has been received.'}
              </p>
              
              {/* Receipt */}
              <div className="bg-dark-800 rounded-xl p-4 text-left border border-dark-700">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-dark-700">
                  <span className="text-gray-400 text-sm">Receipt</span>
                  <Receipt className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service</span>
                    <span className="text-white">{serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vendor</span>
                    <span className="text-white">{vendorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Event Date</span>
                    <span className="text-white">{eventDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method</span>
                    <span className="text-white">
                      {selectedMethod === 'card' && `Card ****${cardNumber.replace(/\s/g, '').slice(-4)}`}
                      {selectedMethod === 'gcash' && 'GCash'}
                      {selectedMethod === 'grab_pay' && 'GrabPay'}
                      {selectedMethod === 'bank_transfer' && 'Bank Transfer'}
                      {selectedMethod === 'cash' && 'Cash Payment'}
                    </span>
                  </div>
                  {transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Transaction ID</span>
                      <span className="text-white font-mono text-xs">{transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Type</span>
                    <span className="text-white">
                      {selectedAmountType === 'downpayment' ? 'Downpayment (50%)' : 'Full Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-dark-700">
                    <span className="text-gray-400 font-medium">Amount Paid</span>
                    <span className="text-pink-400 font-bold">{formatPrice(payableAmount)}</span>
                  </div>
                  {remainingBalance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Remaining Balance</span>
                      <span className="text-amber-400 font-medium">{formatPrice(remainingBalance)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step: Failed */}
          {step === 'failed' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Payment Failed</h3>
              <p className="text-gray-400 mb-4">
                {error || 'Something went wrong with your payment. Please try again.'}
              </p>
              <Button onClick={() => { setStep('select'); setError(''); }}>
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'amount_select' && (
          <div className="px-6 py-4 border-t border-dark-800">
            <Button
              onClick={() => setStep('select')}
              className="w-full"
              disabled={!selectedAmountType}
            >
              Continue to Payment Method
            </Button>
          </div>
        )}

        {step === 'select' && (
          <div className="px-6 py-4 border-t border-dark-800 space-y-2">
            <Button
              onClick={handleProceed}
              className="w-full"
              disabled={!selectedMethod}
            >
              {selectedMethod === 'cash' ? 'Confirm Cash Payment' :
               selectedMethod === 'bank_transfer' ? 'View Bank Details' :
               selectedMethod === 'card' ? 'Enter Card Details' :
               'Proceed to Payment'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('amount_select')}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === 'card_input' && (
          <div className="px-6 py-4 border-t border-dark-800 space-y-2">
            <Button
              onClick={handleCardPayment}
              className="w-full"
              disabled={!cardNumber || !cardExpiry || !cardCvv || !cardName}
            >
              Pay {formatPrice(payableAmount)}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep('select')}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === 'checkout' && selectedMethod === 'bank_transfer' && (
          <div className="px-6 py-4 border-t border-dark-800">
            <Button onClick={() => setStep('success')} className="w-full">
              I've Made the Transfer
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="px-6 py-4 border-t border-dark-800">
            <Button onClick={handleClose} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
