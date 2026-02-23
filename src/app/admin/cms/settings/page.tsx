'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Globe, Save, Mail, Phone, MapPin, Facebook, Instagram, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

interface Setting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  setting_group: string;
  label: string;
  description: string;
}

interface GroupedSettings {
  [key: string]: Setting[];
}

export default function CMSSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [grouped, setGrouped] = useState<GroupedSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<{ [key: string]: string }>({});
  const [activeGroup, setActiveGroup] = useState('contact');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const groupIcons: { [key: string]: React.ReactNode } = {
    contact: <Mail className="w-5 h-5" />,
    social: <Facebook className="w-5 h-5" />,
    branding: <Globe className="w-5 h-5" />,
    footer: <ExternalLink className="w-5 h-5" />,
  };

  const groupLabels: { [key: string]: string } = {
    contact: 'Contact Information',
    social: 'Social Media Links',
    branding: 'Branding',
    footer: 'Footer Content',
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ settings: Setting[]; grouped: GroupedSettings }>('/admin/settings/list.php');
      if (response.success && response.data) {
        setSettings(response.data.settings);
        setGrouped(response.data.grouped);
        
        // Initialize edited values
        const values: { [key: string]: string } = {};
        response.data.settings.forEach((s: Setting) => {
          values[s.setting_key] = s.setting_value;
        });
        setEditedValues(values);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Find changed settings
      const changes = settings.filter(s => editedValues[s.setting_key] !== s.setting_value);
      
      if (changes.length === 0) {
        setMessage({ type: 'success', text: 'No changes to save' });
        setIsSaving(false);
        return;
      }
      
      const settingsToUpdate = changes.map(s => ({
        key: s.setting_key,
        value: editedValues[s.setting_key]
      }));
      
      const response = await api.post<{ updated: number; errors: string[] }>('/admin/settings/bulk-update.php', {
        settings: settingsToUpdate
      });
      
      if (response.success && response.data) {
        setMessage({ type: 'success', text: `Updated ${response.data.updated} settings` });
        fetchSettings(); // Refresh
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (setting: Setting) => {
    const value = editedValues[setting.setting_key] || '';
    
    switch (setting.setting_type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setEditedValues({ ...editedValues, [setting.setting_key]: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        );
      case 'boolean':
        return (
          <button
            onClick={() => setEditedValues({ ...editedValues, [setting.setting_key]: value === '1' ? '0' : '1' })}
            className={`relative w-12 h-6 rounded-full transition-colors ${value === '1' ? 'bg-pink-500' : 'bg-dark-700'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${value === '1' ? 'left-7' : 'left-1'}`} />
          </button>
        );
      case 'json':
        return (
          <textarea
            value={value}
            onChange={(e) => setEditedValues({ ...editedValues, [setting.setting_key]: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="JSON format"
          />
        );
      case 'url':
        return (
          <div className="flex gap-2">
            <input
              type="url"
              value={value}
              onChange={(e) => setEditedValues({ ...editedValues, [setting.setting_key]: e.target.value })}
              className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="https://"
            />
            {value && (
              <a href={value} target="_blank" rel="noopener noreferrer" className="p-2 bg-dark-800 rounded-lg hover:bg-dark-700">
                <ExternalLink className="w-5 h-5 text-dark-400" />
              </a>
            )}
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setEditedValues({ ...editedValues, [setting.setting_key]: e.target.value })}
            className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  const groups = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Settings</h1>
          <p className="text-dark-400 mt-1">Manage contact info, social links, and branding</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeGroup === group
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'text-dark-400 hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  {groupIcons[group] || <Globe className="w-5 h-5" />}
                  <span className="font-medium">{groupLabels[group] || group}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              {groupIcons[activeGroup]}
              {groupLabels[activeGroup] || activeGroup}
            </h2>
            
            <div className="space-y-6">
              {(grouped[activeGroup] || []).map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <label className="block text-sm font-medium text-white">
                    {setting.label}
                  </label>
                  {setting.description && (
                    <p className="text-xs text-dark-400">{setting.description}</p>
                  )}
                  {renderInput(setting)}
                </div>
              ))}
              
              {(!grouped[activeGroup] || grouped[activeGroup].length === 0) && (
                <p className="text-dark-400 text-center py-8">No settings in this group</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
