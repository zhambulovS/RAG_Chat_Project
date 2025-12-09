import React, { useState } from 'react';
import { UploadedFile, QuizResult } from '../types';
import { generateQuiz } from '../services/geminiService';
import { X, Check, Loader2, Download, Play, GraduationCap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { v4 as uuidv4 } from 'uuid';

interface QuizGeneratorProps {
  files: UploadedFile[];
  onClose: () => void;
  onSaveResult?: (result: QuizResult) => void;
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ files, onClose, onSaveResult }) => {
  // Config State
  const [step, setStep] = useState<'config' | 'loading' | 'taking' | 'result'>('config');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(5);
  const [error, setError] = useState('');

  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const handleStart = async () => {
    if (files.length === 0) {
      setError('Нет файлов для генерации теста.');
      return;
    }
    setStep('loading');
    setError('');
    try {
      const quizData = await generateQuiz(files, topic, difficulty, count);
      setQuestions(quizData);
      setUserAnswers(new Array(quizData.length).fill(-1));
      setStep('taking');
    } catch (err: any) {
      setError(err.message);
      setStep('config');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const calculateScore = () => {
    return userAnswers.reduce((acc, ans, idx) => {
      return acc + (ans === questions[idx].correctIndex ? 1 : 0);
    }, 0);
  };

  const handleFinish = () => {
    setStep('result');
    if (onSaveResult) {
      onSaveResult({
        id: uuidv4(),
        topic: topic || 'Общий тест',
        difficulty,
        totalQuestions: questions.length,
        score: calculateScore(),
        date: Date.now()
      });
    }
  };

  const downloadQuizPDF = (withAnswers: boolean) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const maxLineWidth = pageWidth - margin * 2;

    // Title
    doc.setFontSize(18);
    doc.text(`ТЕСТ: ${topic || 'По документам'}`, margin, 20);
    doc.setFontSize(12);
    doc.text(`Сложность: ${difficulty} | Дата: ${new Date().toLocaleDateString()}`, margin, 30);
    
    let y = 40;

    questions.forEach((q, idx) => {
      // Check page break
      if (y > 270) { doc.addPage(); y = 20; }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      
      const questionTitle = `${idx + 1}. ${q.question}`;
      const splitTitle = doc.splitTextToSize(questionTitle, maxLineWidth);
      doc.text(splitTitle, margin, y);
      y += splitTitle.length * 5 + 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      q.options.forEach((opt, optIdx) => {
        if (y > 280) { doc.addPage(); y = 20; }
        const optionText = `${String.fromCharCode(65 + optIdx)}) ${opt}`;
        const splitOption = doc.splitTextToSize(optionText, maxLineWidth - 5);
        doc.text(splitOption, margin + 5, y);
        y += splitOption.length * 4 + 1;
      });
      y += 5;
    });

    if (withAnswers) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text("КЛЮЧИ К ТЕСТУ", margin, 20);
      let ay = 30;
      questions.forEach((q, idx) => {
        const answerText = `${idx + 1}: ${String.fromCharCode(65 + q.correctIndex)}`;
        doc.text(answerText, margin, ay);
        ay += 7;
      });
    }

    doc.save(`quiz_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Генератор тестов</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-red-500 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {step === 'config' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Тема теста (опционально)</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: Глава 1, Основные понятия..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Сложность</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Easy">Легко</option>
                    <option value="Medium">Средне</option>
                    <option value="Hard">Сложно</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Количество вопросов</label>
                  <select 
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                  </select>
                </div>
              </div>

              {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

              <div className="pt-4">
                <button 
                  onClick={handleStart}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Play size={20} /> Создать тест
                </button>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">Анализирую документы и составляю вопросы...</p>
            </div>
          )}

          {step === 'taking' && (
            <div>
              <div className="flex justify-between items-center mb-6 text-sm text-slate-500">
                <span>Вопрос {currentQIndex + 1} из {questions.length}</span>
                <span>Прогресс: {Math.round(((currentQIndex + 1) / questions.length) * 100)}%</span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">
                  {questions[currentQIndex].question}
                </h3>
                <div className="space-y-3">
                  {questions[currentQIndex].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        userAnswers[currentQIndex] === idx 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button 
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className="px-4 py-2 text-slate-500 disabled:opacity-50"
                >
                  Назад
                </button>
                {currentQIndex < questions.length - 1 ? (
                   <button 
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Далее
                  </button>
                ) : (
                  <button 
                    onClick={handleFinish}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                  >
                    Завершить
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
                <Check size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Тест завершен!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Ваш результат: <span className="font-bold text-indigo-600 text-xl">{calculateScore()} / {questions.length}</span>
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => downloadQuizPDF(false)}
                  className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Скачать PDF без ответов
                </button>
                 <button 
                  onClick={() => downloadQuizPDF(true)}
                  className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Скачать PDF с ответами
                </button>
                <button 
                  onClick={() => { setStep('config'); setQuestions([]); }}
                  className="w-full py-3 mt-4 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                >
                  Создать новый тест
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;