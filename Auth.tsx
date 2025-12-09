import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (isRegistering && !name)) {
      setError('Пожалуйста, заполните все поля');
      setLoading(false);
      return;
    }

    try {
      if (supabase) {
        // --- SUPABASE LOGIC ---
        if (isRegistering) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, role: 'Исследователь' }
            }
          });

          if (authError) throw authError;

          if (authData.user) {
            // Create profile entry
            const newUser: UserProfile = {
              id: authData.user.id,
              email: authData.user.email!,
              name: name,
              role: 'Исследователь',
              joinedAt: Date.now()
            };
            
            // We manually insert profile because triggers might not be set up by user
            await supabase.from('profiles').insert({
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              joined_at: newUser.joinedAt
            });

            onLogin(newUser);
          }
        } else {
          // Login
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError) throw authError;

          if (authData.user) {
            // Fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', authData.user.id)
              .single();

            const userProfile: UserProfile = {
              id: authData.user.id,
              email: authData.user.email!,
              name: profileData?.name || authData.user.user_metadata.name || 'Пользователь',
              role: profileData?.role || 'Исследователь',
              joinedAt: profileData?.joined_at || Date.now()
            };

            onLogin(userProfile);
          }
        }

      } else {
        // --- LOCAL STORAGE FALLBACK LOGIC ---
        // Simulation of backend authentication using LocalStorage
        const usersStr = localStorage.getItem('docuchat_users');
        const users: Record<string, any> = usersStr ? JSON.parse(usersStr) : {};

        if (isRegistering) {
          if (users[email]) {
            throw new Error('Пользователь с таким email уже существует');
          }
          
          const newUser: UserProfile = {
            id: uuidv4(),
            email,
            name,
            role: 'Новичок',
            joinedAt: Date.now()
          };

          users[email] = { ...newUser, password }; 
          localStorage.setItem('docuchat_users', JSON.stringify(users));
          
          onLogin(newUser);
        } else {
          const user = users[email];
          if (!user || user.password !== password) {
            throw new Error('Неверный email или пароль');
          }
          
          const { password: _, ...safeUser } = user;
          onLogin(safeUser as UserProfile);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Произошла ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-indigo-500/30">
            DC
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {isRegistering ? 'Создать аккаунт' : 'С возвращением'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isRegistering ? 'Начните работу с умными документами' : 'Войдите, чтобы продолжить работу'}
          </p>
          {!supabase && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded inline-block">
              Режим LocalStorage (Supabase не настроен)
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Имя</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="Иван Иванов"
                  required={isRegistering}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                placeholder="hello@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Загрузка...' : (isRegistering ? 'Зарегистрироваться' : 'Войти')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isRegistering ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              {isRegistering ? 'Войти' : 'Создать'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;