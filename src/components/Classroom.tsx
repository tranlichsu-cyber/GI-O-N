import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  ChevronRight, 
  UserPlus, 
  FilePlus, 
  Calendar, 
  Trash2, 
  BookOpen, 
  GraduationCap, 
  ClipboardList,
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Class, Student, Assignment, User } from '../types';

interface ClassroomProps {
  user: User;
  showToast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
}

export default function Classroom({ user, showToast }: ClassroomProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignContent, setNewAssignContent] = useState('');
  const [newAssignDate, setNewAssignDate] = useState('');
  const [newAssignQuestions, setNewAssignQuestions] = useState<any[]>([]);
  
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'assignments'>('students');
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
      fetchAssignments(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data);
    } catch (err) {
      showToast('Lỗi khi tải danh sách lớp học', 'err');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    try {
      const res = await fetch(`/api/classes/${classId}/students`);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      showToast('Lỗi khi tải danh sách học sinh', 'err');
    }
  };

  const fetchAssignments = async (classId: number) => {
    try {
      const res = await fetch(`/api/classes/${classId}/assignments`);
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      showToast('Lỗi khi tải danh sách bài tập', 'err');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, description: newClassDesc }),
      });
      if (res.ok) {
        showToast('Đã tạo lớp học mới!', 'ok');
        setNewClassName('');
        setNewClassDesc('');
        fetchClasses();
      }
    } catch (err) {
      showToast('Lỗi khi tạo lớp học', 'err');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newStudentName.trim() || !newStudentPassword.trim()) return;
    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newStudentName, 
          student_code: newStudentCode,
          password: newStudentPassword 
        }),
      });
      if (res.ok) {
        showToast('Đã thêm học sinh!', 'ok');
        setNewStudentName('');
        setNewStudentCode('');
        setNewStudentPassword('');
        fetchStudents(selectedClass.id);
      }
    } catch (err) {
      showToast('Lỗi khi thêm học sinh', 'err');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newAssignTitle.trim()) return;
    try {
      const res = await fetch(`/api/classes/${selectedClass.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newAssignTitle, 
          content: newAssignContent, 
          questions: newAssignQuestions,
          due_date: newAssignDate 
        }),
      });
      if (res.ok) {
        showToast('Đã giao bài tập!', 'ok');
        setNewAssignTitle('');
        setNewAssignContent('');
        setNewAssignDate('');
        setNewAssignQuestions([]);
        fetchAssignments(selectedClass.id);
      }
    } catch (err) {
      showToast('Lỗi khi giao bài tập', 'err');
    }
  };

  const fetchSubmissions = async (assignmentId: number) => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`);
      const data = await res.json();
      setSubmissions(data);
      setViewingSubmissionsId(assignmentId);
    } catch (err) {
      showToast('Lỗi khi tải kết quả', 'err');
    }
  };

  const addQuestion = (type: 'mcq' | 'text') => {
    const newQ = type === 'mcq' 
      ? { qType: 'mcq', q: '', opts: ['', '', '', ''], ans: 0 }
      : { qType: 'text', q: '', correctText: '' };
    setNewAssignQuestions([...newAssignQuestions, newQ]);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...newAssignQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setNewAssignQuestions(updated);
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...newAssignQuestions];
    const opts = [...updated[qIdx].opts];
    opts[optIdx] = value;
    updated[qIdx] = { ...updated[qIdx], opts };
    setNewAssignQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    setNewAssignQuestions(newAssignQuestions.filter((_, i) => i !== idx));
  };

  if (selectedClass) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => setSelectedClass(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-6 font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách lớp
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{selectedClass.name}</h1>
                <p className="text-blue-100 text-sm">{selectedClass.description || 'Không có mô tả'}</p>
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-100 dark:border-slate-700">
            <button 
              onClick={() => setActiveSubTab('students')}
              className={cn(
                "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all",
                activeSubTab === 'students' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30 dark:bg-blue-900/10" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Users className="w-4 h-4" /> Danh sách học sinh ({students.length})
            </button>
            <button 
              onClick={() => setActiveSubTab('assignments')}
              className={cn(
                "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all",
                activeSubTab === 'assignments' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30 dark:bg-blue-900/10" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <ClipboardList className="w-4 h-4" /> Bài tập đã giao ({assignments.length})
            </button>
          </div>

          <div className="p-8">
            {activeSubTab === 'students' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Học sinh trong lớp</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm học sinh..."
                        className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-black dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {students.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Chưa có học sinh nào trong lớp này.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {students.map(student => (
                        <div key={student.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all group">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{student.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Mã HS: {student.student_code || 'N/A'}</p>
                          </div>
                          <button className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 h-fit">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-500" /> Thêm học sinh mới
                  </h3>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Họ và tên học sinh</label>
                      <input 
                        type="text" 
                        required
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-black dark:text-slate-200"
                        placeholder="VD: Trần Văn Bình"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mã học sinh</label>
                      <input 
                        type="text" 
                        required
                        value={newStudentCode}
                        onChange={(e) => setNewStudentCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-black dark:text-slate-200"
                        placeholder="VD: HS001"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Mật khẩu học sinh</label>
                      <input 
                        type="password" 
                        required
                        value={newStudentPassword}
                        onChange={(e) => setNewStudentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-black dark:text-slate-200"
                        placeholder="Mật khẩu đăng nhập"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 text-sm"
                    >
                      THÊM VÀO LỚP
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4">Lịch sử giao bài</h3>
                  
                  {assignments.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Chưa có bài tập nào được giao.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map(assign => (
                        <div key={assign.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1">{assign.title}</h4>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ngày giao: {new Date(assign.created_at).toLocaleDateString('vi-VN')}</span>
                                <span className="flex items-center gap-1 text-amber-500"><Calendar className="w-3 h-3" /> Hạn nộp: {assign.due_date || 'Không có'}</span>
                              </div>
                            </div>
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                            {assign.content}
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Câu hỏi: {assign.questions?.length || 0}</span>
                            <button 
                              onClick={() => fetchSubmissions(assign.id)}
                              className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              Xem kết quả học sinh
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 h-fit">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <FilePlus className="w-5 h-5 text-indigo-500" /> Giao bài tập mới
                  </h3>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Tiêu đề bài tập</label>
                      <input 
                        type="text" 
                        required
                        value={newAssignTitle}
                        onChange={(e) => setNewAssignTitle(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-black dark:text-slate-200"
                        placeholder="VD: Bài tập Toán tuần 5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nội dung / Yêu cầu</label>
                      <textarea 
                        rows={4}
                        value={newAssignContent}
                        onChange={(e) => setNewAssignContent(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-black dark:text-slate-200 resize-none"
                        placeholder="Nhập yêu cầu bài tập cho học sinh..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Hạn nộp bài</label>
                      <input 
                        type="date" 
                        value={newAssignDate}
                        onChange={(e) => setNewAssignDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-black dark:text-slate-200"
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Câu hỏi ({newAssignQuestions.length})</label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => addQuestion('mcq')}
                            className="text-[10px] font-bold text-blue-600 hover:underline"
                          >
                            + Trắc nghiệm
                          </button>
                          <button 
                            type="button"
                            onClick={() => addQuestion('text')}
                            className="text-[10px] font-bold text-indigo-600 hover:underline"
                          >
                            + Tự luận
                          </button>
                        </div>
                      </div>

                      {newAssignQuestions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 relative">
                          <button 
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <input 
                            type="text"
                            placeholder={`Câu hỏi ${idx + 1}`}
                            value={q.q}
                            onChange={(e) => updateQuestion(idx, 'q', e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none text-black dark:text-slate-200"
                          />
                          {q.qType === 'mcq' ? (
                            <div className="grid grid-cols-2 gap-2">
                              {q.opts.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input 
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={q.ans === oIdx}
                                    onChange={() => updateQuestion(idx, 'ans', oIdx)}
                                  />
                                  <input 
                                    type="text"
                                    placeholder={`Đáp án ${oIdx + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                                    className="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[10px] outline-none text-black dark:text-slate-200"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <input 
                              type="text"
                              placeholder="Đáp án đúng (để máy tự chấm)"
                              value={q.correctText}
                              onChange={(e) => updateQuestion(idx, 'correctText', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] outline-none text-black dark:text-slate-200"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 text-sm"
                    >
                      GIAO BÀI NGAY
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-2xl text-white">
              <GraduationCap className="w-8 h-8" />
            </div>
            Quản Lý Lớp Học
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Chào thầy/cô {user.name}, hãy bắt đầu quản lý các lớp học của mình.</p>
        </div>
        <button 
          onClick={() => {
            const modal = document.getElementById('create-class-modal');
            if (modal) modal.classList.remove('hidden');
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none"
        >
          <Plus className="w-5 h-5" /> TẠO LỚP HỌC MỚI
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold">Đang tải danh sách lớp...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Chưa có lớp học nào</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">Thầy/cô hãy tạo lớp học đầu tiên để bắt đầu quản lý học sinh và giao bài tập về nhà.</p>
          <button 
            onClick={() => document.getElementById('create-class-modal')?.classList.remove('hidden')}
            className="text-blue-600 font-bold hover:underline"
          >
            Nhấn vào đây để tạo lớp mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(cls => (
            <div 
              key={cls.id} 
              onClick={() => setSelectedClass(cls)}
              className="group bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-8 -mt-8 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{cls.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6">{cls.description || 'Không có mô tả cho lớp học này.'}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học sinh</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">--</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bài tập</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">--</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Xem Kết Quả */}
      {viewingSubmissionsId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative max-h-[80vh] flex flex-col">
            <button 
              onClick={() => setViewingSubmissionsId(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 flex-grow overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Kết Quả Học Sinh</h2>
              
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">Chưa có học sinh nào nộp bài.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map(sub => (
                    <div key={sub.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{sub.student_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                          Nộp lúc: {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-2xl font-black text-blue-600">
                        {sub.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Lớp */}
      <div id="create-class-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm hidden">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
          <button 
            onClick={() => document.getElementById('create-class-modal')?.classList.add('hidden')}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Tạo Lớp Học Mới</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Tên lớp học</label>
                <input 
                  type="text" 
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-black dark:text-slate-200"
                  placeholder="VD: Lớp 4A - Toán"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Mô tả lớp học</label>
                <textarea 
                  rows={3}
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-black dark:text-slate-200 resize-none"
                  placeholder="Nhập mô tả ngắn về lớp học..."
                />
              </div>
              <button 
                type="submit"
                onClick={() => setTimeout(() => document.getElementById('create-class-modal')?.classList.add('hidden'), 100)}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none mt-4"
              >
                TẠO LỚP NGAY
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
