import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, Lock, Mail, User, ShieldCheck, MapPin, Plus, UserPlus, KeyRound, Sparkles } from 'lucide-react';

export type AuthMode = 'login' | 'register' | 'profile' | 'reset-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { user, login, register, resetPassword, updateProfile, switchDemoUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [originTagInput, setOriginTagInput] = useState('');
  const [originPlaces, setOriginPlaces] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMessage('');

    if (initialMode === 'profile' && user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setOriginPlaces(user.originPlaces || []);
    } else {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setBio('');
      setOriginPlaces([]);
    }
  }, [initialMode, isOpen, user]);

  if (!isOpen) return null;

  const handleAddOriginTag = () => {
    const trimmed = originTagInput.trim();
    if (trimmed && !originPlaces.includes(trimmed)) {
      setOriginPlaces([...originPlaces, trimmed]);
      setOriginTagInput('');
    }
  };

  const handleRemoveOriginTag = (tagToRemove: string) => {
    setOriginPlaces(originPlaces.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim() || !email.trim() || !password) {
          throw new Error('Name, email, and password are required.');
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          bio: bio.trim(),
          originPlaces
        });
        onClose();
      } else if (mode === 'login') {
        await login(email.trim(), password);
        onClose();
      } else if (mode === 'profile') {
        await updateProfile({
          name: name.trim(),
          bio: bio.trim(),
          originPlaces
        });
        setSuccessMessage('Profile and ancestral origins updated successfully!');
        setTimeout(() => onClose(), 1000);
      } else if (mode === 'reset-password') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        await resetPassword(email.trim(), password);
        setSuccessMessage('Password reset successfully! You are now signed in.');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setLoading(true);
    try {
      await switchDemoUser(demoEmail);
      onClose();
    } catch (err: any) {
      setError('Failed to switch demo account');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'register'
      ? 'Create New Researcher Account'
      : mode === 'profile'
      ? 'My Profile & Ancestral Origins'
      : mode === 'reset-password'
      ? 'Reset Your Password'
      : 'Sign In to RootsConnect';

  const subtitle =
    mode === 'register'
      ? 'Register a new user to build your ancestral tree and find relatives'
      : mode === 'profile'
      ? 'Manage your genealogical profile and historical geographic origins'
      : mode === 'reset-password'
      ? 'Enter your registered email and choose a new secure password'
      : 'Welcome back to your ancestral heritage network';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-parchment-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-parchment-50 border-b border-parchment-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center">
              {mode === 'register' ? (
                <UserPlus className="w-4 h-4" />
              ) : mode === 'profile' ? (
                <User className="w-4 h-4" />
              ) : mode === 'reset-password' ? (
                <KeyRound className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-serif-heading font-bold text-lg text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 leading-tight">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-parchment-200 bg-parchment-50/60 px-6 pt-2">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              mode === 'register'
                ? 'border-forest-700 text-forest-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create New User
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              mode === 'login'
                ? 'border-forest-700 text-forest-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          {user && (
            <button
              type="button"
              onClick={() => {
                setMode('profile');
                setError('');
                setName(user.name);
                setBio(user.bio || '');
                setOriginPlaces(user.originPlaces || []);
              }}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                mode === 'profile'
                  ? 'border-forest-700 text-forest-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              My Profile
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMode('reset-password');
              setError('');
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition ${
              mode === 'reset-password'
                ? 'border-forest-700 text-forest-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reset Password
          </button>
        </div>

        {/* Quick Demo Login Option (Visible in login/register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="px-6 pt-3 pb-2.5 bg-forest-50/40 border-b border-forest-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-forest-900 flex items-center space-x-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Or Demo Persona:</span>
            </span>
            <div className="flex gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleQuickDemo('eleanor@rootsconnect.local')}
                className="py-1 px-2.5 bg-white hover:bg-forest-100 border border-forest-200 rounded-lg text-[10px] font-bold text-forest-900 transition shadow-2xs"
              >
                Eleanor Vance
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('marcus@rootsconnect.local')}
                className="py-1 px-2.5 bg-white hover:bg-forest-100 border border-forest-200 rounded-lg text-[10px] font-bold text-forest-900 transition shadow-2xs"
              >
                Marcus Vance
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">
              {successMessage}
            </div>
          )}

          {/* Name Field (for register and profile) */}
          {(mode === 'register' || mode === 'profile') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Thomas Vance"
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
                />
              </div>
            </div>
          )}

          {/* Email Field (for register, login, reset-password) */}
          {mode !== 'profile' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="researcher@rootsconnect.local"
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
                />
              </div>
            </div>
          )}

          {/* Password Field */}
          {mode !== 'profile' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === 'reset-password' ? 'New Password *' : 'Password *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
                />
              </div>
            </div>
          )}

          {/* Confirm Password Field (reset-password only) */}
          {mode === 'reset-password' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
                />
              </div>
            </div>
          )}

          {/* Bio Field (register & profile) */}
          {(mode === 'register' || mode === 'profile') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Genealogy Bio & Research Interests
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tracing 19th-century Irish migration, Boston stonemasons..."
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
              />
            </div>
          )}

          {/* Ancestral Origin Locations (register & profile) */}
          {(mode === 'register' || mode === 'profile') && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                Ancestral Origin Locations
              </label>
              <p className="text-[11px] text-slate-500">
                Add known family origin places (e.g., "County Cork, Ireland", "Boston, MA") to help relatives discover you:
              </p>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={originTagInput}
                    onChange={e => setOriginTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOriginTag();
                      }
                    }}
                    placeholder="e.g. County Cork, Ireland"
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddOriginTag}
                  className="px-3 py-1.5 text-xs bg-forest-100 text-forest-800 hover:bg-forest-200 font-bold rounded-lg transition flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Place</span>
                </button>
              </div>

              {/* Tags Display */}
              {originPlaces.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {originPlaces.map(place => (
                    <span
                      key={place}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-forest-50 border border-forest-200 text-forest-900 rounded-full text-[11px] font-medium"
                    >
                      <MapPin className="w-3 h-3 text-forest-600" />
                      <span>{place}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOriginTag(place)}
                        className="hover:text-rose-600 transition ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 mt-2 flex items-center justify-center space-x-2"
          >
            {mode === 'register' ? (
              <UserPlus className="w-4 h-4" />
            ) : mode === 'profile' ? (
              <Sparkles className="w-4 h-4" />
            ) : null}
            <span>
              {loading
                ? 'Processing...'
                : mode === 'register'
                ? 'Create Researcher Account'
                : mode === 'profile'
                ? 'Save Profile Changes'
                : mode === 'reset-password'
                ? 'Update & Reset Password'
                : 'Sign In'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
