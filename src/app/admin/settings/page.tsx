'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  Bell,
  Shield,
  Mail,
  Database,
  Palette,
  Globe,
  Lock,
  Save,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Key,
  Users,
  CreditCard
} from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

const sections: SettingSection[] = [
  { id: 'general', title: 'General', icon: Settings, description: 'Basic platform settings' },
  { id: 'security', title: 'Security', icon: Shield, description: 'Security and authentication' },
  { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Email and push notifications' },
  { id: 'verification', title: 'Verification', icon: CheckCircle, description: 'User verification settings' },
  { id: 'payments', title: 'Payments', icon: CreditCard, description: 'Payment gateway settings' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Wedding Bazaar',
    siteDescription: 'Find the perfect vendors for your wedding day',
    supportEmail: 'support@weddingbazaar.com',
    contactPhone: '+63 917 123 4567',
    timezone: 'Asia/Manila',
    currency: 'PHP',
    maintenanceMode: false,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 60,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    enableTwoFactor: false,
    allowPasswordReset: true,
    minPasswordLength: 8,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewBooking: true,
    emailBookingStatus: true,
    emailNewMessage: true,
    emailNewReview: true,
    emailWeeklyReport: true,
    emailMarketingAllowed: false,
    pushEnabled: true,
    pushNewBooking: true,
    pushNewMessage: true,
  });

  // Verification settings
  const [verificationSettings, setVerificationSettings] = useState({
    autoApproveBasicVendors: false,
    requireBusinessDocs: true,
    requireIdPhoto: true,
    verificationExpiryDays: 365,
    notifyOnSubmission: true,
    notifyOnApproval: true,
  });

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    enableGcash: true,
    enableMaya: true,
    enableCard: true,
    enableBankTransfer: true,
    platformFeePercent: 5,
    minBookingAmount: 1000,
    payoutSchedule: 'weekly',
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // TODO: Actually save settings to API
  };

  const renderToggle = (value: boolean, onChange: (val: boolean) => void, disabled?: boolean) => (
    <button
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        value ? 'bg-pink-500' : 'bg-dark-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
        value ? 'left-7' : 'left-1'
      }`}></span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-dark-400 mt-1">Manage platform configuration</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Nav */}
        <Card className="p-4 h-fit">
          <nav className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-pink-500/10 text-pink-400'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">{section.title}</p>
                  <p className="text-xs text-dark-500">{section.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeSection === 'general' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-pink-400" />
                General Settings
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Site Name</label>
                    <input
                      type="text"
                      value={generalSettings.siteName}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteName: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Support Email</label>
                    <input
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Site Description</label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Contact Phone</label>
                    <input
                      type="text"
                      value={generalSettings.contactPhone}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Timezone</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    >
                      <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                      <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Currency</label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    >
                      <option value="PHP">PHP (?)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Maintenance Mode</p>
                      <p className="text-xs text-dark-400">Disable public access to the site</p>
                    </div>
                  </div>
                  {renderToggle(
                    generalSettings.maintenanceMode,
                    (val) => setGeneralSettings(prev => ({ ...prev, maintenanceMode: val }))
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-pink-400" />
                Security Settings
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Lockout Duration (min)</label>
                    <input
                      type="number"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Session Timeout (min)</label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Minimum Password Length</label>
                  <input
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.minPasswordLength}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, minPasswordLength: parseInt(e.target.value) }))}
                    className="w-32 px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Require Email Verification</p>
                      <p className="text-xs text-dark-400">Users must verify email before access</p>
                    </div>
                    {renderToggle(
                      securitySettings.requireEmailVerification,
                      (val) => setSecuritySettings(prev => ({ ...prev, requireEmailVerification: val }))
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Require Phone Verification</p>
                      <p className="text-xs text-dark-400">Users must verify phone via OTP</p>
                    </div>
                    {renderToggle(
                      securitySettings.requirePhoneVerification,
                      (val) => setSecuritySettings(prev => ({ ...prev, requirePhoneVerification: val }))
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Enable Two-Factor Authentication</p>
                      <p className="text-xs text-dark-400">Optional 2FA for all users</p>
                    </div>
                    {renderToggle(
                      securitySettings.enableTwoFactor,
                      (val) => setSecuritySettings(prev => ({ ...prev, enableTwoFactor: val }))
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-white">Allow Password Reset</p>
                      <p className="text-xs text-dark-400">Let users reset password via email</p>
                    </div>
                    {renderToggle(
                      securitySettings.allowPasswordReset,
                      (val) => setSecuritySettings(prev => ({ ...prev, allowPasswordReset: val }))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-pink-400" />
                Notification Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Notifications
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailNewBooking', label: 'New Booking', desc: 'Notify on new booking requests' },
                      { key: 'emailBookingStatus', label: 'Booking Status Updates', desc: 'Notify when booking status changes' },
                      { key: 'emailNewMessage', label: 'New Messages', desc: 'Notify on new chat messages' },
                      { key: 'emailNewReview', label: 'New Reviews', desc: 'Notify when a review is posted' },
                      { key: 'emailWeeklyReport', label: 'Weekly Reports', desc: 'Send weekly analytics report' },
                      { key: 'emailMarketingAllowed', label: 'Marketing Emails', desc: 'Allow marketing communications' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                        <div>
                          <p className="text-sm text-white">{item.label}</p>
                          <p className="text-xs text-dark-500">{item.desc}</p>
                        </div>
                        {renderToggle(
                          notificationSettings[item.key as keyof typeof notificationSettings] as boolean,
                          (val) => setNotificationSettings(prev => ({ ...prev, [item.key]: val }))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-white mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div>
                        <p className="text-sm text-white">Enable Push Notifications</p>
                        <p className="text-xs text-dark-500">Master toggle for push notifications</p>
                      </div>
                      {renderToggle(
                        notificationSettings.pushEnabled,
                        (val) => setNotificationSettings(prev => ({ ...prev, pushEnabled: val }))
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div>
                        <p className="text-sm text-white">Push: New Bookings</p>
                      </div>
                      {renderToggle(
                        notificationSettings.pushNewBooking,
                        (val) => setNotificationSettings(prev => ({ ...prev, pushNewBooking: val })),
                        !notificationSettings.pushEnabled
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div>
                        <p className="text-sm text-white">Push: New Messages</p>
                      </div>
                      {renderToggle(
                        notificationSettings.pushNewMessage,
                        (val) => setNotificationSettings(prev => ({ ...prev, pushNewMessage: val })),
                        !notificationSettings.pushEnabled
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Verification Settings */}
          {activeSection === 'verification' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-pink-400" />
                Verification Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Verification Expiry (days)</label>
                  <input
                    type="number"
                    value={verificationSettings.verificationExpiryDays}
                    onChange={(e) => setVerificationSettings(prev => ({ ...prev, verificationExpiryDays: parseInt(e.target.value) }))}
                    className="w-32 px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                  />
                  <p className="text-xs text-dark-500 mt-1">How long verification remains valid</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { key: 'autoApproveBasicVendors', label: 'Auto-Approve Basic Vendors', desc: 'Automatically approve vendors without documents' },
                    { key: 'requireBusinessDocs', label: 'Require Business Documents', desc: 'Vendors must submit business registration' },
                    { key: 'requireIdPhoto', label: 'Require ID Photo', desc: 'Vendors must submit valid ID' },
                    { key: 'notifyOnSubmission', label: 'Notify on Document Submission', desc: 'Alert admins when documents are submitted' },
                    { key: 'notifyOnApproval', label: 'Notify on Approval/Rejection', desc: 'Notify vendors of verification result' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-dark-400">{item.desc}</p>
                      </div>
                      {renderToggle(
                        verificationSettings[item.key as keyof typeof verificationSettings] as boolean,
                        (val) => setVerificationSettings(prev => ({ ...prev, [item.key]: val }))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Payment Settings */}
          {activeSection === 'payments' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-pink-400" />
                Payment Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white mb-4">Payment Methods</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'enableGcash', label: 'GCash' },
                      { key: 'enableMaya', label: 'Maya (PayMaya)' },
                      { key: 'enableCard', label: 'Credit/Debit Card' },
                      { key: 'enableBankTransfer', label: 'Bank Transfer' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                        <p className="text-sm text-white">{item.label}</p>
                        {renderToggle(
                          paymentSettings[item.key as keyof typeof paymentSettings] as boolean,
                          (val) => setPaymentSettings(prev => ({ ...prev, [item.key]: val }))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Platform Fee (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={paymentSettings.platformFeePercent}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, platformFeePercent: parseFloat(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Min Booking Amount (?)</label>
                    <input
                      type="number"
                      value={paymentSettings.minBookingAmount}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, minBookingAmount: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Vendor Payout Schedule</label>
                    <select
                      value={paymentSettings.payoutSchedule}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, payoutSchedule: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/20"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
