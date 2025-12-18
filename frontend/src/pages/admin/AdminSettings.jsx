import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Settings, 
  Globe, 
  Palette, 
  Mail, 
  Shield, 
  Save,
  Upload,
  Bell,
  DollarSign,
  Percent,
  Lock,
  Image as ImageIcon
} from 'lucide-react';
import { usersAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery(
    'adminSettings',
    () => usersAPI.getAdminSettings(),
    {
      retry: 1
    }
  );

  const [settings, setSettings] = useState({
    siteName: settingsData?.data?.siteName || 'Premium Events',
    siteUrl: settingsData?.data?.siteUrl || '',
    logo: settingsData?.data?.logo || '',
    primaryColor: settingsData?.data?.primaryColor || '#f97316',
    secondaryColor: settingsData?.data?.secondaryColor || '#3b82f6',
    platformFee: settingsData?.data?.platformFee || 10,
    affiliateCommissionRate: settingsData?.data?.affiliateCommissionRate || 10,
    emailFrom: settingsData?.data?.emailFrom || '',
    smtpHost: settingsData?.data?.smtpHost || '',
    smtpPort: settingsData?.data?.smtpPort || '',
    smtpUser: settingsData?.data?.smtpUser || '',
    smtpPass: settingsData?.data?.smtpPass || '',
    enable2FA: settingsData?.data?.enable2FA || false,
    maintenanceMode: settingsData?.data?.maintenanceMode || false,
    allowOrganizerRegistration: settingsData?.data?.allowOrganizerRegistration !== false
  });

  const updateSettingsMutation = useMutation(
    (settingsData) => usersAPI.updateAdminSettings(settingsData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminSettings');
        toast.success('Settings saved successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save settings');
      }
    }
  );

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, logo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'fees', label: 'Fees & Commissions', icon: DollarSign },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-2">Configure platform-wide settings and preferences</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name *
              </label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                placeholder="Premium Events"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site URL *
              </label>
              <Input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                placeholder="https://premium-events.com"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="maintenanceMode" className="ml-2 text-sm font-medium text-gray-700">
                Maintenance Mode
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowOrganizerRegistration"
                checked={settings.allowOrganizerRegistration}
                onChange={(e) => setSettings({ ...settings, allowOrganizerRegistration: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="allowOrganizerRegistration" className="ml-2 text-sm font-medium text-gray-700">
                Allow Organizer Registration
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Branding Settings */}
      {activeTab === 'branding' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Branding</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-center gap-4">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt="Logo"
                    className="w-24 h-24 object-contain border border-gray-200 rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button variant="outline" as="span">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px, PNG or SVG</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    placeholder="#f97316"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Fees & Commissions */}
      {activeTab === 'fees' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Fees & Commissions</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Fee (%)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.platformFee}
                  onChange={(e) => setSettings({ ...settings, platformFee: parseFloat(e.target.value) || 0 })}
                  placeholder="10"
                />
                <Percent className="absolute right-3 top-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Percentage charged on ticket sales</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate Commission Rate (%)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settings.affiliateCommissionRate}
                  onChange={(e) => setSettings({ ...settings, affiliateCommissionRate: parseFloat(e.target.value) || 0 })}
                  placeholder="10"
                />
                <Percent className="absolute right-3 top-3 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Default commission rate for affiliates</p>
            </div>
          </div>
        </Card>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Email Configuration</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email Address *
              </label>
              <Input
                type="email"
                value={settings.emailFrom}
                onChange={(e) => setSettings({ ...settings, emailFrom: e.target.value })}
                placeholder="no-reply@premium-events.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <Input
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <Input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                  placeholder="587"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <Input
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <Input
                type="password"
                value={settings.smtpPass}
                onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable2FA}
                  onChange={(e) => setSettings({ ...settings, enable2FA: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                <p className="text-sm text-gray-600">Temporarily disable public access</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSettings;