import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { Assignment, Question, Submission } from '../types';

interface AssignmentDoProps {
  assignment: Assignment;
  submission?: Submission; // Optional for review mode
  onClose: () => void;
  showToast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
}

export default function AssignmentDo({ assignment, submission, onClose, showToast }: AssignmentDoProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>(
    submission ? submission.answers.reduce((acc, curr, idx) => ({ ...acc, [idx]: curr }), {}) : {}
  );
  const [isSubmitted, setIsSubmitted] = useState(!!submission);
  const [score, setScore] = useState(submission?.score || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReviewMode = !!submission;

  const questions = assignment.questions || [];
  const currentQ = questions[currentIdx];

  const handleAnswer = (ans: any) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: ans }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (q.qType === 'mcq') {
        if (answers[idx] === q.ans) correct++;
      } else {
        // Simple text matching for essay (if teacher provided correctText)
        if (q.correctText && answers[idx]?.toLowerCase().trim() === q.correctText.toLowerCase().trim()) {
          correct++;
        }
      }
    });
    return Math.round((correct / questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm("Em chưa làm hết các câu hỏi. Em vẫn muốn nộp bài chứ?")) return;
    }

    setIsSubmitting(true);
    const finalScore = calculateScore();
    setScore(finalScore);

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignment.id,
          answers: Object.values(answers),
          score: finalScore
        })
      });

      if (!res.ok) throw new Error("Lỗi khi nộp bài");
      setIsSubmitted(true);
      showToast("Nộp bài thành công!", "ok");
    } catch (err) {
      showToast("Lỗi khi nộp bài", "err");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {isReviewMode ? 'Xem lại bài làm' : 'Hoàn thành bài tập!'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {isReviewMode ? 'Dưới đây là kết quả bài làm của em.' : 'Em đã nộp bài thành công. Dưới đây là kết quả của em:'}
            </p>
            
            <div className="mt-8 inline-block bg-slate-50 dark:bg-slate-900 px-12 py-6 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Điểm số</div>
              <div className="text-6xl font-black text-blue-600">{score}</div>
              <div className="text-slate-400 text-[10px] mt-2 uppercase font-bold">Thang điểm 100</div>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-4">Chi tiết từng câu</h3>
            {questions.map((q, idx) => {
              const isCorrect = q.qType === 'mcq' 
                ? answers[idx] === q.ans 
                : (q.correctText && answers[idx]?.toLowerCase().trim() === q.correctText.toLowerCase().trim());
              
              return (
                <div key={idx} className={cn(
                  "p-6 rounded-2xl border-2 transition-all",
                  isCorrect ? "border-emerald-100 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-red-100 bg-red-50/30 dark:bg-red-900/10"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm",
                      isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-grow">
                      <div className="font-bold text-slate-800 dark:text-slate-100 mb-3">{q.q}</div>
                      
                      {q.qType === 'mcq' ? (
                        <div className="space-y-2">
                          {q.opts?.map((opt, oIdx) => (
                            <div key={oIdx} className={cn(
                              "text-sm p-2 rounded-lg flex items-center gap-2",
                              oIdx === q.ans ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold" : 
                              (oIdx === answers[idx] && !isCorrect ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : "text-slate-500")
                            )}>
                              <span className="w-5 h-5 flex items-center justify-center rounded bg-white/50 text-[10px] font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              {opt}
                              {oIdx === q.ans && <CheckCircle className="w-3 h-3 ml-auto" />}
                              {oIdx === answers[idx] && !isCorrect && <AlertCircle className="w-3 h-3 ml-auto" />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs">
                            <span className="text-slate-400 font-bold uppercase mr-2">Bài làm:</span>
                            <span className={isCorrect ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                              {answers[idx] || '(Trống)'}
                            </span>
                          </div>
                          {!isCorrect && q.correctText && (
                            <div className="text-xs">
                              <span className="text-slate-400 font-bold uppercase mr-2">Đáp án đúng:</span>
                              <span className="text-emerald-600 font-bold">{q.correctText}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-xl"
          >
            QUAY LẠI DANH SÁCH
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{assignment.title}</h2>
          <div className="flex items-center gap-2 justify-center mt-1">
            <div className="h-1.5 w-32 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300" 
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Câu {currentIdx + 1} / {questions.length}
            </span>
          </div>
        </div>
        <div className="w-10" />
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col">
        <div className="flex-grow">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-3">
              {currentQ.qType === 'mcq' ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentQ.q}
            </h3>
          </div>

          {currentQ.qType === 'mcq' ? (
            <div className="grid grid-cols-1 gap-3">
              {currentQ.opts?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !isReviewMode && handleAnswer(idx)}
                  disabled={isReviewMode}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 group",
                    answers[currentIdx] === idx 
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                      : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400",
                    isReviewMode && "cursor-default"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors",
                    answers[currentIdx] === idx 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-slate-200"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-medium">{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[currentIdx] || ''}
              onChange={(e) => !isReviewMode && handleAnswer(e.target.value)}
              readOnly={isReviewMode}
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-600 transition-all text-black dark:text-slate-200 resize-none font-medium"
              placeholder={isReviewMode ? "" : "Nhập câu trả lời của em tại đây..."}
            />
          )}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-0 transition-all font-bold text-sm"
          >
            <ChevronLeft className="w-5 h-5" /> QUAY LẠI
          </button>

          {currentIdx === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> {isSubmitting ? 'ĐANG NỘP...' : 'NỘP BÀI'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx(prev => prev + 1)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-all font-bold text-sm"
            >
              TIẾP THEO <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
