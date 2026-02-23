'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Please enter a valid email address';
        return undefined;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const value = field === 'email' ? email : password;
    const error = validateField(field, value);
    setValidationErrors({ ...validationErrors, [field]: error });
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };
    setValidationErrors(errors);
    setTouched({ email: true, password: true });
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      const dashboardMap: Record<string, string> = {
        vendor: '/vendor-dashboard',
        coordinator: '/coordinator-dashboard',
        individual: '/discover',
        admin: '/admin',
      };
      router.push(dashboardMap[result.role || 'individual'] || '/discover');
    } else {
      setError(result.error || 'Invalid email or password');
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

        {/* Login Card */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8">
          <h1 className="text-2xl font-serif font-bold text-white text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-dark-400 text-center mb-8">
            Sign in to continue planning your dream wedding
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    setValidationErrors({ ...validationErrors, email: validateField('email', e.target.value) });
                  }
                }}
                onBlur={() => handleBlur('email')}
                icon={<Mail className="w-5 h-5" />}
                className={touched.email && validationErrors.email ? 'border-red-500' : ''}
              />
              {touched.email && validationErrors.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    setValidationErrors({ ...validationErrors, password: validateField('password', e.target.value) });
                  }
                }}
                onBlur={() => handleBlur('password')}
                icon={<Lock className="w-5 h-5" />}
                className={touched.password && validationErrors.password ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-dark-400 hover:text-dark-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {touched.password && validationErrors.password && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-dark-300">
                <input type="checkbox" className="rounded border-dark-600" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-pink-400 hover:text-pink-300">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-dark-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-pink-400 hover:text-pink-300 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
