import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, LogIn, X, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onSuccess: (user: any) => void;
  onClose: () => void;
}

type AuthMode = 'teacher_login' | 'teacher_register' | 'student_login';

export default function Auth({ onSuccess, onClose }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('teacher_login');
  const [email, setEmail] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let endpoint = '';
    let body = {};

    if (mode === 'teacher_login') {
      endpoint = '/api/auth/login';
      body = { email, password };
    } else if (mode === 'teacher_register') {
      endpoint = '/api/auth/register';
      body = { email, password, name };
    } else {
      endpoint = '/api/auth/student-login';
      body = { student_code: studentCode, password };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      if (mode !== 'teacher_register') {
        onSuccess(data.user);
      } else {
        setMode('teacher_login');
        setError('Đăng ký thành công! Vui lòng đăng nhập.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
              {mode === 'student_login' ? <GraduationCap className="w-8 h-8" /> : 
               mode === 'teacher_register' ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {mode === 'teacher_login' ? 'Đăng Nhập Giáo Viên' : 
               mode === 'teacher_register' ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Học Sinh'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              {mode === 'teacher_login' ? 'Chào mừng thầy/cô quay trở lại!' : 
               mode === 'teacher_register' ? 'Bắt đầu quản lý lớp học thông minh ngay hôm nay.' : 'Nhập mã học sinh và mật khẩu để bắt đầu học.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'teacher_register' && (
              <div>
                <label className="block text-xs font-bold text-black dark:text-slate-300 uppercase mb-1.5">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-black dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>
            )}

            {mode === 'student_login' ? (
              <div>
                <label className="block text-xs font-bold text-black dark:text-slate-300 uppercase mb-1.5">Mã Học Sinh</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-black dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="HS123456"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-black dark:text-slate-300 uppercase mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-black dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="teacher@school.edu"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-black dark:text-slate-300 uppercase mb-1.5">Mật Khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-black dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className={cn(
                "p-3 rounded-lg text-xs font-medium text-center",
                error.includes('thành công') 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              )}>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none"
            >
              {isLoading ? 'ĐANG XỬ LÝ...' : (mode === 'teacher_login' ? 'ĐĂNG NHẬP GIÁO VIÊN' : mode === 'teacher_register' ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP HỌC SINH')}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-center">
            {mode === 'teacher_login' ? (
              <>
                <button onClick={() => setMode('teacher_register')} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Chưa có tài khoản? Đăng ký ngay
                </button>
                <button onClick={() => setMode('student_login')} className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                  Bạn là học sinh? Đăng nhập tại đây
                </button>
              </>
            ) : mode === 'teacher_register' ? (
              <button onClick={() => setMode('teacher_login')} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Đã có tài khoản? Đăng nhập
              </button>
            ) : (
              <button onClick={() => setMode('teacher_login')} className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Bạn là giáo viên? Đăng nhập tại đây
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
