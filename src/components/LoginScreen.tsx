/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, AlertCircle, ShoppingCart, Key, Check, Info, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ users, onLoginSuccess }: LoginScreenProps) {
  // --- Standard Login form states ---
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // --- First-Time Password Reset Phase states ---
  const [isFirstTimeReset, setIsFirstTimeReset] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // --- Demo Credentials Drawer ---
  const [showDemoDrawer, setShowDemoDrawer] = useState<boolean>(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredUsername = usernameInput.trim().toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === enteredUsername);

    if (user && user.passwordHash === passwordInput) {
      // Correct password entered! Now check if this is the first-time login
      if (user.isFirstTime !== false) {
        setMatchedUser(user);
        setIsFirstTimeReset(true);
        setNewPassword('');
        setConfirmPassword('');
        setResetError(null);
      } else {
        // Normal direct authentication
        onLoginSuccess(user);
      }
    } else {
      setError('Invalid username or password. Please verify credentials and try again.');
    }
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!matchedUser) return;

    if (newPassword.length < 4) {
      setResetError('For security, passwords must be at least 4 characters long.');
      return;
    }

    if (newPassword === matchedUser.username + '123') {
      setResetError('You cannot reuse the default temporary password. Please choose a new secure password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('The passwords you entered do not match. Please re-enter them.');
      return;
    }

    // Success! Update password and set isFirstTime to false
    const updatedUser: User = {
      ...matchedUser,
      passwordHash: newPassword,
      isFirstTime: false
    };

    onLoginSuccess(updatedUser);
  };

  const selectDemoUser = (username: string, temporaryPassword: string) => {
    setUsernameInput(username);
    setPasswordInput(temporaryPassword);
    setError(null);
    setShowDemoDrawer(false);
  };

  return (
    <div id="login_screen_container" className="min-h-screen bg-[#020617] flex flex-col justify-center items-center p-4 selection:bg-teal-500 selection:text-white relative">
      
      {/* Premium Ambient Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 z-10 relative overflow-hidden"
        id="login_card"
      >
        <AnimatePresence mode="wait">
          {!isFirstTimeReset ? (
            /* --- PHASE 1: STANDARD LOGIN --- */
            <motion.div
              key="login_form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              id="standard_login_container"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-2xl mb-4 text-teal-400">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="text-xs font-black tracking-widest text-teal-500 uppercase">WCS Supermarket</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-semibold text-slate-400">PRO</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Operator Authentication</h1>
                <p className="text-slate-400 text-xs mt-1">Please enter your system username and security password</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Username ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      id="login_username_input"
                      type="text"
                      required
                      placeholder="e.g. cashier, admin, owner"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-transparent transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login_password_input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-transparent transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed"
                    id="login_error"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <button
                  id="login_submit_btn"
                  type="submit"
                  className="w-full py-3.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer text-center flex justify-center items-center gap-2 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4" />
                  Authenticate & Open register
                </button>
              </form>

              {/* Collapsible Demo Users Panel */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                  className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-teal-400 font-semibold py-1.5 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal-500" />
                    Need help logging in? View operators list
                  </span>
                  <span>{showDemoDrawer ? 'Hide' : 'Show'}</span>
                </button>

                <AnimatePresence>
                  {showDemoDrawer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <div className="bg-slate-950/85 border border-slate-800/60 p-3 rounded-xl text-xs space-y-2">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Select profile to prefill:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {users.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => selectDemoUser(u.username, u.passwordHash)}
                              className="text-left p-2 hover:bg-teal-950/20 hover:border-teal-500/30 border border-slate-800/80 rounded-lg flex items-center justify-between group transition-all"
                            >
                              <div>
                                <span className="font-bold text-slate-200 group-hover:text-teal-400 transition-colors">{u.name}</span>
                                <span className="text-[10px] text-slate-500 block">Username: <span className="font-mono text-slate-400">{u.username}</span></span>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-400 uppercase tracking-wider group-hover:border-teal-500/20 group-hover:text-teal-400">
                                {u.role}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            /* --- PHASE 2: FIRST TIME PASSWORD UPDATE REQUIRED --- */
            <motion.div
              key="password_reset_form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              id="password_reset_container"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 text-amber-400">
                  <Key className="w-10 h-10 animate-bounce" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">First-Time Setup Required</h1>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Welcome, <span className="text-teal-400 font-bold">{matchedUser?.name}</span>! Since you are logging in for the first time, you must replace your temporary login password.
                </p>
              </div>

              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Choose New Secure Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reset_new_password_input"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 4 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-transparent transition-all font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reset_confirm_password_input"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-transparent transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                {resetError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2.5 p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs leading-relaxed animate-shake"
                    id="reset_error"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{resetError}</span>
                  </motion.div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstTimeReset(false);
                      setMatchedUser(null);
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-transparent text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    id="submit_password_reset"
                    type="submit"
                    className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20"
                  >
                    <Check className="w-4 h-4" />
                    Save & Initialize Register
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-500">
            WCS Inventory POS v2.4 • Client Secure Session
          </p>
        </div>
      </motion.div>
    </div>
  );
}
