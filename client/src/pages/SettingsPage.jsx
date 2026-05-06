import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Bell, Shield, Key, Loader2, Save } from 'lucide-react';
import api from '../services/api';

const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    notifications: user?.preferences?.notifications ?? true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setErrorMsg('Passwords do not match');
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        preferences: { notifications: formData.notifications }
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const { data } = await api.put('/users/profile', payload);
      setUser(data);
      setSuccessMsg('Profile updated successfully');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-dark-muted mt-1">Manage your account preferences and personal information.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Tabs (Static for now) */}
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 font-medium rounded-lg transition-colors">
            <User className="w-5 h-5" /> Account
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 font-medium rounded-lg transition-colors">
            <Bell className="w-5 h-5" /> Preferences
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border/50 font-medium rounded-lg transition-colors">
            <Shield className="w-5 h-5" /> Security
          </button>
        </div>

        {/* Main Settings Form */}
        <div className="col-span-1 md:col-span-3">
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
            {/* Profile Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-dark-border pb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-dark-border pb-4 flex items-center gap-2">
                <Key className="w-5 h-5" /> Change Password
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input type="password" name="password" className="input-field" placeholder="Leave blank to keep current" value={formData.password} onChange={handleChange} minLength={6} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                  <input type="password" name="confirmPassword" className="input-field" value={formData.confirmPassword} onChange={handleChange} minLength={6} />
                </div>
              </div>
            </div>

            {/* App Preferences */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-dark-border pb-4">App Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="notifications" checked={formData.notifications} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <div>
                    <span className="block font-medium text-gray-900 dark:text-white">Email Notifications</span>
                    <span className="block text-sm text-gray-500 dark:text-dark-muted">Receive daily summaries and AI coach insights.</span>
                  </div>
                </label>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="block font-medium text-gray-900 dark:text-white">Dark Mode</span>
                    <span className="block text-sm text-gray-500 dark:text-dark-muted">Toggle the dark appearance of the app.</span>
                  </div>
                  <button type="button" onClick={toggleTheme} className="px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-lg font-medium">
                    {isDark ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {successMsg && <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">{successMsg}</div>}
            {errorMsg && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">{errorMsg}</div>}

            <div className="pt-6 border-t border-gray-100 dark:border-dark-border flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
