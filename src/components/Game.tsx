import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  MonitorPlay, 
  Rocket, 
  Play, 
  Power, 
  ArrowRight, 
  BarChart2, 
  Library, 
  Sparkles, 
  Zap, 
  Trash2, 
  X,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  Gamepad2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { ref, set, update, onValue, off, push, get } from 'firebase/database';
import { callGeminiAPI } from '../services/gemini';
import { Game as GameType, Question, Player, Room } from '../types';
import { FLUENT_3D, AVATARS_3D, render3DIcon } from '../lib/icons';

const OPT_COLS = ['#EF4444','#3B82F6','#F59E0B','#10B981'];
const LETTERS = ['A','B','C','D'];
const AV_COLS = ['#7C3AED','#2563EB','#059669','#D97706','#DC2626','#0891B2'];

const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2959/2959-preview.mp3',
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  join: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3',
  reveal: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
};

const playSound = (type: keyof typeof SOUNDS, muted: boolean) => {
  if (muted) return;
  const audio = new Audio(SOUNDS[type]);
  audio.volume = 0.5;
  audio.play().catch(() => {});
};


const ONLINE_GAMES: GameType[] = [
  { id: 'scratch', icon: FLUENT_3D.diamond, name: 'Cào Thẻ Đá Quý', type: 'scratch', questions: [{qType: 'mcq', q: 'Bác Hồ đọc Tuyên ngôn độc lập vào ngày nào?', opts: ['2/9/1945', '3/2/1930', '7/5/1954', '30/4/1975'], ans: 0}, {qType: 'text', q: 'Thủ đô của nước ta là gì?', correctText: 'Hà Nội'}] },
  { id: 'tugofwar', icon: FLUENT_3D.elephant, name: 'Kéo Co Trí Tuệ', type: 'tugOfWar', questions: [{qType: 'mcq', q: 'Từ nào đồng nghĩa với từ "Nhanh"?', opts: ['Chậm', 'Lề mề', 'Mau lẹ', 'Từ từ'], ans: 2}] },
  { id: 'olympia', icon: FLUENT_3D.mountain, name: 'Đỉnh Olympia', type: 'normal', questions: [{qType: 'mcq', q: 'Hành tinh nào gần Mặt Trời nhất?', opts: ['Trái Đất', 'Sao Kim', 'Sao Thủy', 'Sao Hỏa'], ans: 2}] },
  { id: 'mua_trong_nam', icon: FLUENT_3D.rainbow, name: 'Các Mùa Trong Năm', type: 'normal', questions: [
      {qType: 'mcq', q: 'Mùa nào có thời tiết nóng nhất trong năm?', opts: ['Mùa Xuân', 'Mùa Hạ (Hè)', 'Mùa Thu', 'Mùa Đông'], ans: 1},
      {qType: 'mcq', q: 'Hoa đào, hoa mai thường nở rộ vào mùa nào?', opts: ['Mùa Xuân', 'Mùa Hạ', 'Mùa Thu', 'Mùa Đông'], ans: 0},
      {qType: 'mcq', q: 'Tết Trung Thu - Tết của thiếu nhi diễn ra vào mùa nào?', opts: ['Mùa Xuân', 'Mùa Hạ', 'Mùa Thu', 'Mùa Đông'], ans: 2},
      {qType: 'mcq', q: 'Mùa nào các bạn học sinh thường được nghỉ học dài ngày nhất?', opts: ['Mùa Xuân', 'Mùa Hạ', 'Mùa Thu', 'Mùa Đông'], ans: 1},
      {qType: 'mcq', q: 'Đặc điểm thời tiết nổi bật của mùa Đông ở miền Bắc nước ta là gì?', opts: ['Nóng nực', 'Ấm áp', 'Mát mẻ', 'Lạnh giá'], ans: 3}
  ]},
  { id: 'bao_ve_mt', icon: FLUENT_3D.tree, name: 'Bảo Vệ Môi Trường', type: 'tugOfWar', questions: [
      {qType: 'mcq', q: 'Hành động nào sau đây giúp bảo vệ môi trường?', opts: ['Vứt rác bừa bãi', 'Trồng nhiều cây xanh', 'Chặt phá rừng', 'Xả nước thải ra sông'], ans: 1},
      {qType: 'mcq', q: 'Túi nilon (nhựa) mất khoảng bao lâu để phân hủy hoàn toàn trong tự nhiên?', opts: ['Vài ngày', 'Vài tháng', 'Vài năm', 'Hàng trăm năm'], ans: 3},
      {qType: 'mcq', q: 'Khi đi chợ, siêu thị, chúng ta nên ưu tiên sử dụng loại túi nào?', opts: ['Túi nilon dùng 1 lần', 'Túi vải dùng nhiều lần', 'Túi bóng kính', 'Cả 3 loại trên'], ans: 1},
      {qType: 'mcq', q: 'Việc tắt đèn, quạt khi ra khỏi phòng mang lại lợi ích gì?', opts: ['Tăng hiệu ứng nhà kính', 'Không có tác dụng gì', 'Tiết kiệm điện', 'Làm phòng nhanh hỏng'], ans: 2},
      {qType: 'mcq', q: 'Bỏ rác đúng nơi quy định là trách nhiệm của ai?', opts: ['Chỉ của lao công', 'Của riêng người lớn', 'Của mọi người', 'Của người xả rác'], ans: 2}
  ]},
  { id: 'hanh_vi_cong_cong', icon: FLUENT_3D.handshake, name: 'Văn Hóa Công Cộng', type: 'scratch', questions: [
      {qType: 'mcq', q: 'Khi lên xe buýt và thấy có người già không có ghế, em nên làm gì?', opts: ['Lờ đi', 'Nhường ghế của mình', 'Chen lấn thêm', 'Cười đùa to tiếng'], ans: 1},
      {qType: 'mcq', q: 'Khi vào thư viện đọc sách, em cần tuân thủ quy tắc nào nhất?', opts: ['Giữ trật tự', 'Ăn uống thoải mái', 'Hát hò vui vẻ', 'Chạy nhảy đuổi bắt'], ans: 0},
      {qType: 'mcq', q: 'Hành vi nào là ĐÚNG khi đi siêu thị hoặc căn tin trường?', opts: ['Lấy đồ rồi đi về luôn', 'Chen ngang lên trước', 'Xếp hàng chờ đến lượt', 'Ăn thử đồ chưa trả tiền'], ans: 2},
      {qType: 'mcq', q: 'Thấy rác rơi trên sân trường, em nên làm gì?', opts: ['Đá sang một bên', 'Nhặt bỏ vào thùng rác', 'Đi qua coi như không thấy', 'Đợi bác bảo vệ nhặt'], ans: 1},
      {qType: 'text', q: 'Khi làm sai hoặc làm phiền người khác, em cần nói lời gì?', correctText: 'Xin lỗi'}
  ]},
  { id: 'bieu_tuong_vn', icon: FLUENT_3D.star, name: 'Tự Hào Việt Nam', type: 'normal', questions: [
      {qType: 'mcq', q: 'Quốc hoa của Việt Nam là loài hoa nào?', opts: ['Hoa hồng', 'Hoa sen', 'Hoa mai', 'Hoa đào'], ans: 1},
      {qType: 'mcq', q: 'Lá cờ Tổ quốc Việt Nam có hình gì ở chính giữa?', opts: ['Ngôi sao 5 cánh', 'Búa liềm', 'Mặt trời đỏ', 'Trăng khuyết'], ans: 0},
      {qType: 'mcq', q: 'Bài hát Quốc ca của Việt Nam có tên là gì?', opts: ['Đội ca', 'Lên đàng', 'Tiến quân ca', 'Quốc tế ca'], ans: 2},
      {qType: 'text', q: 'Màu nền của lá cờ Tổ quốc Việt Nam là màu gì?', correctText: 'Đỏ'},
      {qType: 'text', q: 'Thủ đô của nước ta hiện nay tên là gì?', correctText: 'Hà Nội'}
  ]},
  { id: 'blank', icon: FLUENT_3D.palette, name: 'Mẫu Trống', type: 'normal', questions: [] }
];

const OFFLINE_GAMES: GameType[] = [
  { id: 'off_chiec_non', icon: FLUENT_3D.ferris_wheel, name: 'Chiếc Nón Kì Diệu', type: 'offline_wheel', questions: [{qType: 'mcq', q: 'Thủ đô Việt Nam?', opts: ['Huế', 'Hà Nội', 'Đà Nẵng', 'TP HCM'], ans: 1}] },
  { id: 'off_cao_the', icon: FLUENT_3D.sparkles, name: 'Cào Thẻ Phép Thuật', type: 'offline_scratch', questions: [{qType: 'mcq', q: 'Hành tinh gần Mặt Trời?', opts: ['Trái Đất', 'Sao Kim', 'Sao Thủy', 'Sao Hỏa'], ans: 2}] },
  { id: 'off_hop_qua', icon: FLUENT_3D.gift, name: 'Hộp Quà Bí Mật', type: 'offline_box', questions: [{qType: 'text', q: 'Mặt trời mọc hướng nào?', correctText: 'Đông'}] },
  { id: 'off_ap_trung', icon: FLUENT_3D.egg, name: 'Ấp Trứng Gọi Tên', type: 'offline_egg', questions: [{qType: 'mcq', q: 'Loài vật nào kêu Meo Meo?', opts: ['Chó', 'Mèo', 'Heo', 'Gà'], ans: 1}] },
  { id: 'off_cuon_ten', icon: FLUENT_3D.map, name: 'Bản Đồ Kho Báu', type: 'offline_scroll', questions: [{qType: 'text', q: 'Quốc hoa của Việt Nam là hoa gì?', correctText: 'Hoa sen'}] },
  { id: 'off_lat_the', icon: FLUENT_3D.cards, name: 'Lật Thẻ May Mắn', type: 'offline_flip', questions: [{qType: 'mcq', q: 'Màu cờ Tổ quốc Việt Nam có màu gì?', opts: ['Xanh, Đỏ', 'Đỏ, Vàng', 'Vàng, Xanh', 'Đỏ, Trắng'], ans: 1}] }
];

interface GameProps {
  showToast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
}

type Screen = 'landing' | 'teacher-mode' | 'teacher-pick' | 'editor' | 'room' | 'join' | 'lobby' | 'game' | 'offline-game' | 'lb';

export default function Game({ showToast }: GameProps) {
  const [screen, setScreen] = useState<Screen>('landing');
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [intendedMode, setIntendedMode] = useState<'online' | 'offline'>('online');
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [myId, setMyId] = useState('');
  const [myName, setMyName] = useState('');
  const [myScore, setMyScore] = useState(0);
  const [myAvatar, setMyAvatar] = useState(FLUENT_3D.avatar_default);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [answersThisQ, setAnswersThisQ] = useState<Record<string, any>>({});
  const [isOffline, setIsOffline] = useState(false);
  const [offlineNames, setOfflineNames] = useState<{name: string, color: string, score: number}[]>([]);
  const [offlineLocked, setOfflineLocked] = useState(false);
  const [showCorrectArea, setShowCorrectArea] = useState(false);
  const [lastMsgTs, setLastMsgTs] = useState(0);
  const [muted, setMuted] = useState(false);

  // Modals
  const [showOfflineNamesModal, setShowOfflineNamesModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [showEggModal, setShowEggModal] = useState(false);
  const [showScrollModal, setShowScrollModal] = useState(false);
  const [showScratchOffModal, setShowScratchOffModal] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // Refs for intervals and listeners
  const timerIv = useRef<any>(null);
  const listeners = useRef<string[]>([]);

  const clearFirebase = () => {
    listeners.current.forEach(path => off(ref(db, path)));
    listeners.current = [];
    if (timerIv.current) clearInterval(timerIv.current);
    setRoomCode('');
    setPlayers({});
    setCurrentQ(0);
    setTimeLeft(15);
    setLastMsgTs(0);
  };

  const goScreen = (s: Screen) => {
    playSound('click', muted);
    setScreen(s);
  };

  // TEACHER ACTIONS
  const handleTeacher = () => {
    setRole('teacher');
    goScreen('teacher-mode');
  };

  const selectMode = (mode: 'online' | 'offline') => {
    setIntendedMode(mode);
    goScreen('teacher-pick');
  };

  const openEditor = (game: GameType) => {
    setSelectedGame(game);
    setQuestions(JSON.parse(JSON.stringify(game.questions)));
    goScreen('editor');
  };

  const updateQData = (i: number, field: string, value: any, oIdx?: number) => {
    const newQs = [...questions];
    if (field === 'q') newQs[i].q = value;
    if (field === 'ans') newQs[i].ans = value;
    if (field === 'opt' && oIdx !== undefined) newQs[i].opts![oIdx] = value;
    if (field === 'correctText') newQs[i].correctText = value;
    setQuestions(newQs);
  };

  const deleteQuestion = (i: number) => {
    if (confirm("Xóa câu này?")) {
      setQuestions(prev => prev.filter((_, idx) => idx !== i));
    }
  };

  const addBlankQ = (type: 'mcq' | 'text') => {
    if (type === 'text') {
      setQuestions(prev => [...prev, { qType: 'text', q: '', correctText: '' }]);
    } else {
      setQuestions(prev => [...prev, { qType: 'mcq', q: '', opts: ['', '', '', ''], ans: 0 }]);
    }
  };

  const launchOnline = async () => {
    if (!questions.length) return showToast('Cần ít nhất 1 câu hỏi!', 'err');
    clearFirebase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setCurrentQ(0);

    await set(ref(db, 'rooms/' + code), { status: 'waiting', ts: Date.now() });
    playSound('success', muted);
    
    const pRefPath = 'rooms/' + code + '/players';
    onValue(ref(db, pRefPath), snap => {
      const data = snap.val() || {};
      const prevCount = Object.keys(players).length;
      const newCount = Object.keys(data).length;
      if (newCount > prevCount) playSound('join', muted);
      setPlayers(data);
    });
    listeners.current.push(pRefPath);
    goScreen('room');
  };

  const teacherStart = async () => {
    if (!isOffline) {
      await update(ref(db, 'rooms/' + roomCode), { status: 'playing' });
    }
    playSound('success', muted);
    showTeacherQuestion(0);
  };

  const showTeacherQuestion = async (idx: number) => {
    const q = questions[idx];
    if (!q) {
      teacherEndGame();
      return;
    }

    setAnswersThisQ({});
    setCurrentQ(idx);
    
    if (!isOffline) {
      await set(ref(db, 'rooms/' + roomCode + '/msg'), { 
        type: 'question', 
        q: q.q, 
        opts: q.opts || null, 
        qType: q.qType, 
        qIdx: idx, 
        _ts: Date.now() 
      });

      const ansRefPath = 'rooms/' + roomCode + '/answers/q' + idx;
      onValue(ref(db, ansRefPath), snap => {
        const data = snap.val() || {};
        const answers: Record<string, any> = {};
        Object.keys(data).forEach(k => {
          answers[k] = data[k].ans;
        });
        setAnswersThisQ(answers);
      });
      listeners.current.push(ansRefPath);
    }

    setTimeLeft(15);
    if (isOffline) {
      goScreen('offline-game');
    }
    if (timerIv.current) clearInterval(timerIv.current);
    timerIv.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIv.current);
          processScores(idx);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const processScores = async (idx: number) => {
    const q = questions[idx];
    
    if (isOffline) {
      setShowCorrectArea(true);
      playSound('reveal', muted);
      return;
    }

    const updates: Record<string, any> = {};
    
    // We need the latest answers and players
    const roomSnap = await get(ref(db, 'rooms/' + roomCode));
    const roomData = roomSnap.val();
    const currentAnswers = roomData.answers?.['q' + idx] || {};
    const currentPlayers = roomData.players || {};

    for (let pid in currentAnswers) {
      let pAns = currentAnswers[pid].ans;
      let isCorrect = (q.qType === 'text') 
        ? (String(pAns).trim().toLowerCase() === String(q.correctText).trim().toLowerCase()) 
        : (parseInt(pAns as string) === q.ans);
      
      if (isCorrect) {
        updates[`players/${pid}/score`] = (currentPlayers[pid].score || 0) + 10;
      }
    }
    
    await update(ref(db, 'rooms/' + roomCode), updates);
    await set(ref(db, 'rooms/' + roomCode + '/msg'), { 
      type: 'reveal', 
      ansIdx: q.qType === 'text' ? q.correctText : q.ans, 
      _ts: Date.now() 
    });
    setShowCorrectArea(true);
    playSound('reveal', muted);
  };

  const teacherNext = () => {
    const nextIdx = currentQ + 1;
    if (nextIdx >= questions.length) {
      teacherEndGame();
    } else {
      showTeacherQuestion(nextIdx);
    }
  };

  const teacherEndGame = async () => {
    if (!isOffline) {
      await update(ref(db, 'rooms/' + roomCode), { status: 'ended' });
      await set(ref(db, 'rooms/' + roomCode + '/msg'), { type: 'end', _ts: Date.now() });
    }
    playSound('win', muted);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    goScreen('lb');
  };

  // STUDENT ACTIONS
  const handleJoin = async () => {
    const code = roomCode.toUpperCase();
    if (code.length !== 6 || !myName) return showToast("Vui lòng nhập đủ Mã và Tên!", "err");

    const snap = await get(ref(db, 'rooms/' + code));
    if (!snap.exists() || snap.val().status === 'ended') {
      return showToast("Phòng không tồn tại hoặc đã đóng!", "err");
    }

    const id = 'S' + Date.now();
    setMyId(id);
    setMyScore(0);
    setIsAnswered(false);
    setLastMsgTs(Date.now());
    
    const av = AVATARS_3D[Math.floor(Math.random() * AVATARS_3D.length)];
    setMyAvatar(av);

    await set(ref(db, 'rooms/' + code + '/players/' + id), { name: myName, avatar: av, score: 0 });
    
    const msgPath = 'rooms/' + code + '/msg';
    onValue(ref(db, msgPath), msnap => {
      const m = msnap.val();
      if (m && m._ts > lastMsgTs) {
        setLastMsgTs(m._ts);
        handleStudentMsg(m);
      }
    });
    listeners.current.push(msgPath);
    goScreen('lobby');
  };

  const handleStudentMsg = (msg: any) => {
    if (msg.type === 'question') {
      setIsAnswered(false);
      setCurrentQ(msg.qIdx);
      goScreen('game');
    } else if (msg.type === 'reveal') {
      get(ref(db, 'rooms/' + roomCode + '/players/' + myId)).then(snap => {
        const p = snap.val();
        if (p) {
          if ((p.score || 0) > myScore) {
            playSound('success', muted);
            showToast('🎉 Chính xác! +10đ', 'ok');
          } else {
            playSound('error', muted);
            showToast('❌ Chưa đúng!', 'err');
          }
          setMyScore(p.score || 0);
        }
      });
    } else if (msg.type === 'end') {
      playSound('win', muted);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      goScreen('lb');
    }
  };

  const studentAnswer = async (val: any) => {
    if (isAnswered) return;
    setIsAnswered(true);
    await set(ref(db, 'rooms/' + roomCode + '/answers/q' + currentQ + '/' + myId), { ans: val });
  };

  // OFFLINE ACTIONS
  const startOfflineSetup = () => {
    setShowOfflineNamesModal(true);
    const saved = localStorage.getItem('gv_offline_names');
    if (saved) {
      // Assuming it's a newline separated string
    }
  };

  const launchOffline = (names: string[]) => {
    if (!questions.length) return showToast('Cần ít nhất 1 câu hỏi!', 'err');
    const formatted = names.map((n, i) => ({ name: n, color: AV_COLS[i % AV_COLS.length], score: 0 }));
    setOfflineNames(formatted);
    setIsOffline(true);
    setCurrentQ(0);
    setTimeLeft(15);
    setShowOfflineNamesModal(false);
    goScreen('room');
  };

  useEffect(() => {
    if (screen === 'lb') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [screen]);

  return (
    <div className="game-theme min-h-[calc(100vh-64px)] relative overflow-hidden">
      {/* LANDING */}
      {screen === 'landing' && (
        <div className="flex flex-col items-center justify-start pt-20 min-h-[calc(100vh-64px)] p-4 text-center max-w-3xl mx-auto w-full animate-in fade-in duration-500 relative">
          <div className="absolute top-0 right-0 p-4">
            <button 
              className="p-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group"
              onClick={() => { setMuted(!muted); playSound('click', !muted); }}
              title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {muted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />}
            </button>
          </div>
          <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-6xl mx-auto mb-4 shadow-inner animate-bounce-subtle overflow-hidden">
            {render3DIcon(FLUENT_3D.party, "w-16 h-16")}
          </div>
          <h1 className="font-baloo text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 leading-tight mb-1">
            LỚP HỌC <em className="text-pink-500 not-italic">HẠNH PHÚC</em>
          </h1>
          <p className="font-bold text-cyan-600 text-xs uppercase tracking-wide mb-6">Trường Tiểu Học Lý Tự Trọng</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xl">
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="role-card flex-1 flex flex-col items-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 cursor-pointer shadow-[0_6px_0_#f1f5f9] dark:shadow-[0_6px_0_#0f172a] hover:shadow-[0_10px_0_#f1f5f9] dark:hover:shadow-[0_10px_0_#0f172a] transition-all"
              onClick={handleTeacher}
            >
              <div className="w-20 h-20 mb-4 transition-transform hover:rotate-12 flex items-center justify-center">
                {render3DIcon(FLUENT_3D.teacher, "w-full h-full")}
              </div>
              <h2 className="font-baloo text-xl font-black text-slate-800 dark:text-slate-100 mb-1">Giáo Viên</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Tạo phòng & Quản lý</p>
              <span className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold shadow-sm">Tạo ngay →</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="role-card flex-1 flex flex-col items-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 cursor-pointer shadow-[0_6px_0_#f1f5f9] dark:shadow-[0_6px_0_#0f172a] hover:shadow-[0_10px_0_#f1f5f9] dark:hover:shadow-[0_10px_0_#0f172a] transition-all"
              onClick={() => goScreen('join')}
            >
              <div className="w-20 h-20 mb-4 transition-transform hover:-rotate-12 flex items-center justify-center">
                {render3DIcon(FLUENT_3D.backpack, "w-full h-full")}
              </div>
              <h2 className="font-baloo text-xl font-black text-slate-800 dark:text-slate-100 mb-1">Học Sinh</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Tham gia bằng mã số</p>
              <span className="px-3 py-1 bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-sm">Vào lớp →</span>
            </motion.div>
          </div>
        </div>
      )}

      {/* TEACHER MODE SELECTION */}
      {screen === 'teacher-mode' && (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          <div className="game-hdr bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
            <div className="font-baloo font-black text-base text-pink-500 flex items-center gap-1.5">
              <div className="w-8 h-8 flex items-center justify-center">
                {render3DIcon(FLUENT_3D.teacher, "w-full h-full")}
              </div> 
              GIÁO VIÊN
            </div>
            <button className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1" onClick={() => goScreen('landing')}>
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
            </button>
          </div>
          <div className="flex flex-col items-center justify-start pt-20 flex-1 p-4 text-center max-w-3xl mx-auto w-full">
            <h2 className="font-baloo text-2xl font-black text-slate-800 dark:text-slate-100 mb-5">Hình thức tổ chức</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xl">
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="role-card flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 cursor-pointer shadow-[0_6px_0_#f1f5f9] dark:shadow-[0_6px_0_#0f172a] hover:shadow-[0_10px_0_#f1f5f9] dark:hover:shadow-[0_10px_0_#0f172a] transition-all group" 
                onClick={() => selectMode('online')}
              >
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-6xl mx-auto mb-4 shadow-inner group-hover:scale-110 transition-transform animate-bounce-subtle overflow-hidden">
                  {render3DIcon(FLUENT_3D.globe, "w-14 h-14")}
                </div>
                <h2 className="font-baloo text-xl font-black text-slate-800 dark:text-slate-100 mb-1">Chơi Online</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">Học sinh dùng thiết bị riêng.</p>
                <span className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs font-bold shadow-sm">Tạo phòng ảo →</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="role-card flex-1 bg-cyan-50 dark:bg-slate-800 border-2 border-cyan-200 dark:border-slate-700 rounded-[2rem] p-8 cursor-pointer shadow-[0_6px_0_#e0f2fe] dark:shadow-[0_6px_0_#0f172a] hover:shadow-[0_10px_0_#e0f2fe] dark:hover:shadow-[0_10px_0_#0f172a] transition-all group" 
                onClick={() => selectMode('offline')}
              >
                <div className="w-20 h-20 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-6xl mx-auto mb-4 shadow-inner group-hover:scale-110 transition-transform animate-bounce-subtle overflow-hidden">
                  {render3DIcon(FLUENT_3D.school, "w-14 h-14")}
                </div>
                <h2 className="font-baloo text-xl font-black text-cyan-700 dark:text-cyan-400 mb-1">Chơi Offline</h2>
                <p className="text-xs text-cyan-600 dark:text-cyan-500 mb-3 font-medium">Chiếu bảng, gọi tên học sinh.</p>
                <span className="px-3 py-1 bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-sm">Chiếu bảng →</span>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER PICK GAME */}
      {screen === 'teacher-pick' && (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          <div className="game-hdr bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
            <div className="font-baloo font-black text-base text-pink-500">KHO TRÒ CHƠI</div>
            <button className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1" onClick={() => goScreen('teacher-mode')}>
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
            </button>
          </div>
          <div className="p-4 pt-20 max-w-4xl mx-auto w-full">
            <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-3">Lựa chọn Minigame</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(intendedMode === 'offline' ? OFFLINE_GAMES : ONLINE_GAMES).map((g, i) => {
                const colors = [
                  'bg-pink-100 text-pink-600',
                  'bg-blue-100 text-blue-600',
                  'bg-green-100 text-green-600',
                  'bg-yellow-100 text-yellow-600',
                  'bg-purple-100 text-purple-600',
                  'bg-orange-100 text-orange-600',
                  'bg-cyan-100 text-cyan-600',
                  'bg-rose-100 text-rose-600'
                ];
                const colorClass = colors[i % colors.length];
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={g.id} 
                    className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center shadow-[0_4px_0_#f1f5f9] dark:shadow-[0_4px_0_#0f172a] cursor-pointer hover:-translate-y-1 hover:border-blue-400 transition-all group" 
                    onClick={() => openEditor(g)}
                  >
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center text-4xl mx-auto mb-3 shadow-inner group-hover:scale-110 transition-transform animate-bounce-subtle overflow-hidden", colorClass)}>
                      {render3DIcon(g.icon, "w-10 h-10")}
                    </div>
                    <div className="font-baloo text-base font-black text-slate-700 dark:text-slate-200">{g.name}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDITOR */}
      {screen === 'editor' && (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          <div className="game-hdr bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
            <div className="font-baloo font-black text-base text-pink-500">SOẠN CÂU HỎI</div>
            <div className="flex gap-1.5 items-center">
              <button className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold" onClick={() => goScreen('teacher-pick')}>Hủy</button>
              {intendedMode === 'online' ? (
                <button className="bg-cyan-500 text-white rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#0891b2]" onClick={launchOnline}>
                  <Rocket className="w-3 h-3" /> Tạo phòng
                </button>
              ) : (
                <button className="bg-amber-500 text-white rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#d97706]" onClick={() => setShowOfflineNamesModal(true)}>
                  <MonitorPlay className="w-3 h-3" /> Bắt đầu Offline
                </button>
              )}
            </div>
          </div>
          <div className="p-4 max-w-3xl mx-auto w-full overflow-y-auto">
            <div className="bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-xl p-3 mb-4 flex items-center gap-3 shadow-sm">
              <div className="w-12 h-12 flex items-center justify-center animate-float-fast">
                {selectedGame && render3DIcon(selectedGame.icon, "w-full h-full")}
              </div>
              <div className="font-baloo text-lg font-black text-amber-700 dark:text-amber-400">{selectedGame?.name}</div>
            </div>
            
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-baloo font-black text-base text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg">Câu {i+1}</span>
                    <button className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-700 p-1.5 rounded-md transition-colors" onClick={() => deleteQuestion(i)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea 
                    placeholder="Nhập câu hỏi..." 
                    value={q.q}
                    onChange={(e) => updateQData(i, 'q', e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-black dark:text-slate-200 outline-none focus:border-blue-400 resize-none h-16 text-sm mb-2"
                  />
                  {q.qType === 'text' ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-2 flex items-center">
                      <b className="text-indigo-800 dark:text-indigo-300 text-xs w-16 pl-2">ĐÁP ÁN:</b>
                      <input 
                        className="flex-1 bg-transparent border-none font-bold text-black dark:text-indigo-100 outline-none text-sm" 
                        value={q.correctText}
                        onChange={(e) => updateQData(i, 'correctText', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.opts?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl">
                          <input 
                            type="radio" 
                            name={`ans_${i}`} 
                            checked={q.ans === oIdx}
                            onChange={() => updateQData(i, 'ans', oIdx)}
                            className="w-3.5 h-3.5 cursor-pointer ml-2" 
                          />
                          <div style={{ color: OPT_COLS[oIdx] }} className="font-black w-5 text-center text-sm">{LETTERS[oIdx]}</div>
                          <input 
                            value={opt}
                            onChange={(e) => updateQData(i, 'opt', e.target.value, oIdx)}
                            className="flex-1 bg-transparent border-none font-bold outline-none text-xs text-black dark:text-slate-200" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 mb-8">
              <button className="flex-1 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-lg py-2 font-bold hover:bg-slate-50 text-xs transition-colors" onClick={() => addBlankQ('mcq')}>+ Trắc nghiệm</button>
              <button className="flex-1 bg-white dark:bg-slate-800 border border-dashed border-amber-300 dark:border-amber-900 text-amber-600 dark:text-amber-500 rounded-lg py-2 font-bold hover:bg-amber-50 text-xs transition-colors" onClick={() => addBlankQ('text')}>+ Tự luận</button>
              <button className="flex-1 bg-emerald-50 dark:bg-emerald-900/30 border border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg py-2 font-bold hover:bg-emerald-100 text-xs transition-colors" onClick={() => setShowBankModal(true)}>
                <Library className="w-3.5 h-3.5 inline mr-1" /> Mở Kho
              </button>
              <button className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 border border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 rounded-lg py-2 font-bold hover:bg-indigo-100 text-xs transition-colors" onClick={() => setShowAiModal(true)}>
                <Sparkles className="w-3.5 h-3.5 inline mr-1" /> AI Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN SCREEN */}
      {screen === 'join' && (
        <div className="flex flex-col items-center justify-start pt-20 min-h-[calc(100vh-64px)] p-3 bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-lg shadow-blue-100/50 dark:shadow-none">
            <div className="w-20 h-20 mx-auto mb-3 drop-shadow-sm animate-wiggle flex items-center justify-center">
              {render3DIcon(FLUENT_3D.backpack, "w-full h-full")}
            </div>
            <h1 className="font-baloo text-2xl font-black text-slate-800 dark:text-slate-100 mb-4">Vào lớp học!</h1>
            
            <div className="space-y-3 mb-6">
              <input 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6} 
                placeholder="MÃ PHÒNG" 
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-baloo text-xl font-black text-center tracking-[0.2em] outline-none focus:border-blue-500 focus:bg-white transition-colors text-black dark:text-slate-100" 
              />
              <input 
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                maxLength={20} 
                placeholder="Nhập tên em..." 
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm text-center outline-none focus:border-blue-500 focus:bg-white transition-colors text-black dark:text-slate-100" 
              />
            </div>
            
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-baloo text-lg font-bold hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2" onClick={handleJoin}>
              {render3DIcon(FLUENT_3D.rocket, "w-6 h-6")} VÀO LỚP
            </button>
            <button className="mt-3 text-xs font-bold text-slate-400 hover:text-slate-600" onClick={() => goScreen('landing')}>← Quay lại</button>
          </div>
        </div>
      )}

      {/* LOBBY */}
      {screen === 'lobby' && (
        <div className="flex flex-col items-center justify-start pt-20 min-h-[calc(100vh-64px)] p-4 text-center">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 font-bold text-emerald-700 dark:text-emerald-400 mb-4 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Đã kết nối
          </div>
          
          <div className="w-24 h-24 mb-3 filter drop-shadow-sm animate-float-slow flex items-center justify-center">
            {render3DIcon(myAvatar, "w-full h-full")}
          </div>
          <div className="font-baloo text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">{myName}</div>
          <div className="text-xs font-bold text-slate-500 mb-6">Mã phòng: <b className="text-blue-600 text-sm ml-1">{roomCode}</b></div>
          
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm max-w-sm w-full relative overflow-hidden">
            <div className="w-20 h-20 absolute -right-2 -bottom-2 opacity-20 flex items-center justify-center">
              {render3DIcon(FLUENT_3D.avatar_default, "w-full h-full")}
            </div>
            <div className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1.5">Sẵn sàng nhé!</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">Cô giáo sẽ bắt đầu ngay thôi...</div>
            <div className="w-6 h-6 border-2 border-slate-100 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      )}

      {/* TEACHER ROOM CONTROL */}
      {screen === 'room' && (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          <div className="game-hdr bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
            <div className="font-baloo font-black text-base text-pink-500 flex items-center gap-1.5">
              <div className="w-8 h-8 flex items-center justify-center">
                {render3DIcon(FLUENT_3D.teacher, "w-full h-full")}
              </div> 
              ĐIỀU KHIỂN
            </div>
            <div className="flex gap-1.5">
              <button className="bg-pink-500 text-white rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#db2777]" onClick={() => { playSound('success', muted); confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }}>
                <Star className="w-3 h-3" /> Chúc mừng
              </button>
              {timeLeft === 0 && (
                <button className="bg-emerald-500 text-white rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#059669]" onClick={teacherNext}>
                  Câu tiếp <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {timeLeft === 15 && currentQ === 0 && (
                <button className="bg-amber-500 text-white rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#d97706]" onClick={teacherStart}>
                  <Play className="w-3 h-3" /> Bắt đầu
                </button>
              )}
              <button className="bg-red-500 text-white rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#dc2626]" onClick={() => { if(confirm('Kết thúc phòng?')) clearFirebase(); goScreen('teacher-mode'); }}>
                <Power className="w-3 h-3" /> Kết thúc
              </button>
            </div>
          </div>
          <div className="flex flex-1 overflow-hidden pt-10">
            <div className="w-60 p-3 border-r border-slate-200 dark:border-slate-700 flex flex-col gap-3 bg-white dark:bg-slate-800 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
              <div className="bg-violet-600 rounded-xl p-3 text-center text-white shadow-sm relative overflow-hidden">
                <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Mã Phòng</div>
                <div className="font-baloo text-3xl font-black tracking-widest relative z-10">{isOffline ? 'OFFLINE' : roomCode}</div>
              </div>
              
              <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 overflow-hidden">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {render3DIcon(FLUENT_3D.students, "w-full h-full")}
                    </div> 
                    Sĩ số
                  </span>
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md px-2 py-0.5 font-bold text-xs">
                    {isOffline ? offlineNames.length : Object.keys(players).length}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-1 text-xs">
                  {(isOffline ? offlineNames : Object.values(players) as Player[]).map((p, i) => (
                    <div key={i} className="p-1.5 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {render3DIcon((p as any).avatar || FLUENT_3D.avatar_default, "w-full h-full")}
                      </div>
                      <b className="flex-1 text-xs dark:text-slate-200">{p.name}</b>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{p.score || 0}đ</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg py-2 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors" onClick={() => setShowWheelModal(true)}>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {render3DIcon(FLUENT_3D.ferris_wheel, "w-full h-full")}
                  </div> 
                  Quay gọi tên
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative">
              {timeLeft === 15 && currentQ === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <div className="w-24 h-24 mb-3 drop-shadow-sm animate-float-slow flex items-center justify-center">
                    {render3DIcon(FLUENT_3D.rocket, "w-full h-full")}
                  </div>
                  <h2 className="font-baloo text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Phòng đã mở!</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                    {isOffline ? 'Chế độ chơi Offline - Không cần mã phòng' : (
                      <>Hướng dẫn học sinh nhập mã: <span className="text-violet-600 font-bold ml-1">{roomCode}</span></>
                    )}
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentQ}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex flex-col max-w-3xl mx-auto w-full"
                  >
                    <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-bold uppercase text-pink-600 bg-pink-100 dark:bg-pink-900/30 px-2.5 py-0.5 rounded-md">Câu {currentQ + 1}</div>
                      <motion.div 
                        animate={timeLeft <= 5 ? { scale: [1, 1.1, 1], color: ['#ef4444', '#f87171', '#ef4444'] } : {}}
                        transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
                        className="font-baloo text-xl font-black text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-1"
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          {render3DIcon(FLUENT_3D.timer, "w-full h-full")}
                        </div> 
                        {timeLeft}s
                      </motion.div>
                    </div>
                    <div className="font-baloo text-xl md:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 leading-snug py-2">
                      {questions[currentQ]?.q}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5" /> Nộp bài: <span className="text-blue-600 mx-0.5">{Object.keys(answersThisQ).length}</span> / {Object.keys(players).length}
                    </div>
                    <div className="flex gap-3 items-end h-20 pt-1 border-b border-slate-100 dark:border-slate-700">
                      {[0,1,2,3].map(i => {
                        const count = Object.values(answersThisQ).filter(a => a === i).length;
                        const total = Object.keys(answersThisQ).length;
                        const height = total > 0 ? (count / total) * 90 + 5 : 5;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <div className="w-full rounded-t-md transition-all duration-300" style={{ height: `${height}%`, background: OPT_COLS[i] }}></div>
                            <span className="text-[9px] font-bold mt-1 text-slate-400">{LETTERS[i]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    )}

      {/* STUDENT GAME PLAY */}
      {screen === 'game' && (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-2.5 flex items-center justify-between shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                {render3DIcon(myAvatar, "w-6 h-6")}
              </div>
              <div className="font-bold text-xs text-slate-700 dark:text-slate-200">{myName}</div>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1 font-baloo font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-1">
              ⭐ {myScore}
            </div>
          </div>
          
          <div className="flex-1 p-3 pt-20 max-w-xl mx-auto w-full overflow-y-auto flex flex-col">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col flex-1 mb-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase text-center mb-1.5">Câu {currentQ + 1}</div>
              <div className="font-baloo text-lg font-bold text-center text-slate-800 dark:text-slate-100 leading-snug mb-4 flex-1 flex items-center justify-center">
                {questions[currentQ]?.q}
              </div>
              
              {questions[currentQ]?.qType === 'text' ? (
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg font-medium text-sm text-center outline-none focus:border-blue-500 dark:text-slate-100" 
                    placeholder="Nhập câu trả lời..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') studentAnswer((e.target as HTMLInputElement).value);
                    }}
                  />
                  <button 
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                    disabled={isAnswered}
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      studentAnswer(input.value);
                    }}
                  >
                    Gửi Đáp Án
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {questions[currentQ]?.opts?.map((o, i) => (
                    <button 
                      key={i}
                      disabled={isAnswered}
                      className={cn(
                        "p-3 rounded-xl border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-transform active:scale-95 text-left flex items-center gap-2 shadow-sm text-sm disabled:opacity-50",
                        isAnswered ? "border-slate-200 dark:border-slate-700" : ""
                      )}
                      style={!isAnswered ? { borderColor: OPT_COLS[i] } : {}}
                      onClick={() => studentAnswer(i)}
                    >
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs" style={{ background: OPT_COLS[i] }}>{LETTERS[i]}</span>
                      <span className="flex-1">{o}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {isAnswered && (
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center shadow-sm animate-in slide-in-from-bottom duration-300">
                <div className="w-16 h-16 mx-auto mb-1.5 flex justify-center animate-bounce">
                  {render3DIcon(FLUENT_3D.timer, "w-full h-full")}
                </div>
                <div className="font-baloo text-lg font-black text-slate-600 dark:text-slate-400">Đã nộp! Đợi hết giờ...</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OFFLINE GAME SCREEN */}
      {screen === 'offline-game' && (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
          <div className="game-hdr bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
            <div className="font-baloo font-black text-base text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
              <div className="w-8 h-8 flex items-center justify-center">
                {render3DIcon(FLUENT_3D.computer, "w-full h-full")}
              </div> 
              CHƠI OFFLINE
            </div>
            <div className="flex gap-1.5">
              {questions[currentQ]?.qType === 'text' && !showCorrectArea && (
                <button className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1" onClick={() => setShowCorrectArea(true)}>
                  <div className="w-4 h-4 flex items-center justify-center">
                    {render3DIcon(FLUENT_3D.eye, "w-full h-full")}
                  </div> 
                  Hiện đáp án
                </button>
              )}
              <button className="bg-emerald-500 text-white rounded-lg px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#059669]" onClick={() => {
                setShowCorrectArea(false);
                setOfflineLocked(false);
                teacherNext();
              }}>
                Câu tiếp <ArrowRight className="w-3 h-3" />
              </button>
              <button className="bg-red-500 text-white rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1 shadow-[0_3px_0_#dc2626]" onClick={() => { if(confirm('Kết thúc?')) teacherEndGame(); }}>
                <Power className="w-3 h-3" /> Kết thúc
              </button>
            </div>
          </div>
          <div className="p-4 pt-20 max-w-4xl mx-auto w-full flex-1 flex flex-col">
            <div className="text-xs font-bold text-slate-400 uppercase text-center mb-2">Câu {currentQ + 1} / {questions.length}</div>
            <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 font-baloo text-2xl md:text-3xl font-black text-center text-slate-800 dark:text-slate-100 leading-snug mb-6 shadow-sm flex items-center justify-center min-h-[150px] relative overflow-hidden">
              {questions[currentQ]?.q}
            </div>
            
            {showCorrectArea && (
              <div className="text-center mb-6 p-6 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm animate-in slide-in-from-bottom duration-300">
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 uppercase">ĐÁP ÁN ĐÚNG</div>
                <div className="font-baloo text-3xl font-black text-emerald-600 dark:text-emerald-300">{questions[currentQ]?.correctText}</div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button 
                className="bg-violet-600 text-white py-3 px-6 rounded-xl text-lg font-bold shadow-[0_4px_0_#5b21b6] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2"
                onClick={() => setShowWheelModal(true)}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {render3DIcon(FLUENT_3D.ferris_wheel, "w-full h-full")}
                </div> 
                VÒNG QUAY
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
              {questions[currentQ]?.qType === 'mcq' && questions[currentQ]?.opts?.map((o, i) => (
                <button 
                  key={i}
                  className={cn(
                    "p-4 rounded-2xl border-2 bg-white dark:bg-slate-800 font-baloo text-lg font-black text-slate-700 dark:text-slate-200 flex items-center gap-3 shadow-[0_4px_0_#f1f5f9] dark:shadow-[0_4px_0_#0f172a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all",
                    offlineLocked && i === questions[currentQ].ans ? "bg-emerald-500 border-emerald-600 text-white shadow-[0_4px_0_#059669]" : 
                    offlineLocked && i !== questions[currentQ].ans ? "opacity-50 grayscale" : ""
                  )}
                  onClick={() => {
                    if (offlineLocked) return;
                    if (i === questions[currentQ].ans) {
                      setOfflineLocked(true);
                      showToast('🎉 Chính xác!', 'ok');
                    } else {
                      playSound('error', muted);
                      showToast('❌ Chưa đúng!', 'err');
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl" style={{ background: OPT_COLS[i] }}>{LETTERS[i]}</div>
                  <span className="flex-1 text-left">{o}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD */}
      {screen === 'lb' && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 w-full max-w-xl mx-auto animate-in zoom-in duration-500">
          <div className="text-7xl mb-2 drop-shadow-md animate-bounce flex items-center justify-center">
            {render3DIcon(FLUENT_3D.trophy, "w-24 h-24")}
          </div>
          <h2 className="font-baloo text-2xl md:text-3xl font-black text-amber-500 mb-1 text-center uppercase">BẢNG VINH DANH</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold mb-6 text-xs">Trò chơi đã kết thúc!</p>
          
          <div className="w-full flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
            {(Object.values(players) as Player[]).sort((a,b) => b.score - a.score).map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-400 w-6 text-sm">#{i+1}</span>
                  <div className="w-10 h-10 flex items-center justify-center">
                    {render3DIcon(p.avatar || FLUENT_3D.avatar_default, "w-full h-full")}
                  </div>
                  <b className="text-slate-700 dark:text-slate-200 text-base">{p.name}</b>
                </div>
                <b className="text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-lg text-sm">{p.score || 0}đ</b>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-8 w-full">
            <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all" onClick={() => { clearFirebase(); goScreen('landing'); }}>Chơi Lại</button>
            <button className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all" onClick={() => window.location.reload()}>Về Trang Chủ</button>
          </div>
        </div>
      )}

      {/* WHEEL MODAL */}
      {showWheelModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  {render3DIcon(FLUENT_3D.ferris_wheel, "w-full h-full")}
                </div> 
                Vòng Quay May Mắn
              </h3>
              <button onClick={() => setShowWheelModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-72 h-72 relative flex items-center justify-center">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-t-red-500 border-l-transparent border-r-transparent z-20 drop-shadow-md"></div>
                
                {/* Wheel */}
                <motion.div 
                  animate={{ rotate: wheelRotation }}
                  transition={{ duration: 4, ease: [0.2, 0, 0.1, 1] }}
                  className="w-full h-full rounded-full border-4 border-white dark:border-slate-700 shadow-xl relative overflow-hidden bg-slate-100 dark:bg-slate-900"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {(() => {
                      const pList = isOffline ? offlineNames : Object.values(players);
                      if (pList.length === 0) return <circle cx="50" cy="50" r="50" fill="#f1f5f9" />;
                      
                      const count = pList.length;
                      const angle = 360 / count;
                      
                      return pList.map((p, i) => {
                        const startAngle = i * angle;
                        const endAngle = (i + 1) * angle;
                        
                        // Path for segment
                        const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                        const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                        const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                        const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                        
                        // Text position
                        const textAngle = startAngle + angle / 2;
                        const tx = 50 + 35 * Math.cos((Math.PI * (textAngle - 90)) / 180);
                        const ty = 50 + 35 * Math.sin((Math.PI * (textAngle - 90)) / 180);
                        
                        return (
                          <g key={i}>
                            <path d={pathData} fill={AV_COLS[i % AV_COLS.length]} stroke="white" strokeWidth="0.5" />
                            <text 
                              x={tx} 
                              y={ty} 
                              fill="white" 
                              fontSize="3.5" 
                              fontWeight="bold" 
                              textAnchor="middle" 
                              transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                              className="pointer-events-none"
                            >
                              {(p as any).name?.substring(0, 10)}
                            </text>
                          </g>
                        );
                      });
                    })()}
                  </svg>
                  {/* Center Hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700 z-10 flex items-center justify-center shadow-inner">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  </div>
                </motion.div>
              </div>
              
              <div id="wheelWinner" className="font-baloo text-xl font-black text-blue-600 dark:text-blue-400 h-8 mt-6 text-center"></div>
              
              <button 
                disabled={isSpinning}
                className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                onClick={() => {
                  const pList = isOffline ? offlineNames : Object.values(players);
                  if (!pList.length || !pList[0]) {
                    const winnerEl = document.getElementById('wheelWinner');
                    if (winnerEl) winnerEl.textContent = "Chưa có HS!";
                    return;
                  }

                  setIsSpinning(true);
                  const winnerEl = document.getElementById('wheelWinner');
                  if (winnerEl) winnerEl.textContent = "Đang quay...";
                  
                  playSound('countdown', muted);
                  
                  const winnerIdx = Math.floor(Math.random() * pList.length);
                  const segmentAngle = 360 / pList.length;
                  
                  // Calculate rotation to land winner at top (0 degrees)
                  // The wheel rotates clockwise. The pointer is at the top.
                  // Winner segment i is at [i*angle, (i+1)*angle].
                  // Center of winner segment is (i + 0.5) * angle.
                  // To bring this to the top (0 degrees), we need to rotate by -(i + 0.5) * angle.
                  // We add multiple full rotations for effect.
                  const extraRotations = 5 + Math.floor(Math.random() * 5);
                  const targetRotation = wheelRotation + (extraRotations * 360) - (winnerIdx + 0.5) * segmentAngle - (wheelRotation % 360);
                  
                  setWheelRotation(targetRotation);
                  
                  setTimeout(() => {
                    setIsSpinning(false);
                    const winner = pList[winnerIdx] as any;
                    if (winnerEl) {
                      winnerEl.innerHTML = `<div class="flex items-center justify-center gap-2">
                        <img src="${FLUENT_3D.party}" class="w-8 h-8 object-contain" />
                        <span>${winner.name || "Học sinh"}</span>
                        <img src="${FLUENT_3D.party}" class="w-8 h-8 object-contain" />
                      </div>`;
                    }
                    playSound('success', muted);
                    confetti({
                      particleCount: 80,
                      spread: 70,
                      origin: { y: 0.7 }
                    });
                  }, 4000);
                }}
              >
                {isSpinning ? "ĐANG QUAY..." : "QUAY TÊN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFLINE NAMES MODAL */}
      {showOfflineNamesModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  {render3DIcon(FLUENT_3D.people, "w-full h-full")}
                </div> 
                Nhập tên học sinh
              </h3>
              <button onClick={() => setShowOfflineNamesModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <textarea 
                id="offlineNamesInput"
                className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-medium outline-none focus:border-blue-400 resize-none mb-4 dark:text-slate-200"
                placeholder="Nhập tên học sinh, mỗi tên một dòng..."
              />
              <button 
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all"
                onClick={() => {
                  const input = document.getElementById('offlineNamesInput') as HTMLTextAreaElement;
                  const names = input.value.split('\n').map(n => n.trim()).filter(n => n !== '');
                  if (names.length === 0) return showToast('Nhập ít nhất 1 tên!', 'err');
                  launchOffline(names);
                }}
              >
                BẮT ĐẦU CHƠI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANK MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Library className="w-4 h-4 text-emerald-500" /> Kho Câu Hỏi</h3>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ONLINE_GAMES.map(g => (
                  <div key={g.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => {
                    setQuestions(JSON.parse(JSON.stringify(g.questions)));
                    setSelectedGame(g);
                    setShowBankModal(false);
                    showToast('Đã tải câu hỏi!', 'ok');
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {render3DIcon(g.icon, "w-full h-full")}
                      </div>
                      <div>
                        <div className="font-bold text-sm dark:text-slate-200">{g.name}</div>
                        <div className="text-[10px] text-slate-500">{g.questions.length} câu hỏi</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> AI Sinh Câu Hỏi</h3>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <textarea 
                id="aiPrompt"
                className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium outline-none focus:border-indigo-400 resize-none mb-4 dark:text-slate-200"
                placeholder="Nhập chủ đề hoặc dán văn bản để AI ra đề..."
              />
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Số lượng:</label>
                <input type="number" id="aiCount" defaultValue="5" min="1" max="10" className="w-16 p-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-center text-sm font-bold outline-none dark:bg-slate-900 dark:text-slate-100" />
              </div>
              <button 
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-md transition-all"
                onClick={async () => {
                  const prompt = (document.getElementById('aiPrompt') as HTMLTextAreaElement).value.trim();
                  const count = parseInt((document.getElementById('aiCount') as HTMLInputElement).value) || 5;
                  if (!prompt) return showToast('Nhập nội dung!', 'err');
                  
                  showToast('Đang tạo...', 'info');
                  try {
                    const res = await callGeminiAPI(
                      [{ parts: [{ text: `Tạo ${count} câu hỏi trắc nghiệm về: ${prompt}` }] }],
                      `Bạn là hệ thống tạo câu hỏi giáo dục. Trả về CHUẨN JSON mảng các object: [{"q":"Câu hỏi", "opts":["A","B","C","D"], "ans":0}]`,
                      "application/json"
                    );
                    const qs = JSON.parse(res);
                    setQuestions(prev => [...prev, ...qs.map((q: any) => ({ ...q, qType: 'mcq' }))]);
                    setShowAiModal(false);
                    showToast('Đã tạo xong!', 'ok');
                  } catch (e: any) {
                    showToast(e.message, 'err');
                  }
                }}
              >
                <Zap className="w-4 h-4" /> Tạo Nhanh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
