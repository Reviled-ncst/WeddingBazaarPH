'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Mail, Lock, User, Phone, Eye, EyeOff, Building2, CalendarCheck, AlertCircle, Check } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Philippine phone number validation
function isValidPhilippinePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Valid formats: +639XXXXXXXXX, 639XXXXXXXXX, 09XXXXXXXXX, 9XXXXXXXXX
  const patterns = [
    /^\+639\d{9}$/,      // +639XXXXXXXXX
    /^639\d{9}$/,        // 639XXXXXXXXX
    /^09\d{9}$/,         // 09XXXXXXXXX
    /^9\d{9}$/,          // 9XXXXXXXXX
  ];
  return patterns.some(pattern => pattern.test(cleaned));
}

function formatPhilippinePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+63')) return cleaned;
  if (cleaned.startsWith('63')) return '+' + cleaned;
  if (cleaned.startsWith('09')) return '+63' + cleaned.slice(1);
  if (cleaned.startsWith('9')) return '+63' + cleaned;
  return cleaned;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'individual' as 'individual' | 'vendor' | 'coordinator',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Please enter a valid email address';
        return undefined;
      case 'phone':
        if (value && !isValidPhilippinePhone(value)) {
          return 'Enter a valid PH number (e.g., 09171234567)';
        }
        return undefined;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain a number';
        return undefined;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const value = formData[field as keyof typeof formData];
    const error = validateField(field, value);
    setValidationErrors({ ...validationErrors, [field]: error });
  };

  const handleRoleChange = (role: 'individual' | 'vendor' | 'coordinator') => {
    setFormData({ ...formData, role });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      const error = validateField(name, value);
      setValidationErrors({ ...validationErrors, [name]: error });
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };
    setValidationErrors(errors);
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    return !Object.values(errors).some(e => e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone ? formatPhilippinePhone(formData.phone) : undefined,
    });

    if (result.success) {
      const dashboardMap = {
        vendor: '/vendor-dashboard',
        coordinator: '/coordinator-dashboard',
        individual: '/discover',
      };
      router.push(dashboardMap[formData.role]);
    } else {
      setError(result.error || 'Registration failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-dark-950">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Heart className="w-10 h-10 text-pink-400 fill-pink-400" />
            <span className="text-2xl font-semibold">
              <span className="text-pink-300 font-serif">Wedding</span>
              <span className="text-white">Bazaar</span>
            </span>
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8">
          <h1 className="text-2xl font-serif font-bold text-white text-center mb-2">
            Create Account
          </h1>
          <p className="text-dark-400 text-center mb-6 text-sm sm:text-base">
            Join our wedding planning community
          </p>

          {/* Role Selection */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
            <button
              type="button"
              onClick={() => handleRoleChange('individual')}
              className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                formData.role === 'individual'
                  ? 'border-pink-400 bg-pink-400/10'
                  : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              <User className={`w-6 h-6 mx-auto mb-2 ${
                formData.role === 'individual' ? 'text-pink-400' : 'text-dark-400'
              }`} />
              <p className={`text-sm font-medium ${
                formData.role === 'individual' ? 'text-pink-300' : 'text-dark-300'
              }`}>
                Couple
              </p>
              <p className="text-xs text-dark-500">Find providers</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('vendor')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.role === 'vendor'
                  ? 'border-pink-400 bg-pink-400/10'
                  : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              <Building2 className={`w-6 h-6 mx-auto mb-2 ${
                formData.role === 'vendor' ? 'text-pink-400' : 'text-dark-400'
              }`} />
              <p className={`text-sm font-medium ${
                formData.role === 'vendor' ? 'text-pink-300' : 'text-dark-300'
              }`}>
                Provider
              </p>
              <p className="text-xs text-dark-500">List services</p>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('coordinator')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.role === 'coordinator'
                  ? 'border-pink-400 bg-pink-400/10'
                  : 'border-dark-700 hover:border-dark-600'
              }`}
            >
              <CalendarCheck className={`w-6 h-6 mx-auto mb-2 ${
                formData.role === 'coordinator' ? 'text-pink-400' : 'text-dark-400'
              }`} />
              <p className={`text-sm font-medium ${
                formData.role === 'coordinator' ? 'text-pink-300' : 'text-dark-300'
              }`}>
                Coordinator
              </p>
              <p className="text-xs text-dark-500">Plan weddings</p>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              icon={<User className="w-5 h-5" />}
              error={touched.name ? validationErrors.name : undefined}
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              icon={<Mail className="w-5 h-5" />}
              error={touched.email ? validationErrors.email : undefined}
              required
            />

            <Input
              label="Phone (Optional)"
              name="phone"
              type="tel"
              placeholder="09171234567 or +639171234567"
              value={formData.phone}
              onChange={handleChange}
              onBlur={() => handleBlur('phone')}
              icon={<Phone className="w-5 h-5" />}
              error={touched.phone ? validationErrors.phone : undefined}
            />

            <div className="space-y-2">
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  icon={<Lock className="w-5 h-5" />}
                  error={touched.password ? validationErrors.password : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-dark-400 hover:text-dark-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password requirements */}
              {formData.password && (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className={`flex items-center gap-1.5 ${formData.password.length >= 6 ? 'text-green-400' : 'text-dark-500'}`}>
                    {formData.password.length >= 6 ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    6+ characters
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-dark-500'}`}>
                    {/[A-Z]/.test(formData.password) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1.5 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-dark-500'}`}>
                    {/[0-9]/.test(formData.password) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    Number
                  </div>
                  <div className={`flex items-center gap-1.5 ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-green-400' : 'text-dark-500'}`}>
                    {formData.confirmPassword && formData.password === formData.confirmPassword ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    Passwords match
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur('confirmPassword')}
              icon={<Lock className="w-5 h-5" />}
              error={touched.confirmPassword ? validationErrors.confirmPassword : undefined}
              required
            />

            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 rounded border-dark-600" required />
              <label className="text-sm text-dark-300">
                I agree to the{' '}
                <Link href="/terms" className="text-pink-400 hover:text-pink-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-pink-400 hover:text-pink-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-dark-400">
              Already have an account?{' '}
              <Link href="/login" className="text-pink-400 hover:text-pink-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
