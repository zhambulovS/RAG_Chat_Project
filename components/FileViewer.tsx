import React from 'react';
import { X, FileText, Download, Copy } from 'lucide-react';
import { UploadedFile } from '../types';
import { jsPDF } from 'jspdf';

interface FileViewerProps {
  file: UploadedFile;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxLineWidth = pageWidth - margin * 2;

    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(file.content, maxLineWidth);
    
    // Simple pagination logic
    let y = 10;
    for (let i = 0; i < splitText.length; i++) {
        if (y > 280) {
            doc.addPage();
            y = 10;
        }
        doc.text(splitText[i], margin, y);
        y += 5;
    }
    
    doc.save(`${file.name.replace(/\.[^/.]+$/, "")}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate max-w-xs md:max-w-md">
                {file.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Копировать текст"
            >
              <Copy size={20} />
            </button>
            <button 
              onClick={handleDownloadPdf}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex gap-1 items-center"
              title="Скачать как PDF"
            >
              <Download size={20} /> <span className="text-xs font-bold">PDF</span>
            </button>
            <button 
              onClick={handleDownloadTxt}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex gap-1 items-center"
              title="Скачать как TXT"
            >
              <Download size={20} /> <span className="text-xs font-bold">TXT</span>
            </button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-white dark:bg-slate-900 custom-scrollbar">
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              {file.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;