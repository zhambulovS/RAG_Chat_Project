import React, { useState, useMemo } from 'react';
import { 
  User, Save, Mail, Calendar, Shield, MapPin, Globe, Github, 
  Linkedin, Twitter, Camera, Award, Zap, FileText, MessageSquare, 
  Clock, TrendingUp, Bell, Lock, Activity
} from 'lucide-react';
import { UserProfile, Folder, ActivityItem } from '../types';

interface ProfileProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  folders: Folder[];
}

const Profile: React.FC<ProfileProps> = ({ profile, onSave, folders }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);

  // --- Dynamic Stats Calculation ---
  const stats = useMemo(() => {
    const totalFolders = folders.length;
    const totalFiles = folders.reduce((acc, f) => acc + f.files.length, 0);
    const totalMessages = folders.reduce((acc, f) => acc + f.messages.length, 0);
    
    const xp = (totalFolders * 10) + (totalFiles * 5) + (totalMessages * 1);
    const level = Math.floor(xp / 100) + 1;
    const nextLevelXp = level * 100;
    const progress = (xp % 100);

    return { totalFolders, totalFiles, totalMessages, xp, level, nextLevelXp, progress };
  }, [folders]);

  const activityLog: ActivityItem[] = useMemo(() => {
    const log: ActivityItem[] = [];
    folders.forEach(f => {
      log.push({ id: f.id + '_create', type: 'folder_create', title: `Создан проект "${f.name}"`, timestamp: f.createdAt });
      f.files.forEach(file => {
        log.push({ id: file.id, type: 'file_upload', title: `Загружен документ`, subtitle: file.name, timestamp: f.updatedAt || f.createdAt });
      });
    });
    return log.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [folders]);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // Limit to 500KB for LocalStorage safety
        alert("Файл слишком большой. Пожалуйста, выберите изображение меньше 500KB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // This ensures result is a string (base64)
        if (typeof reader.result === 'string') {
          setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const updatedProfile = {
      ...formData,
      gamification: {
        ...formData.gamification,
        xp: stats.xp,
        level: stats.level,
        badges: stats.level > 5 ? [...(formData.gamification?.badges || []), 'Эксперт'] : (formData.gamification?.badges || [])
      }
    };
    onSave(updatedProfile);
    setTimeout(() => {
      setIsSaving(false);
      setEditMode(false);
    }, 500);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      <div className="relative bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 w-full relative overflow-hidden">
           <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row items-end -mt-12 sm:-mt-16 mb-6 gap-6">
            
            {/* Avatar Fix */}
            <div className="relative group z-10">
              <div className="w-32 h-32 rounded-2xl border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-700 shadow-xl overflow-hidden flex items-center justify-center">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-slate-300 dark:text-slate-500" />
                )}
              </div>
              {editMode && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer p-4 w-full h-full flex items-center justify-center">
                    <Camera className="text-white" size={32} />
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} />
                  </label>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left mb-2">
              {editMode ? (
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="text-3xl font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 outline-none w-full max-w-sm mb-1"
                />
              ) : (
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{formData.name}</h1>
              )}
              <p className="text-slate-500 dark:text-slate-400 font-medium">{formData.role} • {formData.email}</p>
            </div>

            <div className="flex gap-3 mb-4">
              {editMode ? (
                <>
                   <button onClick={() => { setEditMode(false); setFormData(profile); }} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Отмена</button>
                   <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2">{isSaving ? '...' : 'Сохранить'}</button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} className="px-6 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm">Редактировать</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><User size={20} className="text-indigo-500" /> О себе</h3>
                {editMode ? (
                  <textarea name="bio" value={formData.bio || ''} onChange={handleInputChange} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32" placeholder="Расскажите немного о себе..." />
                ) : (
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{formData.bio || "Описание профиля не заполнено."}</p>
                )}
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Globe size={20} className="text-indigo-500" /> Социальные сети</h3>
                <div className="space-y-4">
                  {[{ icon: Github, key: 'github', placeholder: 'github.com/user' }, { icon: Twitter, key: 'twitter', placeholder: 'twitter.com/user' }, { icon: Linkedin, key: 'linkedin', placeholder: 'linkedin.com/in/user' }].map((item) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400"><item.icon size={16} /></div>
                      <div className="flex-1">
                        {editMode ? (
                          <input type="text" name={item.key} value={(formData.socialLinks as any)?.[item.key] || ''} onChange={handleSocialChange} placeholder={item.placeholder} className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500" />
                        ) : (
                          <span className="text-sm text-slate-600 dark:text-slate-300 truncate block">{(formData.socialLinks as any)?.[item.key] || <span className="text-slate-400 italic">Не указано</span>}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><Award size={64} /></div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Ваш Уровень</p>
                    <h2 className="text-4xl font-bold mb-3">{stats.level}</h2>
                    <div className="w-full bg-black/20 rounded-full h-2 mb-2"><div className="bg-white/90 h-2 rounded-full" style={{ width: `${stats.progress}%` }}></div></div>
                    <p className="text-xs text-indigo-100 opacity-80">{stats.xp} XP / {stats.nextLevelXp} XP</p>
                 </div>
                 <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm"><h3 className="text-2xl font-bold">{stats.totalFiles}</h3><p className="text-sm text-slate-500">Документов</p></div>
                 <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm"><h3 className="text-2xl font-bold">{stats.totalMessages}</h3><p className="text-sm text-slate-500">Сообщений</p></div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Activity size={20} className="text-indigo-500" /> Активность</h3>
                <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-3 space-y-8">
                    {activityLog.map((item, idx) => (
                      <div key={idx} className="relative pl-8">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${item.type === 'folder_create' ? 'bg-indigo-500' : 'bg-blue-500'}`}></div>
                        <div><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</p></div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;