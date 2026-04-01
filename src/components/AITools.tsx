import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, 
  ExternalLink, 
  Trash2, 
  Mic, 
  Send, 
  Volume2,
  FileQuestion,
  Users,
  Lightbulb,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { callGeminiAPI } from '../services/gemini';
import { FLUENT_3D, render3DIcon } from '../lib/icons';

interface AIToolsProps {
  showToast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
  hasApiKey: boolean;
  openKeySelector: () => void;
}

const aiDirectoryData = [
  { category: "Trợ Lý Ảo & Văn Bản", icon: "message-square-text", color: "text-indigo-600", bg: "bg-indigo-100", tools: [
    { name: "ChatGPT", url: "https://chat.openai.com", desc: "Hỗ trợ soạn bài, giải đáp chuyên môn." },
    { name: "Google Gemini", url: "https://gemini.google.com", desc: "Trợ lý AI đa năng từ Google." }
  ]},
  { category: "Thiết Kế & Trình Chiếu", icon: "monitor-play", color: "text-blue-600", bg: "bg-blue-100", tools: [
    { name: "Canva Giáo dục", url: "https://www.canva.com/education/", desc: "Thiết kế bài giảng, phiếu bài tập miễn phí." },
    { name: "Gamma App", url: "https://gamma.app", desc: "Tạo slide tự động từ văn bản siêu nhanh." }
  ]},
  { category: "Hình Ảnh & Video", icon: "image", color: "text-emerald-600", bg: "bg-emerald-100", tools: [
    { name: "Leonardo AI", url: "https://leonardo.ai", desc: "Tạo ảnh minh họa nhân vật, truyện tranh." },
    { name: "RunwayML", url: "https://runwayml.com", desc: "Biến ảnh tĩnh thành video sinh động." }
  ]},
  { category: "Âm Thanh & Phân Tích", icon: "mic", color: "text-rose-600", bg: "bg-rose-100", tools: [
    { name: "Otter.ai", url: "https://otter.ai", desc: "Ghi âm và chuyển giọng nói thành văn bản." },
    { name: "Scholarcy", url: "https://www.scholarcy.com", desc: "Tóm tắt tài liệu, bài giảng." }
  ]}
];

const quickPrompts = [
  { icon: FileQuestion, title: "Tạo Đề Thi", desc: "Trắc nghiệm & Tự luận", prompt: "Đóng vai chuyên gia ra đề thi. Hãy tạo 5 câu hỏi trắc nghiệm (4 đáp án, có 1 đáp án đúng) và 2 câu hỏi tự luận để kiểm tra học sinh Tiểu học về chủ đề: [Nhập tên bài học/chủ đề]. Yêu cầu cung cấp đáp án chi tiết." },
  { icon: Users, title: "Thư Gửi Phụ Huynh", desc: "Viết thông báo", prompt: "Đóng vai giáo viên chủ nhiệm thân thiện và tinh tế. Viết một thông báo gửi vào nhóm Zalo phụ huynh lớp [Nhập tên lớp] về việc: [Nhập nội dung cần thông báo]. Giọng văn ấm áp, rõ ràng và lịch sự." }
];

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  id?: string;
}

export default function AITools({ showToast, hasApiKey, openKeySelector }: AIToolsProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'ai', content: 'Chào thầy/cô! Em là Trợ lý AI Giáo dục. Thầy/cô cần em hỗ trợ gì ạ?' }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!inputMsg.trim() || isLoading) return;
    
    const userMsg = inputMsg.trim();
    setInputMsg('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const fullHistory = [
      { role: "user", parts: [{ text: "Hãy đóng vai là Trợ lý AI Giáo dục Tiểu học theo CTr GDPT 2018. Bạn thân thiện, chuyên môn cao. Luôn dùng tiếng Việt chuẩn mực. Các định dạng danh sách nên dùng dấu *." }]},
      { role: "model", parts: [{ text: "Vâng, em đã sẵn sàng hỗ trợ thầy/cô ạ!" }]},
      ...chatHistory.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: userMsg }] }
    ];

    try {
      const reply = await callGeminiAPI(fullHistory);
      setChatHistory(prev => [...prev, { role: 'ai', content: reply }]);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        showToast("Vui lòng kích hoạt AI để sử dụng tính năng này!", "info");
        openKeySelector();
      } else {
        showToast(err.message, "err");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window)) {
      return showToast('Trình duyệt của bạn không hỗ trợ Nhập giọng nói!', 'err');
    }
    
    // @ts-ignore
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      showToast('Đang nghe... Bạn hãy nói nhé!', 'info');
    };

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInputMsg(prev => (prev + " " + text).trim());
    };

    recognition.onerror = (e: any) => {
      showToast('Lỗi thu âm: ' + e.error, 'err');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const usePrompt = (text: string) => {
    setInputMsg(text);
    showToast("Đã chèn mẫu lệnh, hãy điền thông tin vào ngoặc vuông [...]", "info");
  };

  const clearChat = () => {
    if (!confirm("Bạn muốn xóa lịch sử trò chuyện AI?")) return;
    setChatHistory([{ role: 'ai', content: 'Đã làm mới bộ nhớ. Thầy/cô cần em hỗ trợ gì thêm không ạ?' }]);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'vi-VN';
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
      showToast("Đang đọc văn bản...", "info");
    } else {
      showToast("Trình duyệt của bạn không hỗ trợ đọc văn bản.", "err");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cột Danh bạ & Mẫu lệnh */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="bg-violet-100 dark:bg-violet-900/30 p-2.5 rounded-xl text-violet-600 dark:text-violet-400">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-800 dark:text-slate-100">Danh Bạ Công Cụ AI Giáo Dục</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Khuyến nghị theo CT Tập huấn Bộ GDĐT</p>
              </div>
            </div>
            <div className="space-y-6">
              {aiDirectoryData.map((cat, i) => (
                <div key={i}>
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <span className={cn(cat.bg, cat.color, "p-1.5 rounded-lg dark:bg-opacity-20")}>
                      {/* Using a generic icon for simplicity */}
                      <LayoutGrid className="w-4 h-4" />
                    </span>
                    {cat.category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.tools.map((t, j) => (
                      <a 
                        key={j} 
                        href={t.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-all group"
                      >
                        <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between mb-1 text-sm">
                          {t.name}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.desc}</div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mẫu lệnh nhanh */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Mẫu lệnh (Prompt) gợi ý
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickPrompts.map((p, i) => (
                <div 
                  key={i} 
                  onClick={() => usePrompt(p.prompt)} 
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg mt-0.5">
                      <p.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">{p.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột Trợ lý AI Chatbot */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[750px] sticky top-20 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {render3DIcon(FLUENT_3D.robot, "w-12 h-12 drop-shadow-sm animate-float-slow")}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">Trợ Lý AI Sư Phạm</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Sẵn sàng hỗ trợ chuyên môn</p>
                </div>
              </div>
              <button 
                onClick={clearChat} 
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" 
                title="Xóa lịch sử chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div 
              ref={chatWindowRef}
              className="flex-1 overflow-y-auto p-4 flex flex-col bg-slate-50/30 dark:bg-slate-900/30"
            >
              {chatHistory.map((msg, i) => (
                <div key={i} className={cn("chat-msg", msg.role === 'user' ? "user" : "ai")}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  {msg.role === 'ai' && (
                    <button 
                      onClick={() => speakText(msg.content.replace(/<[^>]*>/g, ''))} 
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors" 
                      title="Đọc văn bản"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="chat-msg ai">
                  <div className="flex gap-1 items-center h-5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
              <div className="flex gap-2 items-end">
                <button 
                  onClick={toggleMic} 
                  className={cn(
                    "p-3 rounded-xl transition-colors shadow-sm h-14 w-14 flex items-center justify-center",
                    isListening ? "bg-red-100 text-red-500 animate-pulse" : "bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                <textarea 
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-medium focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none h-14 text-black dark:text-slate-200" 
                  placeholder="Nhập câu hỏi..." 
                />
                
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || !inputMsg.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm h-14 w-14 flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
