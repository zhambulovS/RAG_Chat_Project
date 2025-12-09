import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Mail, Lock, User, ArrowRight, Github } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (isRegistering && !name)) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    // Simulation of backend authentication using LocalStorage
    const usersStr = localStorage.getItem('docuchat_users');
    const users: Record<string, any> = usersStr ? JSON.parse(usersStr) : {};

    if (isRegistering) {
      if (users[email]) {
        setError('Пользователь с таким email уже существует');
        return;
      }
      
      const newUser: UserProfile = {
        id: uuidv4(),
        email,
        name,
        role: 'Новичок',
        joinedAt: Date.now()
      };

      // Save "password" (mock) and user data
      users[email] = { ...newUser, password }; // In real app, never store plain text passwords
      localStorage.setItem('docuchat_users', JSON.stringify(users));
      
      onLogin(newUser);
    } else {
      const user = users[email];
      if (!user || user.password !== password) {
        setError('Неверный email или пароль');
        return;
      }
      
      const { password: _, ...safeUser } = user;
      onLogin(safeUser as UserProfile);
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {isRegistering ? 'Зарегистрироваться' : 'Войти'}
            <ArrowRight size={18} />
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
