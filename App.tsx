import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Auth from './components/Auth';
import FileViewer from './components/FileViewer';
import QuizGenerator from './components/QuizGenerator'; // New Component
import { UploadedFile, Message, Folder, UserProfile, QuizResult } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { parseFileContent } from './services/fileParsingService';
import { LayoutDashboard, Settings as SettingsIcon, User, LogOut, Cloud, CloudOff } from 'lucide-react';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  // --- Global State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // --- App Data State ---
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'chat' | 'profile' | 'settings'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // --- Theme & Appearance Logic ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('docuchat_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('docuchat_theme', theme);
  }, [theme]);

  // Apply User Preferences
  useEffect(() => {
    if (userProfile?.preferences) {
      const root = document.documentElement;
      const { fontSize, uiDensity, customColor } = userProfile.preferences;

      let baseSize = '16px';
      if (fontSize === 'small') baseSize = '14px';
      if (fontSize === 'large') baseSize = '18px';
      root.style.setProperty('--font-size-base', baseSize);

      root.setAttribute('data-density', uiDensity);

      if (customColor) {
        root.style.setProperty('--color-primary', customColor);
      } else {
        root.style.removeProperty('--color-primary');
      }
    }
  }, [userProfile?.preferences]);

  // ... (Data Loading Logic kept same - omitted for brevity) ...
  const fetchFoldersFromSupabase = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('folders').select(`*, files (*), messages (*)`).eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const mappedFolders: Folder[] = data.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
          files: f.files.map((file: any) => ({ id: file.id, name: file.name, content: file.content, type: file.type, size: file.size })),
          messages: f.messages.sort((a: any, b: any) => a.timestamp - b.timestamp).map((msg: any) => ({
             id: msg.id, role: msg.role, text: msg.text, timestamp: msg.timestamp, isError: msg.is_error,
             isPinned: msg.is_pinned || false, isFavorite: msg.is_favorite || false, reactions: msg.reactions || {}, replyToId: msg.reply_to_id
          }))
        }));
        setFolders(mappedFolders);
      }
    } catch (e) { console.error("Supabase fetch error:", e); }
  };

  const loadUserData = (userId: string) => {
    if (supabase) { fetchFoldersFromSupabase(userId); } 
    else {
      const userFoldersKey = `docuchat_folders_${userId}`;
      const savedFolders = localStorage.getItem(userFoldersKey);
      if (savedFolders) { try { setFolders(JSON.parse(savedFolders)); } catch (e) { console.error(e); } } 
      else { setFolders([]); }
    }
  };
  
  // ... (Auth Logic kept same) ...
  const enrichProfile = (user: UserProfile): UserProfile => {
    return {
      ...user,
      lastLoginAt: Date.now(),
      socialLinks: user.socialLinks || { github: '', twitter: '', linkedin: '', website: '' },
      preferences: user.preferences || { themeAccent: 'indigo', emailNotifications: true, pushNotifications: false, timezone: 'Europe/Moscow', dateFormat: 'DD.MM.YYYY', uiDensity: 'comfortable', fontSize: 'medium' },
      gamification: user.gamification || { xp: 0, level: 1, badges: ['Новичок'] },
      quizHistory: user.quizHistory || []
    };
  };

  useEffect(() => {
    const checkSession = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          handleLogin({ id: session.user.id, email: session.user.email!, name: profile?.name || 'Пользователь', role: profile?.role || 'Исследователь', joinedAt: profile?.joined_at || Date.now() });
        }
      } else {
        const sessionUser = localStorage.getItem('docuchat_session');
        if (sessionUser) { try { handleLogin(JSON.parse(sessionUser)); } catch (e) {} }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!supabase && isAuthenticated && userProfile) {
      localStorage.setItem(`docuchat_folders_${userProfile.id}`, JSON.stringify(folders));
    }
  }, [folders, isAuthenticated, userProfile]);

  const handleLogin = (user: UserProfile) => {
    const enrichedUser = enrichProfile(user);
    setUserProfile(enrichedUser);
    setIsAuthenticated(true);
    if (!supabase) localStorage.setItem('docuchat_session', JSON.stringify(enrichedUser));
    loadUserData(user.id);
    setView('dashboard');
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setFolders([]);
    localStorage.removeItem('docuchat_session');
  };

  const handleCreateFolder = async (name: string, description: string) => {
    const newFolder: Folder = { id: uuidv4(), name, description, createdAt: Date.now(), updatedAt: Date.now(), files: [], messages: [] };
    setFolders(prev => [newFolder, ...prev]);
    if (supabase && userProfile) {
      await supabase.from('folders').insert({ id: newFolder.id, user_id: userProfile.id, name: newFolder.name, description: newFolder.description, created_at: newFolder.createdAt, updated_at: newFolder.updatedAt });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (confirm('Вы уверены?')) {
      setFolders(prev => prev.filter(f => f.id !== id));
      if (activeFolderId === id) { setActiveFolderId(null); setView('dashboard'); }
      if (supabase) await supabase.from('folders').delete().eq('id', id);
    }
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    if (supabase) { await supabase.from('profiles').update({ name: updatedProfile.name, role: updatedProfile.role }).eq('id', updatedProfile.id); } 
    else {
      localStorage.setItem('docuchat_session', JSON.stringify(updatedProfile));
      const usersStr = localStorage.getItem('docuchat_users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        if (users[updatedProfile.email]) { users[updatedProfile.email] = { ...users[updatedProfile.email], ...updatedProfile }; localStorage.setItem('docuchat_users', JSON.stringify(users)); }
      }
    }
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  const updateActiveFolder = (updates: Partial<Folder>) => {
    if (!activeFolderId) return;
    setFolders(prev => prev.map(f => f.id === activeFolderId ? { ...f, ...updates, updatedAt: Date.now() } : f));
  };

  const handleUpdateMessage = (folderId: string, messageId: string, updates: Partial<Message>) => {
    setFolders(prevFolders => prevFolders.map(folder => {
      if (folder.id !== folderId) return folder;
      return { ...folder, messages: folder.messages.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg) };
    }));
  };

  const handleSendMessage = async (text: string, replyToMsg?: Message) => {
    if (!activeFolder) return;
    const userMsg: Message = { id: uuidv4(), role: 'user', text: text, timestamp: Date.now(), replyToId: replyToMsg?.id, replyToText: replyToMsg?.text.substring(0, 100) };
    const updatedMessages = [...activeFolder.messages, userMsg];
    updateActiveFolder({ messages: updatedMessages });
    
    setIsLoading(true);
    try {
      const responseText = await sendMessageToGemini(text, updatedMessages, activeFolder.files);
      const botMsg: Message = { id: uuidv4(), role: 'model', text: responseText, timestamp: Date.now() };
      updateActiveFolder({ messages: [...updatedMessages, botMsg] });
    } catch (error: any) {
      const errorMsg: Message = { id: uuidv4(), role: 'model', text: `Ошибка: ${error.message}`, timestamp: Date.now(), isError: true };
      updateActiveFolder({ messages: [...updatedMessages, errorMsg] });
    } finally { setIsLoading(false); }
  };

  const handleAddFiles = async (fileList: FileList) => {
    if (!activeFolder) return;
    const newFiles: UploadedFile[] = [];
    setIsLoading(true);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const text = await parseFileContent(file);
        newFiles.push({ id: uuidv4(), name: file.name, content: text, type: file.type, size: file.size });
      } catch (err) { console.error(err); }
    }
    updateActiveFolder({ files: [...activeFolder.files, ...newFiles] });
    setIsLoading(false);
  };

  // Save quiz result to Supabase or LocalStorage
  const handleSaveQuizResult = async (result: QuizResult) => {
    if (!userProfile) return;
    
    const newResult = { ...result, folderId: activeFolderId || undefined };
    const newHistory = [...(userProfile.quizHistory || []), newResult];
    
    const updatedProfile = { ...userProfile, quizHistory: newHistory };
    setUserProfile(updatedProfile);

    if (supabase) {
      await supabase.from('quiz_history').insert({
         user_id: userProfile.id,
         folder_id: activeFolderId,
         topic: result.topic,
         score: result.score,
         total_questions: result.totalQuestions,
         difficulty: result.difficulty,
         created_at: new Date(result.date).toISOString()
      });
    } else {
       handleUpdateProfile(updatedProfile);
    }
  };

  // New function: Save chat history as a document for Context (Text) but downloads as PDF (in ChatArea)
  const handleSaveChatAsDoc = () => {
    if (!activeFolder || activeFolder.messages.length === 0) return;
    const chatContent = activeFolder.messages.map(m => `[${m.role === 'user' ? 'Пользователь' : 'AI'}] ${new Date(m.timestamp).toLocaleString()}:\n${m.text}\n`).join('\n---\n');
    
    const newFile: UploadedFile = {
      id: uuidv4(),
      name: `История чата ${new Date().toLocaleDateString()}.txt`,
      content: chatContent,
      type: 'text/plain',
      size: new Blob([chatContent]).size
    };
    
    updateActiveFolder({ files: [...activeFolder.files, newFile] });
    alert('Чат сохранен в контекст (текстовый формат). Вы можете скачать его как PDF через меню просмотра.');
  };

  const handleRemoveFile = (fileId: string) => {
    if (!activeFolder) return;
    updateActiveFolder({ files: activeFolder.files.filter(f => f.id !== fileId) });
  };

  const handleOpenFolder = (id: string) => { setActiveFolderId(id); setView('chat'); };
  const handleClearData = () => { setFolders([]); setActiveFolderId(null); setView('dashboard'); if (!supabase) localStorage.removeItem(`docuchat_folders_${userProfile?.id}`); };
  const handleImportData = (data: Folder[]) => { setFolders(data); alert('Импортировано!'); };

  if (!isAuthenticated) return <Auth onLogin={handleLogin} />;

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 ${userProfile?.preferences?.fontSize === 'small' ? 'text-sm' : userProfile?.preferences?.fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
      
      {viewingFile && <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />}
      
      {/* Quiz Modal */}
      {isQuizOpen && activeFolder && (
        <QuizGenerator 
          files={activeFolder.files} 
          onClose={() => setIsQuizOpen(false)} 
          onSaveResult={handleSaveQuizResult}
        />
      )}

      <div className="w-16 md:w-20 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-6 gap-6 z-50 shadow-sm">
         <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30 shrink-0">DC</div>
         <nav className="flex-1 flex flex-col gap-4 w-full px-2">
            <button onClick={() => setView('dashboard')} className={`p-3 rounded-xl flex justify-center transition-all ${view === 'dashboard' ? 'bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><LayoutDashboard size={24} /></button>
            <button onClick={() => setView('profile')} className={`p-3 rounded-xl flex justify-center transition-all ${view === 'profile' ? 'bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><User size={24} /></button>
            <button onClick={() => setView('settings')} className={`p-3 rounded-xl flex justify-center transition-all ${view === 'settings' ? 'bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><SettingsIcon size={24} /></button>
         </nav>
         <div className="flex flex-col items-center gap-2 mb-2">
           <div className="p-2">{supabase ? <Cloud size={20} className="text-green-500" /> : <CloudOff size={20} className="text-slate-400" />}</div>
           <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><LogOut size={24} /></button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {view === 'dashboard' && <Dashboard folders={folders} onCreateFolder={handleCreateFolder} onDeleteFolder={handleDeleteFolder} onOpenFolder={handleOpenFolder} />}
        {view === 'profile' && userProfile && <Profile profile={userProfile} onSave={handleUpdateProfile} folders={folders} />}
        {view === 'settings' && userProfile && <Settings onClearData={handleClearData} theme={theme} onThemeChange={setTheme} exportData={folders} onImportData={handleImportData} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />}
        {view === 'chat' && activeFolder && (
          <>
            <Sidebar 
              folderName={activeFolder.name} 
              files={activeFolder.files} 
              onAddFiles={handleAddFiles} 
              onRemoveFile={handleRemoveFile} 
              onViewFile={setViewingFile} 
              isOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
              onBack={() => setView('dashboard')} 
              user={userProfile}
              onOpenQuiz={() => setIsQuizOpen(true)}
            />
            <ChatArea 
              messages={activeFolder.messages} 
              isLoading={isLoading} 
              onSendMessage={handleSendMessage} 
              onOpenSidebar={() => setIsSidebarOpen(true)}
              folderId={activeFolder.id}
              onUpdateMessage={handleUpdateMessage}
              density={userProfile.preferences?.uiDensity || 'comfortable'}
              onSaveChat={handleSaveChatAsDoc}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;