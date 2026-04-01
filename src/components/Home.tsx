import React from 'react';
import { 
  Sparkles, 
  Zap, 
  Shield, 
  Users, 
  ArrowRight, 
  BookOpen, 
  FileText, 
  Gamepad2, 
  Bot 
} from 'lucide-react';
import { AppTab } from '../types';

interface HomeProps {
  onNavigate: (tab: AppTab) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="animate-in fade-in duration-700">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 py-16 md:py-24 border-b border-slate-100 dark:border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 dark:border-blue-800">
              <Sparkles className="w-3 h-3" />
              Công nghệ AI hàng đầu cho giáo dục
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
              Hệ Sinh Thái <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Giáo Viên 4.0</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium">
              Giải pháp thông minh giúp giáo viên tiết kiệm 80% thời gian soạn bài, 
              tạo phiếu bài tập và tổ chức trò chơi lớp học chỉ với vài cú nhấp chuột.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => onNavigate('planner')}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 dark:shadow-none transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                Bắt đầu ngay miễn phí <ArrowRight className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                <Shield className="w-4 h-4 text-emerald-500" />
                Không cần đăng ký tài khoản
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Công cụ mạnh mẽ cho lớp học hiện đại</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Mọi thứ bạn cần để nâng cao chất lượng giảng dạy</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={<BookOpen className="w-6 h-6 text-blue-600" />}
              title="Soạn Giáo Án AI"
              desc="Tạo kế hoạch bài dạy chi tiết theo chuẩn 5512 chỉ trong 30 giây."
              onClick={() => onNavigate('planner')}
              color="blue"
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6 text-indigo-600" />}
              title="Tạo Phiếu Bài Tập"
              desc="Tự động tạo câu hỏi trắc nghiệm và tự luận từ nội dung bài học."
              onClick={() => onNavigate('worksheet')}
              color="indigo"
            />
            <FeatureCard 
              icon={<Gamepad2 className="w-6 h-6 text-purple-600" />}
              title="Trò Chơi Lớp Học"
              desc="Kho trò chơi tương tác giúp học sinh hào hứng và tiếp thu bài tốt hơn."
              onClick={() => onNavigate('game')}
              color="purple"
            />
            <FeatureCard 
              icon={<Bot className="w-6 h-6 text-emerald-600" />}
              title="Trợ Lý AI 24/7"
              desc="Giải đáp mọi thắc mắc chuyên môn và hỗ trợ xử lý tình huống sư phạm."
              onClick={() => onNavigate('aitools')}
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[32px] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="text-5xl font-black mb-2">100%</div>
                <div className="text-blue-100 font-bold uppercase tracking-widest text-xs">Miễn phí vĩnh viễn</div>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">30s</div>
                <div className="text-blue-100 font-bold uppercase tracking-widest text-xs">Thời gian tạo nội dung</div>
              </div>
              <div>
                <div className="text-5xl font-black mb-2">5000+</div>
                <div className="text-blue-100 font-bold uppercase tracking-widest text-xs">Giáo viên tin dùng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">
            Sẵn sàng chuyển đổi số cho lớp học của bạn?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-10 font-medium">
            Hãy để AI gánh vác những công việc lặp đi lặp lại, để bạn có thêm thời gian 
            truyền cảm hứng và kết nối với học sinh.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onNavigate('planner')}
              className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:scale-105 transition-transform"
            >
              Bắt đầu ngay
            </button>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <Users className="w-4 h-4" /> Tham gia cộng đồng 4.0
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, onClick, color }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void, color: string }) {
  const colorClasses = {
    blue: "hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10",
    indigo: "hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10",
    purple: "hover:border-purple-500/50 hover:bg-purple-50/30 dark:hover:bg-purple-900/10",
    emerald: "hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10",
  }[color as 'blue' | 'indigo' | 'purple' | 'emerald'];

  return (
    <div 
      onClick={onClick}
      className={`p-8 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 cursor-pointer transition-all duration-300 group ${colorClasses} hover:shadow-xl hover:-translate-y-1`}
    >
      <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-900 w-fit rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
        {desc}
      </p>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
        Khám phá <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}
