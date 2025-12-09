import React, { useRef } from 'react';
import { Moon, Sun, Trash, AlertTriangle, Download, Upload, Monitor, Type, Layout, Palette } from 'lucide-react';
import { Folder, UserProfile } from '../types';

interface SettingsProps {
  onClearData: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  exportData: Folder[];
  onImportData: (data: Folder[]) => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  onClearData, 
  theme, 
  onThemeChange,
  exportData,
  onImportData,
  userProfile,
  onUpdateProfile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    if (window.confirm('Вы уверены? Это удалит ВСЕ текущие папки и историю чатов в этом браузере.')) {
      onClearData();
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docuchat_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm(`Найдено ${json.length} папок. Импортировать?`)) onImportData(json as Folder[]);
        } else alert('Неверный формат файла бекапа.');
      } catch (err) { alert('Ошибка чтения JSON файла.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updatePreference = (key: string, value: any) => {
    onUpdateProfile({
      ...userProfile,
      preferences: {
        ...userProfile.preferences!,
        [key]: value
      }
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto w-full h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8">Настройки Платформы</h1>
      
      <div className="space-y-6">
        
        {/* Appearance Section */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Monitor size={20} className="text-indigo-500"/>
            Внешний вид и Персонализация
          </h3>
          
          {/* Theme */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">Тема оформления</p>
              <p className="text-sm text-slate-500">Светлая или темная тема</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
               <button onClick={() => onThemeChange('light')} className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Sun size={20}/></button>
               <button onClick={() => onThemeChange('dark')} className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'}`}><Moon size={20}/></button>
            </div>
          </div>

          {/* Density */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex gap-2 items-center">
              <Layout size={18} className="text-slate-400" />
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Плотность интерфейса</p>
                <p className="text-sm text-slate-500">Компактный или комфортный</p>
              </div>
            </div>
            <select 
              value={userProfile.preferences?.uiDensity}
              onChange={(e) => updatePreference('uiDensity', e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm p-2 outline-none"
            >
              <option value="comfortable">Комфортный (Comfortable)</option>
              <option value="compact">Компактный (Compact)</option>
            </select>
          </div>

           {/* Font Size */}
           <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="flex gap-2 items-center">
              <Type size={18} className="text-slate-400" />
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Размер шрифта</p>
              </div>
            </div>
            <div className="flex gap-2">
               {['small', 'medium', 'large'].map((size) => (
                 <button
                   key={size}
                   onClick={() => updatePreference('fontSize', size)}
                   className={`px-3 py-1 rounded border capitalize text-sm ${userProfile.preferences?.fontSize === size ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                 >
                   {size}
                 </button>
               ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <Palette size={18} className="text-slate-400" />
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Цветовой акцент</p>
              </div>
            </div>
            <div className="flex gap-2">
               {['#6366f1', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#f97316'].map((color) => (
                 <button
                   key={color}
                   onClick={() => updatePreference('customColor', color)}
                   className={`w-6 h-6 rounded-full border-2 ${userProfile.preferences?.customColor === color ? 'border-slate-800 dark:border-white' : 'border-transparent'}`}
                   style={{ backgroundColor: color }}
                 />
               ))}
            </div>
          </div>

        </section>

        {/* Data Management */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Download size={20} className="text-green-500"/>
            Управление данными
          </h3>
          <div className="flex gap-3">
             <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium">
               <Download size={18} /> Экспорт
             </button>
             <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium">
               <Upload size={18} /> Импорт
             </button>
             <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImportFile} />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-red-500">
          <div className="mb-4">
             <div className="flex items-center gap-2 text-red-600 font-bold mb-1"><AlertTriangle size={20} /> Опасная зона</div>
             <p className="text-sm text-slate-500">Действие необратимо удалит локальные данные.</p>
          </div>
          <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 rounded-lg w-full justify-center">
            <Trash size={18} /> Стереть все данные
          </button>
        </section>
      </div>
    </div>
  );
};

export default Settings;