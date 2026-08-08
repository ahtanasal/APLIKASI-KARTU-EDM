import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';
import { AppUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AppUser) => void;
  users: AppUser[];
}

export function LoginPage({ onLogin, users }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();

      if (!cleanUsername || !cleanPassword) {
        setErrorMsg('Silakan isi Username dan Password.');
        setIsLoading(false);
        return;
      }

      // Check if matches default admin fallback or database users
      let foundUser = users.find(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase() && u.password === cleanPassword
      );

      // Default Admin hardcoded fallback check if users array hasn't loaded yet or is empty
      if (!foundUser && cleanUsername.toUpperCase() === 'WSCHFY' && cleanPassword === 'Wschfy26') {
        foundUser = {
          id: 'admin-default-wschfy',
          username: 'WSCHFY',
          password: 'Wschfy26',
          name: 'Administrator Utama',
          level: 'admin',
          createdAt: new Date().toISOString()
        };
      }

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setErrorMsg('Username atau Password salah. Silakan periksa kembali!');
      }

      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-stone-900 text-stone-100 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-stone-950/80 backdrop-blur-xl border border-stone-800 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 space-y-8"
      >
        {/* Header with Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-stone-900 rounded-2xl border border-stone-800 shadow-inner">
            <img 
              src="/images/front_logo.png" 
              alt="Logo Eka Dharma Manggala" 
              className="w-14 h-14 object-contain" 
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Eka Dharma Manggala
            </h1>
            <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mt-1">
              Samarinda
            </p>
            <p className="text-xs text-stone-400 mt-2">
              Sistem Informasi & Cetak Kartu Umat
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-950/60 border border-red-800/80 text-red-200 rounded-2xl text-xs font-medium flex items-center gap-3"
          >
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <User size={14} className="text-amber-400" />
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda..."
                required
                className="w-full pl-10 pr-4 py-3 bg-stone-900 border border-stone-800 rounded-2xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
              <Lock size={14} className="text-amber-400" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda..."
                required
                className="w-full pl-10 pr-10 py-3 bg-stone-900 border border-stone-800 rounded-2xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold rounded-2xl text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound size={16} />
                <span>Masuk ke Sistem</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info badge */}
        <div className="pt-4 border-t border-stone-800/80 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-900/90 border border-stone-800 rounded-full text-[11px] text-stone-400 font-medium">
            <ShieldCheck size={13} className="text-amber-400" />
            <span>Hak Akses Terproteksi Berdasarkan Level User</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
