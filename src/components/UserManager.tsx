/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, Plus, Trash2, Key, UserCheck, X, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagerProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  currentUser: User;
}

export default function UserManager({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
}: UserManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form States (Add)
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [password, setPassword] = useState('');

  // Form States (Edit)
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('cashier');
  const [editPassword, setEditPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim() || !password.trim()) return;

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      alert('Username already exists. Please choose another username.');
      return;
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: username.toLowerCase().trim(),
      name,
      role,
      passwordHash: password,
      isFirstTime: true,
    };

    onAddUser(newUser);
    setUsername('');
    setName('');
    setRole('cashier');
    setPassword('');
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUsername.trim() || !editName.trim() || !editPassword.trim()) return;

    // Check duplicate username (excluding the currently edited user)
    if (users.some(u => u.id !== editingUser.id && u.username.toLowerCase() === editUsername.toLowerCase())) {
      alert('Username already exists. Please choose another username.');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      username: editUsername.toLowerCase().trim(),
      name: editName,
      role: editRole,
      passwordHash: editPassword,
    };

    onUpdateUser(updatedUser);
    setShowEditModal(false);
    setEditingUser(null);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPassword(user.passwordHash);
    setShowEditModal(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden" id="user_governance_panel">
      
      {/* Header section with add button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-md font-bold text-white">System Security Operators</h3>
          <p className="text-xs text-slate-400">Manage authenticated profiles and access scopes for cash registers and analytics</p>
        </div>

        <button
          id="add_operator_btn"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Operator Profile
        </button>
      </div>

      {/* Operators List Panel */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto">
        <table className="w-full text-left border-collapse" id="users_table">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Operator Name</th>
              <th className="py-3 px-4">Username ID</th>
              <th className="py-3 px-4 text-center">Assigned Role Scope</th>
              <th className="py-3 px-4 text-center font-mono">Password (Demo)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-sm">
            {users.map((user) => {
              const isSelf = user.id === currentUser.id;
              return (
                <tr key={user.id} className="hover:bg-slate-950/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {user.name}
                      {isSelf && (
                        <span className="px-1.5 py-0.5 bg-teal-950 text-teal-400 border border-teal-900/30 rounded text-[9px] font-black uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono">
                    {user.username}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      user.role === 'owner' 
                        ? 'bg-amber-950 text-amber-400 border border-amber-900/20' 
                        : user.role === 'admin' 
                          ? 'bg-purple-950 text-purple-400 border border-purple-900/20' 
                          : 'bg-slate-950 text-slate-400 border border-slate-850'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                    {/* Simulated secret text, showing characters to admins/owners */}
                    {currentUser.role !== 'cashier' ? user.passwordHash : '••••••••'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 rounded transition-all cursor-pointer bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-400"
                        title="Edit operator profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={isSelf}
                        onClick={() => {
                          if (confirm(`Are you absolutely sure you want to remove operator profile: ${user.name}?`)) {
                            onDeleteUser(user.id);
                          }
                        }}
                        className={`p-1.5 rounded transition-all cursor-pointer ${
                          isSelf 
                            ? 'bg-slate-850 text-slate-700 cursor-not-allowed' 
                            : 'bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400'
                        }`}
                        title={isSelf ? 'Cannot delete your active session profile' : 'Delete operator profile'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: REGISTER OPERATOR PROFILE */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="user_form_modal"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-teal-400 animate-pulse" />
                  Add Operator Account
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Operator Full Name *
                  </label>
                  <input
                    id="form_usr_name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samantha Perera"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Username ID (Sign-in Key) *
                  </label>
                  <input
                    id="form_usr_username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. samantha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Role Scope
                    </label>
                    <select
                      id="form_usr_role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="cashier">CASHIER</option>
                      <option value="admin">ADMIN</option>
                      <option value="owner">OWNER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      id="form_usr_password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    id="form_usr_submit"
                    type="submit"
                    className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Register Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT OPERATOR PROFILE */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl"
              id="user_edit_modal"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <Pencil className="w-5 h-5 text-teal-400" />
                  Edit Operator Profile
                </h3>
                <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                  &times;
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Operator Full Name *
                  </label>
                  <input
                    id="edit_usr_name"
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Samantha Perera"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Username ID (Sign-in Key) *
                  </label>
                  <input
                    id="edit_usr_username"
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="e.g. samantha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Role Scope
                    </label>
                    <select
                      id="edit_usr_role"
                      value={editRole}
                      disabled={editingUser.id === currentUser.id}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className={`w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${editingUser.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={editingUser.id === currentUser.id ? 'You cannot alter your own active system privilege role' : ''}
                    >
                      <option value="cashier">CASHIER</option>
                      <option value="admin">ADMIN</option>
                      <option value="owner">OWNER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      id="edit_usr_password"
                      type="password"
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    id="edit_usr_submit"
                    type="submit"
                    className="flex-1 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm transition-colors cursor-pointer text-center"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
