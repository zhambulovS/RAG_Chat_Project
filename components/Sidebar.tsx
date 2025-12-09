import React, { useRef } from 'react';
import { UploadedFile, UserProfile } from '../types';
import { Upload, FileText, Trash2, FileCode, FileJson, FileSpreadsheet, FileType, X, ArrowLeft, User, Eye, GraduationCap, Image as ImageIcon } from 'lucide-react';

interface SidebarProps {
  folderName?: string;
  files: UploadedFile[];
  onAddFiles: (files: FileList) => void;
  onRemoveFile: (id: string) => void;
  onViewFile: (file: UploadedFile) => void;
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  user: UserProfile | null;
  onOpenQuiz?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ folderName, files, onAddFiles, onRemoveFile, onViewFile, isOpen, onClose, onBack, user, onOpenQuiz }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return <FileType size={18} className="text-red-500" />;
    if (lower.endsWith('.docx')) return <FileText size={18} className="text-blue-600" />;
    if (lower.endsWith('.xlsx') || lower.endsWith('.csv')) return <FileSpreadsheet size={18} className="text-green-600" />;
    if (lower.endsWith('.json')) return <FileJson size={18} className="text-yellow-500" />;
    if (lower.match(/\.(js|ts|tsx|py|html|css)$/)) return <FileCode size={18} className="text-blue-500" />;
    if (lower.match(/\.(jpg|jpeg|png|webp|bmp)$/)) return <ImageIcon size={18} className="text-purple-500" />;
    return <FileText size={18} className="text-slate-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className={`
      fixed inset-y-0 left-0 z-40 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0 flex flex-col h-full shadow-xl md:shadow-none
    `}>
        {/* Header with Back Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
           <button 
             onClick={onBack}
             className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-4 transition-colors"
           >
             <ArrowLeft size={16} />
             <span className="text-sm font-medium">К папкам</span>
           </button>
           
           <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate max-w-[200px]" title={folderName}>
                <FileText className="w-5 h-5 text-indigo-600" />
                {folderName || 'Документы'}
              </h2>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-3">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50 group"
          >
            <Upload className="w-6 h-6 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Добавить в контекст
            </span>
            <input 
              type="file" 
              multiple 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css,.jpg,.jpeg,.png,.webp,.bmp"
            />
          </div>

          {onOpenQuiz && (
            <button 
              onClick={onOpenQuiz}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <GraduationCap size={18} />
              <span className="font-medium text-sm">Создать Тест</span>
            </button>
          )}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Файлы ({files.length})
          </h3>
          
          {files.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              Нет файлов.
              <br/>
              Бот не знает контекста.
            </div>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li key={file.id} className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm group">
                  <div 
                    className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1 min-w-0" 
                    onClick={() => onViewFile(file)}
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatSize(file.size)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewFile(file)}
                      className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Просмотреть"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => onRemoveFile(file.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Удалить файл"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* User Footer */}
        {user && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
               <User size={16} />
             </div>
             <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</span>
               <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
             </div>
          </div>
        )}
    </div>
  );
};

export default Sidebar;