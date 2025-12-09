import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { Bot, User, AlertCircle, Smile, Reply, Pin, Star, Quote } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onReply: (message: Message) => void;
  onPin: (id: string) => void;
  onFavorite: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  density: 'compact' | 'comfortable';
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, onReply, onPin, onFavorite, onReact, density 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isCompact = density === 'compact';

  const reactionList = ['👍', '👎', '❤️', '🔥', '🤔', '🎉', '👏', '👀'];

  return (
    <div 
      className={`flex w-full ${isCompact ? 'mb-2' : 'mb-6'} ${isUser ? 'justify-end' : 'justify-start'} group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowPicker(false); }}
    >
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 rounded-full flex items-center justify-center mt-1
          ${isCompact ? 'w-6 h-6' : 'w-8 h-8'}
          ${isUser ? 'bg-indigo-600 text-white' : isError ? 'bg-red-100 text-red-600' : 'bg-emerald-600 text-white'}
        `}>
          {isUser ? <User size={isCompact ? 14 : 18} /> : isError ? <AlertCircle size={isCompact ? 14 : 18} /> : <Bot size={isCompact ? 14 : 18} />}
        </div>

        <div className="flex flex-col min-w-0">
           {/* Quote / Reply Context */}
           {message.replyToText && (
             <div className={`
               mb-1 text-xs text-slate-400 flex items-center gap-1 italic border-l-2 border-slate-300 dark:border-slate-600 pl-2
               ${isUser ? 'self-end text-right' : 'self-start'}
             `}>
               <Quote size={10} />
               <span className="truncate max-w-[200px]">{message.replyToText}</span>
             </div>
           )}

           {/* Main Bubble */}
          <div className={`
            flex flex-col rounded-2xl text-sm leading-relaxed shadow-sm relative
            ${isCompact ? 'p-2' : 'p-4'}
            ${isUser 
              ? 'bg-indigo-600 text-white rounded-tr-sm' 
              : isError
                ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-sm'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
            }
          `}>
            {/* Indicators (Pin/Fav) */}
            {(message.isPinned || message.isFavorite) && (
              <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                 {message.isPinned && <div className="bg-amber-100 text-amber-600 p-0.5 rounded-full border border-amber-200"><Pin size={10} className="fill-current"/></div>}
                 {message.isFavorite && <div className="bg-yellow-100 text-yellow-600 p-0.5 rounded-full border border-yellow-200"><Star size={10} className="fill-current"/></div>}
              </div>
            )}

            {isUser ? (
              <div className="whitespace-pre-wrap">{message.text}</div>
            ) : (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node, ...props}) => <p className={`${isCompact ? 'mb-1' : 'mb-2'} last:mb-0`} {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                  a: ({node, ...props}) => <a className="underline hover:text-indigo-400 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                  code: ({node, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match && !String(children).includes('\n');
                    return isInline ? (
                      <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs font-mono text-slate-800 dark:text-slate-200" {...props}>
                        {children}
                      </code>
                    ) : (
                      <div className="relative my-2 rounded-md overflow-hidden bg-slate-900 text-slate-50 p-2 text-xs font-mono overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    )
                  },
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
            
            {/* Timestamp */}
            <div className={`text-[10px] mt-1 opacity-70 ${isUser ? 'text-indigo-100 text-right' : 'text-slate-400'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>

          {/* Reactions Display */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
             <div className={`flex gap-1 mt-1 flex-wrap ${isUser ? 'justify-end' : 'justify-start'}`}>
                {Object.entries(message.reactions).map(([emoji, count]) => {
                   const isReacted = message.userReactions?.includes(emoji);
                   return (
                     <button 
                       key={emoji}
                       onClick={() => onReact(message.id, emoji)}
                       className={`
                         text-xs border rounded-full px-1.5 py-0.5 flex items-center transition-colors
                         ${isReacted 
                           ? 'bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-900/50 dark:border-indigo-700 dark:text-indigo-300' 
                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}
                       `}
                     >
                       <span>{emoji}</span>
                       <span className="ml-1 text-[10px] opacity-80">{count}</span>
                     </button>
                   );
                })}
             </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className={`
          flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200
          ${isUser ? 'flex-row-reverse' : 'flex-row'}
          ${showPicker ? 'opacity-100' : ''} 
        `}>
          <button onClick={() => onReply(message)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500" title="Ответить">
            <Reply size={16} />
          </button>
          
          <div className="relative">
             <button 
                onClick={() => setShowPicker(!showPicker)}
                className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${showPicker ? 'text-amber-500 bg-slate-100 dark:bg-slate-800' : 'text-slate-400 hover:text-amber-500'}`} 
                title="Реакция"
             >
               <Smile size={16} />
             </button>
             {showPicker && (
               <>
                 {/* Invisible backdrop to close on click outside within the component area if needed, though onMouseLeave handles it mostly */}
                 <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowPicker(false)}></div>
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white dark:bg-slate-800 shadow-xl rounded-full px-3 py-2 flex gap-2 border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in zoom-in duration-200">
                    {reactionList.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => {
                          onReact(message.id, emoji);
                          setShowPicker(false);
                        }} 
                        className="hover:scale-125 transition-transform text-lg leading-none p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                 </div>
               </>
             )}
          </div>
          
          <button onClick={() => onPin(message.id)} className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${message.isPinned ? 'text-amber-500' : 'text-slate-400'}`} title="Закрепить">
            <Pin size={16} className={message.isPinned ? "fill-current" : ""} />
          </button>
          
          <button onClick={() => onFavorite(message.id)} className={`p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${message.isFavorite ? 'text-yellow-500' : 'text-slate-400'}`} title="В избранное">
            <Star size={16} className={message.isFavorite ? "fill-current" : ""} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;