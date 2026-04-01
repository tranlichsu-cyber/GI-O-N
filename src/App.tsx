import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  BookOpenCheck, 
  FileText, 
  Gamepad2, 
  BotMessageSquare, 
  Moon, 
  Sun,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Share2,
  Heart,
  Key,
  Home as HomeIcon
} from 'lucide-react';
import { cn } from './lib/utils';
import Home from './components/Home';
import Planner from './components/Planner';
import Worksheet from './components/Worksheet';
import Game from './components/Game';
import AITools from './components/AITools';

export type AppTab = 'home' | 'planner' | 'worksheet' | 'game' | 'aitools';

interface Toast {
  id: string;
  msg: string;
  type: 'ok' | 'err' | 'info';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for local dev or if aistudio is not available
        setHasApiKey(!!process.env.GEMINI_API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const openKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      showToast("Đã kích hoạt AI thành công!", "ok");
    } else {
      showToast("Không thể mở trình chọn API Key. Vui lòng kiểm tra cài đặt trình duyệt.", "err");
    }
  };

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dark_mode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('dark_mode', String(newMode));
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const showToast = (msg: string, type: 'ok' | 'err' | 'info' = 'ok') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm no-print">
        {!hasApiKey && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 p-2 text-center">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2">
              <AlertCircle className="w-3 h-3" />
              AI chưa được kích hoạt cho phiên bản chia sẻ. 
              <button onClick={openKeySelector} className="underline hover:text-amber-800 ml-1">Nhấn vào đây để kích hoạt miễn phí</button>
            </p>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-200/50">
              <Layers className="text-white w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-slate-800 dark:text-slate-100 leading-tight">
                  Giáo Viên <span className="text-blue-600">4.0</span>
                </h1>
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter border border-emerald-200 dark:border-emerald-800">Miễn Phí</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hệ Sinh Thái Thông Minh</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl font-medium text-xs overflow-x-auto">
            <button 
              onClick={() => setActiveTab('home')} 
              className={cn(
                "nav-tab px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'home' ? "active" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <HomeIcon className="w-4 h-4" /> Trang Chủ
            </button>
            <button 
              onClick={() => setActiveTab('planner')} 
              className={cn(
                "nav-tab px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'planner' ? "active" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <BookOpenCheck className="w-4 h-4" /> Soạn Giáo Án
            </button>
            <button 
              onClick={() => setActiveTab('worksheet')} 
              className={cn(
                "nav-tab px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'worksheet' ? "active" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <FileText className="w-4 h-4" /> Tạo Phiếu
            </button>
            <button 
              onClick={() => setActiveTab('game')} 
              className={cn(
                "nav-tab px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'game' ? "active" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <Gamepad2 className="w-4 h-4" /> Trò Chơi
            </button>
            <button 
              onClick={() => setActiveTab('aitools')} 
              className={cn(
                "nav-tab px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap",
                activeTab === 'aitools' ? "active" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <BotMessageSquare className="w-4 h-4" /> Trợ lý AI
            </button>
            <button 
              onClick={toggleDarkMode} 
              className="ml-2 px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" 
              title="Chế độ Tối/Sáng"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast("Đã sao chép liên kết web miễn phí!", "ok");
              }}
              className="ml-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Chia sẻ web"
            >
              <Share2 className="w-3.5 h-3.5" /> <span className="hidden md:inline">Chia sẻ</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-grow">
        {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
        {activeTab === 'planner' && <Planner showToast={showToast} hasApiKey={hasApiKey} openKeySelector={openKeySelector} />}
        {activeTab === 'worksheet' && <Worksheet showToast={showToast} hasApiKey={hasApiKey} openKeySelector={openKeySelector} />}
        {activeTab === 'game' && <Game showToast={showToast} />}
        {activeTab === 'aitools' && <AITools showToast={showToast} hasApiKey={hasApiKey} openKeySelector={openKeySelector} />}
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-6 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>Dự án phi lợi nhuận hỗ trợ giáo dục Việt Nam</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Phiên bản 4.0.0</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Hoàn toàn miễn phí</span>
          </div>
        </div>
      </footer>
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={cn(
              "toast p-3 rounded-xl font-bold text-xs pointer-events-auto shadow-lg text-white flex items-center gap-2 animate-in slide-in-from-right duration-300",
              t.type === 'ok' ? "bg-emerald-500 border-2 border-emerald-600" : 
              t.type === 'err' ? "bg-red-500 border-2 border-red-600" : 
              "bg-blue-500 border-2 border-blue-600"
            )}
          >
            {t.type === 'ok' ? <CheckCircle className="w-4 h-4" /> : 
             t.type === 'err' ? <AlertCircle className="w-4 h-4" /> : 
             <Info className="w-4 h-4" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
