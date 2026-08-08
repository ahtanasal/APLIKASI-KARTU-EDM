import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Shield, UserCheck, Key, Edit, Trash2, 
  Search, X, Check, ShieldAlert, AlertCircle, Eye, EyeOff, Lock
} from 'lucide-react';
import { AppUser } from '../types';

interface UserManagementProps {
  users: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateUser: (id: string, updatedData: Partial<AppUser>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  currentUser: AppUser;
}

export function UserManagement({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser
}: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    level: 'user' as 'admin' | 'user'
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show password map for table
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      level: 'user'
    });
    setFormError('');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: AppUser) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: u.password,
      name: u.name || '',
      level: u.level
    });
    setFormError('');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanUsername = formData.username.trim();
    const cleanPassword = formData.password.trim();
    const cleanName = formData.name.trim() || cleanUsername;

    if (!cleanUsername) {
      setFormError('Username wajib diisi.');
      return;
    }
    if (!cleanPassword) {
      setFormError('Password wajib diisi.');
      return;
    }

    // Check duplicate username if adding or changing username
    const duplicate = users.find(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.id !== editingUser?.id
    );
    if (duplicate) {
      setFormError(`Username "${cleanUsername}" sudah digunakan oleh user lain!`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, {
          username: cleanUsername,
          password: cleanPassword,
          name: cleanName,
          level: formData.level,
          updatedAt: new Date().toISOString()
        });
      } else {
        await onAddUser({
          username: cleanUsername,
          password: cleanPassword,
          name: cleanName,
          level: formData.level
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u: AppUser) => {
    if (u.username.toUpperCase() === 'WSCHFY') {
      alert('User Admin Utama (WSCHFY) tidak dapat dihapus untuk keamanan sistem!');
      return;
    }
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus user "${u.username}" (${u.name})?`)) {
      try {
        await onDeleteUser(u.id);
      } catch (err: any) {
        alert('Gagal menghapus user: ' + err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchQuery = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchLevel = levelFilter === 'all' || u.level === levelFilter;
    return matchQuery && matchLevel;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-800 flex items-center gap-3">
            <Users className="text-amber-600" size={32} />
            Pengelolaan User Akses
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Kelola akun pengguna dan atur tingkat hak akses (Admin / User) ke sistem portal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 text-white hover:bg-stone-800 rounded-2xl text-xs font-bold transition-all shadow-md shadow-stone-900/10 shrink-0"
        >
          <UserPlus size={16} className="text-amber-400" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Access Level Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-stone-950 rounded-xl font-bold">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-sm">Level Admin</h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Akses penuh ke seluruh halaman (Input, Data Umat, Edit, Relasi, Desain ID Card, Master Data, Kelola User).
            </p>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl flex items-start gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl font-bold">
            <UserCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-sm">Level User</h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Akses terbatas hanya pada halaman <span className="font-bold">Input Data Umat</span> dan <span className="font-bold">Data Umat</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Cari username atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Level:</span>
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'admin', label: 'Admin' },
              { id: 'user', label: 'User' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLevelFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  levelFilter === tab.id
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table / Cards */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-4 px-6">User / Keterangan</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">Password</th>
                <th className="py-4 px-6">Hak Akses / Level</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isPrimaryAdmin = u.username.toUpperCase() === 'WSCHFY';
                  const showPass = !!visiblePasswords[u.id];

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            u.level === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {u.level === 'admin' ? <Shield size={18} /> : <Users size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-stone-800 flex items-center gap-2">
                              {u.name || u.username}
                              {isPrimaryAdmin && (
                                <span className="px-2 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-black rounded-md tracking-wider">
                                  UTAMA
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-stone-400">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-mono font-bold text-stone-800">
                        {u.username}
                      </td>

                      <td className="py-4 px-6 font-mono text-stone-600">
                        <div className="flex items-center gap-2">
                          <span>{showPass ? u.password : '••••••••'}</span>
                          <button
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="p-1 text-stone-400 hover:text-stone-600 transition-colors"
                            title={showPass ? 'Sembunyikan password' : 'Lihat password'}
                          >
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {u.level === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <Shield size={12} className="text-amber-700" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <UserCheck size={12} className="text-blue-600" />
                            USER (Input & Data)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={isPrimaryAdmin}
                            className={`p-2 rounded-xl transition-all ${
                              isPrimaryAdmin
                                ? 'text-stone-200 cursor-not-allowed'
                                : 'text-stone-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isPrimaryAdmin ? 'Admin Utama tidak dapat dihapus' : 'Hapus User'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400">
                    Tidak ada user ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
            >
              <div className="p-6 bg-stone-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-stone-950 rounded-xl">
                    {editingUser ? <Edit size={18} /> : <UserPlus size={18} />}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">
                      {editingUser ? 'Edit User Akses' : 'Tambah User Akses Baru'}
                    </h3>
                    <p className="text-xs text-stone-400">
                      {editingUser ? 'Perbarui informasi dan hak akses user' : 'Buat akun pengguna baru untuk sistem portal'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {formError && (
                <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Contoh: WSCHFY atau Budi123"
                    required
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Masukkan password user..."
                      required
                      className="w-full pl-4 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Nama / Keterangan User
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Operator Input Data Vihara"
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                    Hak Akses / Level <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                      formData.level === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-stone-900'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-1.5 text-amber-900">
                          <Shield size={16} className="text-amber-600" />
                          ADMIN
                        </span>
                        <input
                          type="radio"
                          name="level"
                          value="admin"
                          checked={formData.level === 'admin'}
                          onChange={() => setFormData(prev => ({ ...prev, level: 'admin' }))}
                          className="accent-amber-600"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight">
                        Akses penuh seluruh fitur & pengelolaan user.
                      </p>
                    </label>

                    <label className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                      formData.level === 'user'
                        ? 'bg-blue-50 border-blue-500 text-stone-900'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm flex items-center gap-1.5 text-blue-900">
                          <UserCheck size={16} className="text-blue-600" />
                          USER
                        </span>
                        <input
                          type="radio"
                          name="level"
                          value="user"
                          checked={formData.level === 'user'}
                          onChange={() => setFormData(prev => ({ ...prev, level: 'user' }))}
                          className="accent-blue-600"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 leading-tight">
                        Akses terbatas: Hanya Input Data & Data Umat.
                      </p>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-colors shadow-md shadow-amber-500/10 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>{editingUser ? 'Simpan Perubahan' : 'Tambah User'}</span>
                      </>
                    )}
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
