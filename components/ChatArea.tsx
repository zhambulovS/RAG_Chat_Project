import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, Loader2, X, Pin, MessageSquareQuote, Save } from 'lucide-react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, replyToMsg?: Message) => void;
  onOpenSidebar: () => void;
  folderId: string;
  onUpdateMessage: (folderId: string, messageId: string, updates: Partial<Message>) => void;
  density: 'compact' | 'comfortable';
  onSaveChat?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, isLoading, onSendMessage, onOpenSidebar, 
  folderId, onUpdateMessage, density, onSaveChat
}) => {
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pinnedMessages = messages.filter(m => m.isPinned);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim(), replyingTo || undefined);
    setInput('');
    setReplyingTo(null);
    
    // Reset height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
        <div className="flex items-center">
          <button onClick={onOpenSidebar} className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 mr-2">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-slate-800 dark:text-slate-100">Чат</span>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Save Chat Button */}
           {onSaveChat && messages.length > 0 && (
             <button 
               onClick={onSaveChat}
               className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
               title="Сохранить переписку как документ в этой папке"
             >
               <Save size={14} />
               <span className="hidden sm:inline">Сохранить как документ</span>
             </button>
           )}

           {/* Pinned Messages Indicator */}
           {pinnedMessages.length > 0 && (
             <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors" title="Показать закрепленные">
               <Pin size={12} className="fill-amber-600" />
               <span className="font-medium">{pinnedMessages.length}</span>
             </div>
           )}
        </div>
      </div>

      {/* Messages List */}
      <div className={`flex-1 overflow-y-auto ${density === 'compact' ? 'p-2' : 'p-4 md:p-8'} scroll-smooth`}>
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center text-slate-400">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                Добро пожаловать в DocuChat
              </h1>
              <p className="max-w-md mx-auto mb-6">
                Загрузите документы в меню слева и задайте вопрос.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  onReply={(m) => setReplyingTo(m)}
                  onPin={(id) => onUpdateMessage(folderId, id, { isPinned: !msg.isPinned })}
                  onFavorite={(id) => onUpdateMessage(folderId, id, { isFavorite: !msg.isFavorite })}
                  onReact={(id, emoji) => {
                    const hasReacted = msg.userReactions?.includes(emoji);
                    const currentCount = msg.reactions?.[emoji] || 0;
                    
                    let newReactions = { ...msg.reactions };
                    let newUserReactions = [...(msg.userReactions || [])];

                    if (hasReacted) {
                      if (newReactions[emoji] > 1) { newReactions[emoji]--; } else { delete newReactions[emoji]; }
                      newUserReactions = newUserReactions.filter(e => e !== emoji);
                    } else {
                      newReactions[emoji] = currentCount + 1;
                      newUserReactions.push(emoji);
                    }
                    onUpdateMessage(folderId, id, { reactions: newReactions, userReactions: newUserReactions });
                  }}
                  density={density}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="flex items-center gap-2 text-slate-500 bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span className="text-sm">Анализирую документы...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 z-20">
        <div className="max-w-4xl mx-auto relative">
          
          {/* Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 px-3 rounded-t-lg border-b border-slate-200 dark:border-slate-700 text-xs text-slate-500 mb-1">
               <div className="flex items-center gap-2 overflow-hidden">
                 <MessageSquareQuote size={14} className="text-indigo-500" />
                 <span className="font-medium">Ответ на:</span>
                 <span className="truncate max-w-[200px] italic">"{replyingTo.text}"</span>
               </div>
               <button onClick={() => setReplyingTo(null)} className="hover:text-red-500">
                 <X size={14} />
               </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className={`relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-700 transition-colors ${replyingTo ? 'rounded-tl-none rounded-tr-none' : 'p-2'}`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={adjustTextareaHeight}
              onKeyDown={handleKeyDown}
              placeholder="Задайте вопрос..."
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-40 py-3 px-3 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors flex-shrink-0 mb-1 mr-1"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-2">
            Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;