import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { AuthMode } from './AuthModal.js';
import {
  GitFork,
  Users,
  Sparkles,
  Plus,
  RefreshCw,
  LogOut,
  UserCheck,
  ChevronDown,
  UserPlus,
  User as UserIcon,
  KeyRound
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'tree' | 'matches' | 'connections';
  setActiveTab: (tab: 'tree' | 'matches' | 'connections') => void;
  onOpenAddModal: () => void;
  matchesCount: number;
  onResetSeed: () => void;
  onOpenAuth: (mode?: AuthMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  matchesCount,
  onResetSeed,
  onOpenAuth
}) => {
  const { user, switchDemoUser, logout } = useAuth();
  const { notifications } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const demoAccounts = [
    { name: 'Eleanor Vance', email: 'eleanor@rootsconnect.local', role: 'Branch A (Boston/Cork)' },
    { name: 'Marcus Vance', email: 'marcus@rootsconnect.local', role: 'Branch B (Chicago/Cork)' },
    { name: 'Clara Miller', email: 'clara@rootsconnect.local', role: 'Independent Researcher' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-parchment-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center text-white shadow-md shadow-forest-900/10">
              <GitFork className="w-6 h-6 rotate-180" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif-heading text-xl font-bold tracking-tight text-forest-950">
                  RootsConnect
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-forest-100 text-forest-800 rounded">
                  AI Genealogy
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">Smart Ancestral Heritage Network</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-parchment-100 p-1 rounded-xl border border-parchment-200">
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'tree'
                  ? 'bg-white text-forest-800 shadow-sm'
                  : 'text-slate-600 hover:text-forest-800 hover:bg-white/50'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Family Tree</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'matches'
                  ? 'bg-white text-forest-800 shadow-sm'
                  : 'text-slate-600 hover:text-forest-800 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Smart Matches</span>
              {matchesCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-amber-500 rounded-full animate-pulse">
                  {matchesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('connections')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'connections'
                  ? 'bg-white text-forest-800 shadow-sm'
                  : 'text-slate-600 hover:text-forest-800 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kinship & Relatives</span>
            </button>
          </nav>

          {/* Actions & User Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Direct Create User Button */}
            <button
              onClick={() => onOpenAuth('register')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-parchment-100 hover:bg-parchment-200 text-forest-900 border border-parchment-200 text-xs font-bold transition shadow-2xs"
            >
              <UserPlus className="w-4 h-4 text-forest-700" />
              <span>Create User</span>
            </button>

            {/* Add Ancestor Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold transition shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ancestor</span>
            </button>

            {/* User Profile & Demo Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-parchment-200 bg-parchment-50 hover:bg-parchment-100 text-slate-700 text-xs font-medium transition"
              >
                <div className="w-6 h-6 rounded-full bg-forest-200 text-forest-800 flex items-center justify-center font-bold text-xs">
                  {user ? user.name.charAt(0) : '?'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user ? user.name : 'Sign In'}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-none">
                    {user ? user.email : 'Switch Account'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-parchment-200 py-2 z-50 text-sm animate-fade-in">
                  {/* Current User Header */}
                  {user && (
                    <div className="px-3.5 py-2.5 border-b border-slate-100 bg-parchment-50/50">
                      <div className="text-xs font-bold text-slate-800">{user.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                      {user.originPlaces && user.originPlaces.length > 0 && (
                        <div className="text-[10px] text-forest-700 mt-1 flex items-center gap-1">
                          <span className="font-semibold">Origins:</span>
                          <span className="truncate">{user.originPlaces.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account Actions */}
                  <div className="py-1 px-1.5 border-b border-slate-100">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuth('register');
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-forest-800 hover:bg-forest-50 rounded-lg flex items-center space-x-2 font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-forest-600" />
                      <span>Create New User Account</span>
                    </button>

                    {user && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenAuth('profile');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Profile & Origins</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuth('reset-password');
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center space-x-2"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset Password</span>
                    </button>
                  </div>

                  {/* Demo Personas Header */}
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Demo Personas
                    </p>
                  </div>

                  <div className="py-0.5">
                    {demoAccounts.map(demo => (
                      <button
                        key={demo.email}
                        onClick={() => {
                          switchDemoUser(demo.email);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-forest-50 transition ${
                          user?.email === demo.email ? 'bg-forest-50/70 font-semibold text-forest-800' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs">{demo.name}</div>
                          <div className="text-[10px] text-slate-400">{demo.role}</div>
                        </div>
                        {user?.email === demo.email && (
                          <UserCheck className="w-4 h-4 text-forest-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Reset & Sign Out */}
                  <div className="pt-2 border-t border-slate-100 px-2 space-y-1">
                    <button
                      onClick={() => {
                        onResetSeed();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-amber-700 hover:bg-amber-50 rounded flex items-center space-x-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Demo Trees</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                        onOpenAuth('login');
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Switch</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
