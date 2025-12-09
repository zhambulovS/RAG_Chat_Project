import React, { useState } from 'react';
import { Folder, Plus, MessageSquare, FileText, Trash2, FolderOpen, Search, Pin, Star } from 'lucide-react';
import { Folder as FolderType } from '../types';

interface DashboardProps {
  folders: FolderType[];
  onCreateFolder: (name: string, description: string) => void;
  onDeleteFolder: (id: string) => void;
  onOpenFolder: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ folders, onCreateFolder, onDeleteFolder, onOpenFolder }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [search, setSearch] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateFolder(newName, newDesc);
    setNewName('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Мои Папки</h1>
          <p className="text-slate-500 dark:text-slate-400">Управляйте документами и чатами по проектам</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={20} />
          Создать папку
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Поиск папок..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Grid */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <FolderOpen size={64} className="mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-medium">Нет созданных папок</p>
          <p className="text-sm mb-6">Создайте новую папку, чтобы начать работу</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Создать сейчас &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFolders.map(folder => {
            const pinnedCount = folder.messages.filter(m => m.isPinned).length;
            const starredCount = folder.messages.filter(m => m.isFavorite).length;

            return (
              <div 
                key={folder.id}
                onClick={() => onOpenFolder(folder.id)}
                className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer relative flex flex-col h-52"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Folder size={24} />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Удалить папку"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 truncate">
                  {folder.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                  {folder.description || 'Нет описания'}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">
                  <div className="flex items-center gap-1" title="Файлов">
                    <FileText size={14} />
                    <span>{folder.files.length}</span>
                  </div>
                  <div className="flex items-center gap-1" title="Сообщений">
                    <MessageSquare size={14} />
                    <span>{folder.messages.length}</span>
                  </div>
                  
                  {/* Pinned & Starred Counts */}
                  {(pinnedCount > 0 || starredCount > 0) && (
                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                       {pinnedCount > 0 && (
                         <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-500" title="Закрепленные">
                           <Pin size={12} className="fill-current"/> <span>{pinnedCount}</span>
                         </div>
                       )}
                       {starredCount > 0 && (
                         <div className="flex items-center gap-0.5 text-yellow-500" title="Избранные">
                           <Star size={12} className="fill-current"/> <span>{starredCount}</span>
                         </div>
                       )}
                    </div>
                  )}

                  <div className="ml-auto">
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Новая папка</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Название</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Например: Проект Марс"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Описание (опционально)</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                  placeholder="О чем этот проект..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;