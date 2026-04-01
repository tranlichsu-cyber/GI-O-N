import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Download, 
  Key, 
  ChevronDown, 
  Trash2, 
  CheckCircle, 
  Sparkles, 
  Eraser, 
  BookOpenText,
  Bold,
  Italic,
  Underline,
  FileUp,
  FileCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { callGeminiAPI } from '../services/gemini';
import * as mammoth from 'mammoth';

const libraryLessonsList = ["Đọc to nghe chung", "Cùng đọc", "Đọc cặp đôi", "Đọc cá nhân", "Viết, vẽ về sách", "Sắm vai", "Giới thiệu sách", "Nội quy thư viện"];

const curriculumData: any = {
  "Lớp 1": { 
    "Tiếng Việt": { "Mở đầu": ["Bài 1: Các nét cơ bản", "Bài 2: a, c", "Bài 3: b, d, đ"], "Chủ đề 1: Làm quen": ["Bài 4: e, ê", "Bài 5: g, h"] }, 
    "Toán": { "Chủ đề 1: Các số đến 10": ["Bài 1: Các số 1, 2, 3", "Bài 2: Các số 4, 5, 6", "Bài 3: Các số 7, 8, 9", "Bài 4: Số 0"] } 
  },
  "Lớp 2": { 
    "Tiếng Việt": { "Chủ đề 1: Em lớn lên từng ngày": ["Bài 1: Cuộc sống quanh em", "Bài 2: Thời gian của em", "Bài 3: Bạn của em"] }, 
    "Toán": { "Chủ đề 1: Ôn tập lớp 1": ["Ôn tập các số đến 100", "Ôn tập phép cộng, phép trừ"] } 
  },
  "Lớp 3": { 
    "Tiếng Việt": { "Chủ đề 1: Chào năm học mới": ["Bài 1: Ngày khai trường", "Bài 2: Lễ chào cờ đặc biệt", "Bài 3: Bạn mới"] }, 
    "Toán": { "Chủ đề 1: Ôn tập lớp 2": ["Ôn tập các số trong phạm vi 1000"] } 
  },
  "Lớp 4": { 
    "Tiếng Việt": { "Chủ đề 1: Tuổi nhỏ chí lớn": ["Bài 1: Chân dung của em", "Bài 2: Những tài năng nhí", "Bài 3: Ước mơ của em"], "Chủ đề 2: Chăm ngoan, học giỏi": ["Bài 4: Văn hay chữ tốt", "Bài 5: Bài học đầu tiên"] }, 
    "Toán": { "Chủ đề 1: Số tự nhiên": ["Ôn tập các số đến 100 000", "Các số có sáu chữ số", "Hàng và lớp"], "Chủ đề 2: Phép cộng, phép trừ": ["Phép cộng các số tự nhiên", "Phép trừ các số tự nhiên"] },
    "Đạo đức": { "Chủ đề 1: Biết ơn người lao động": ["Bài 1: Biết ơn người lao động"], "Chủ đề 2: Cảm thông, giúp đỡ người gặp khó khăn": ["Bài 2: Cảm thông, giúp đỡ người gặp khó khăn"], "Chủ đề 3: Yêu lao động": ["Bài 3: Em yêu lao động"], "Chủ đề 4: Tôn trọng tài sản của người khác": ["Bài 4: Tôn trọng tài sản của người khác"], "Chủ đề 5: Bảo vệ của công": ["Bài 5: Bảo vệ của công"], "Chủ đề 6: Thiết lập và duy trì quan hệ bạn bè": ["Bài 6: Thiết lập quan hệ bạn bè", "Bài 7: Duy trì quan hệ bạn bè"], "Chủ đề 7: Quý trọng đồng tiền": ["Bài 8: Quý trọng đồng tiền"], "Chủ đề 8: Quyền và bổn phận của trẻ em": ["Bài 9: Quyền và bổn phận của trẻ em"] },
    "Khoa học": { "Chủ đề 1: Chất": ["Bài 1: Tính chất và vai trò của nước", "Bài 2: Sự chuyển thể của nước", "Bài 3: Ô nhiễm và bảo vệ nguồn nước", "Bài 4: Không khí"], "Chủ đề 2: Năng lượng": ["Bài 5: Ánh sáng", "Bài 6: Âm thanh", "Bài 7: Nhiệt"], "Chủ đề 3: Thực vật và động vật": ["Bài 8: Nhu cầu sống của thực vật", "Bài 9: Nhu cầu sống của động vật", "Bài 10: Chuỗi thức ăn"], "Chủ đề 4: Nấm": ["Bài 11: Nấm"], "Chủ đề 5: Con người và sức khoẻ": ["Bài 12: Chế độ dinh dưỡng", "Bài 13: Thực phẩm an toàn"] },
    "Lịch sử và Địa lí": { "Mở đầu": ["Bài 1: Làm quen với phương tiện học tập môn Lịch sử và Địa lí", "Bài 2: Lịch sử và Địa lí địa phương"], "Chủ đề 1: Vùng Trung du và miền núi Bắc Bộ": ["Bài 3: Thiên nhiên vùng Trung du và miền núi Bắc Bộ", "Bài 4: Dân cư, hoạt động sản xuất...", "Bài 5: Đền Hùng và Lễ giỗ Tổ Hùng Vương"], "Chủ đề 2: Vùng Đồng bằng Bắc Bộ": ["Bài 6: Thiên nhiên vùng Đồng bằng Bắc Bộ", "Bài 7: Dân cư, hoạt động sản xuất...", "Bài 8: Sông Hồng và văn minh sông Hồng", "Bài 9: Thăng Long - Hà Nội", "Bài 10: Văn Miếu - Quốc Tử Giám"], "Chủ đề 3: Vùng Duyên hải miền Trung": ["Bài 11: Thiên nhiên vùng Duyên hải miền Trung", "Bài 12: Dân cư, hoạt động sản xuất...", "Bài 13: Cố đô Huế", "Bài 14: Phố cổ Hội An"], "Chủ đề 4: Vùng Tây Nguyên": ["Bài 15: Thiên nhiên vùng Tây Nguyên", "Bài 16: Dân cư, hoạt động sản xuất...", "Bài 17: Không gian văn hóa Cồng chiêng Tây Nguyên"], "Chủ đề 5: Vùng Nam Bộ": ["Bài 18: Thiên nhiên vùng Nam Bộ", "Bài 19: Dân cư, hoạt động sản xuất...", "Bài 20: Thành phố Hồ Chí Minh", "Bài 21: Địa đạo Củ Chi"] }
  },
  "Lớp 5": { 
    "Tiếng Việt": { "Chủ đề 1: Trẻ em như búp trên cành": ["Bài 1: Quyền và bổn phận của trẻ em", "Bài 2: Trẻ em hôm nay, thế giới ngày mai"] }, 
    "Toán": { "Chủ đề 1: Ôn tập và bổ bật về phân số": ["Ôn tập về phân số", "Phân số thập phân"] },
    "Đạo đức": { "Chủ đề 1: Biết ơn những người có công với quê hương, đất nước": ["Bài 1: Biết ơn những người có công với quê hương, đất nước"], "Chủ đề 2: Tôn trọng sự khác biệt của người khác": ["Bài 2: Tôn trọng sự khác biệt của người khác"], "Chủ đề 3: Vượt qua khó khăn": ["Bài 3: Vượt qua khó khăn"], "Chủ đề 4: Bảo vệ cái đúng, cái tốt": ["Bài 4: Bảo vệ cái đúng, cái tốt"], "Chủ đề 5: Bảo vệ môi trường sống": ["Bài 5: Bảo vệ môi trường sống"], "Chủ đề 6: Lập kế hoạch cá nhân": ["Bài 6: Lập kế hoạch cá nhân"], "Chủ đề 7: Phòng, tránh bạo lực học đường": ["Bài 7: Phòng, tránh bạo lực học đường"], "Chủ đề 8: Quản lí tiền": ["Bài 8: Sử dụng tiền hợp lí"] },
    "Khoa học": { "Chủ đề 1: Chất": ["Bài 1: Đất và đá", "Bài 2: Hỗn hợp và dung dịch", "Bài 3: Sự biến đổi hóa học"], "Chủ đề 2: Năng lượng": ["Bài 4: Năng lượng mặt trời, gió và nước chảy", "Bài 5: Năng lượng điện", "Bài 6: Năng lượng chất đốt"], "Chủ đề 3: Thực vật và động vật": ["Bài 7: Sự sinh sản của thực vật", "Bài 8: Sự sinh sản của động vật", "Bài 9: Vòng đời của động vật"], "Chủ đề 4: Vi khuẩn": ["Bài 10: Vi khuẩn"], "Chủ đề 5: Con người và sức khoẻ": ["Bài 11: Nam và nữ", "Bài 12: Sự sinh sản và tuổi dậy thì", "Bài 13: Chăm sóc sức khoẻ", "Bài 14: Phòng tránh bệnh lây truyền"], "Chủ đề 6: Môi trường và tài nguyên thiên nhiên": ["Bài 15: Môi trường", "Bài 16: Tài nguyên thiên nhiên", "Bài 17: Tác động của con người đến môi trường"] },
    "Lịch sử và Địa lí": { "Mở đầu": ["Bài 1: Việt Nam - Đất nước chúng ta"], "Chủ đề 1: Đất nước và con người Việt Nam": ["Bài 2: Địa hình và khoáng sản", "Bài 3: Khí hậu và sông ngòi", "Bài 4: Đất và rừng", "Bài 5: Dân cư và các dân tộc", "Bài 6: Nông nghiệp, lâm nghiệp, thuỷ sản", "Bài 7: Công nghiệp, giao thông vận tải và thương mại"], "Chủ đề 2: Những quốc gia đầu tiên trên lãnh thổ Việt Nam": ["Bài 8: Nước Văn Lang, Âu Lạc", "Bài 9: Nước Phù Nam, Chăm-pa"], "Chủ đề 3: Xây dựng và bảo vệ đất nước": ["Bài 10: Khởi nghĩa Hai Bà Trưng...", "Bài 11: Chiến thắng Bạch Đằng...", "Bài 12: Thời Lý, Trần, Lê..."], "Chủ đề 4: Các nước láng giềng": ["Bài 13: Trung Quốc", "Bài 14: Lào và Cam-pu-chia"], "Chủ đề 5: Thế giới": ["Bài 15: Châu Á", "Bài 16: Châu Âu", "Bài 17: Châu Phi", "Bài 18: Châu Mỹ", "Bài 19: Châu Đại Dương và Châu Nam Cực", "Bài 20: Các đại dương trên thế giới"] }
  }
};

interface PlannerProps {
  showToast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
  hasApiKey: boolean;
  openKeySelector: () => void;
}

export default function Planner({ showToast, hasApiKey, openKeySelector }: PlannerProps) {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [specificLesson, setSpecificLesson] = useState('');
  const [period, setPeriod] = useState('Tiết 1');
  const [integrateAI, setIntegrateAI] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(false);
  const [oldLessonContent, setOldLessonContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isFileReading, setIsFileReading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsFileReading(true);
    showToast(`Đang đọc file: ${file.name}...`, "info");

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setOldLessonContent(result.value);
        showToast("Đã đọc nội dung file Word thành công!", "ok");
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setOldLessonContent(text);
        showToast("Đã đọc nội dung file văn bản thành công!", "ok");
      } else {
        showToast("Chỉ hỗ trợ file .docx hoặc .txt", "err");
        setUploadedFileName('');
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi đọc file!", "err");
      setUploadedFileName('');
    } finally {
      setIsFileReading(false);
    }
  };

  const removeUploadedFile = () => {
    setOldLessonContent('');
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const draft = localStorage.getItem('draft_lesson_plan');
    if (draft && editorRef.current) {
      editorRef.current.innerHTML = draft;
    }

    const interval = setInterval(() => {
      if (editorRef.current) {
        localStorage.setItem('draft_lesson_plan', editorRef.current.innerHTML);
        setAutoSaveStatus(true);
        setTimeout(() => setAutoSaveStatus(false), 2000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const topics = !subject 
    ? ["-- Không chọn --"]
    : (subject === 'Tiết đọc thư viện' 
      ? ["Hoạt động Thư viện"] 
      : (curriculumData[grade]?.[subject] ? Object.keys(curriculumData[grade][subject]) : ["Chủ đề 1", "Chủ đề 2", "Chủ đề 3", "Chủ đề 4", "Chủ đề 5"]));

  const lessons = !subject || !topic || topic === "-- Không chọn --"
    ? ["-- Không chọn --"]
    : (subject === 'Tiết đọc thư viện'
      ? libraryLessonsList
      : (curriculumData[grade]?.[subject]?.[topic] || ["Bài 1", "Bài 2", "Bài 3"]));

  useEffect(() => {
    setTopic(topics[0]);
  }, [grade, subject]);

  useEffect(() => {
    setSpecificLesson(lessons[0]);
  }, [topic, lessons]);

  const handleGenerate = async () => {
    const isValidLesson = specificLesson && specificLesson !== "-- Không chọn --";
    if (!uploadedFileName && !isValidLesson) return showToast("Vui lòng chọn Tên bài hoặc tải file giáo án cũ", "err");
    
    setIsLoading(true);
    
    const isLib = subject === 'Tiết đọc thư viện';
    const gradeText = grade || "(Không chọn khối)";
    const subjectText = subject || "(Không chọn môn)";
    const lessonText = isValidLesson ? specificLesson : "(Dựa theo file cũ)";
    const aiIntegrationPrompt = integrateAI ? `
    YÊU CẦU ĐẶC BIỆT LỒNG GHÉP:
    1. Tích hợp sâu sắc "Năng lực số" (Sử dụng Bảng mã chỉ báo năng lực số của BGDĐT, VD: 1.1.CB1a, 3.2.CB1a...) vào phần Yêu cầu cần đạt và Hoạt động.
    2. Tích hợp giáo dục Trí tuệ nhân tạo (AI) (Nhận biết, Ứng dụng, hoặc Đạo đức AI) vào tối thiểu 1 hoạt động Khám phá hoặc Vận dụng.
    3. Lồng ghép các chủ đề (Công dân số, Bảo vệ môi trường) một cách tự nhiên.
    4. BÔI ĐẬM và bôi nền vàng (class="highlight-ai") các nội dung tích hợp Năng lực số và AI để giáo viên dễ theo dõi.` : '';

    const isWholeWeek = oldLessonContent && !isValidLesson;

    const oldLessonPrompt = oldLessonContent ? `
    DỮ LIỆU GIÁO ÁN CŨ (NGUỒN DỮ LIỆU DUY NHẤT):
    Dưới đây là nội dung giáo án cũ của giáo viên. 
    NHIỆM VỤ BẮT BUỘC:
    ${isWholeWeek 
      ? `1. Bạn PHẢI soạn lại TOÀN BỘ các bài dạy, các môn học có trong file này (soạn cả tuần).
         2. Với MỖI bài dạy tìm thấy, hãy giữ nguyên cấu trúc và câu từ gốc.`
      : `1. Tìm đúng phần nội dung tương ứng với Môn: "${subjectText}", Khối: "${gradeText}", Bài: "${lessonText}", Tiết: "${period}" trong dữ liệu bên dưới.`
    }
    2. Nếu tìm thấy, bạn PHẢI BỎ QUA mọi kiến thức chuẩn của bạn về bài này và CHỈ DÙNG NỘI DUNG TRONG FILE.
    3. SAO CHÉP NGUYÊN VĂN 100% câu từ, đề mục, và cấu trúc hoạt động từ file cũ. KHÔNG ĐƯỢC tự ý tóm tắt hay viết lại theo ý bạn.
    4. Chỉ được CHÈN THÊM các nội dung tích hợp (Năng lực số, AI) vào các vị trí phù hợp mà không làm thay đổi văn bản gốc.
    5. Trình bày mỗi bài dạy trong một bảng <table> riêng biệt.
    
    NỘI DUNG GIÁO ÁN CŨ:
    ${oldLessonContent.substring(0, 200000)} // Tăng giới hạn lên 200k ký tự để hỗ trợ file cực dài
    ` : '';

    const structurePrompt = oldLessonContent 
      ? 'Sử dụng cấu trúc hoạt động của giáo án cũ trong file.' 
      : (isLib ? 'Chia 4 Hoạt động: Trước đọc, Trong đọc, Sau đọc, Mở rộng.' : 'Chia các Hoạt động: Khởi động, Khám phá, Luyện tập, Vận dụng.');

    const headerPrompt = isWholeWeek 
      ? '<h1>GIÁO ÁN CẢ TUẦN (DỰA THEO FILE CŨ)</h1>'
      : `<h1>GIÁO ÁN ${subjectText.toUpperCase()} ${gradeText.toUpperCase()}</h1><h2>TÊN BÀI: ${lessonText}</h2><p><strong>Tiết: ${period}</strong></p>`;

    const sysPrompt = `Bạn là Chuyên gia thiết kế Bài giảng Cấp Tiểu học theo Chương trình GDPT 2018 (sách Cánh Diều). Bối cảnh: Trường TH Lý Tự Trọng - Sông Công, Thái Nguyên. 
    CẤU TRÚC PHẢI CÓ: ${headerPrompt}
    ${structurePrompt}${aiIntegrationPrompt}${oldLessonPrompt} 
    QUY TẮC TỐI THƯỢNG: Khi có DỮ LIỆU GIÁO ÁN CŨ, file đó là nguồn tin cậy duy nhất. Bạn không được soạn theo kiến thức chung của mình mà phải trích xuất đúng nội dung từ file đó ra. Giữ nguyên từng dấu phẩy, dấu chấm của giáo viên.
    Nếu là soạn cả tuần, hãy liệt kê tất cả các bài dạy theo thứ tự trong file.
    Trả về CHỈ mã HTML nguyên bản, sử dụng thẻ <table> cho các hoạt động dạy học (Cột 1: Hoạt động của GV, Cột 2: Hoạt động của HS). KHÔNG dùng markdown block (\`\`\`html).`;

    try {
      const htmlStr = await callGeminiAPI([{ parts: [{ text: `Hãy soạn giáo án chi tiết cho bài: "${specificLesson}".` }] }], sysPrompt);
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlStr.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim();
      }
      showToast("Soạn giáo án thành công!", "ok");
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

  const exportToWord = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    if (!content.trim() || content.includes('Chọn thông tin')) {
      showToast("Chưa có nội dung để xuất!", "err");
      return;
    }
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>body{font-family: "Times New Roman", Times, serif; font-size: 14pt;} table{border-collapse: collapse; width: 100%;} th, td{border: 1px solid black; padding: 8px;} th{font-weight: bold; background-color: #f2f2f2;} h1,h2,h3{text-align: center;}</style></head><body>`;
    const postHtml = "</body></html>";
    const blob = new Blob(['\ufeff', preHtml + content + postHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GiaoAn_AI.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất file Word", "ok");
  };

  const clearEditor = () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ nội dung?")) return;
    if (editorRef.current) {
      editorRef.current.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-400 mt-32"><i data-lucide="eraser" class="w-10 h-10 mb-2 opacity-50"></i><p>Đã xóa nội dung bảng.</p></div>`;
    }
    localStorage.removeItem('draft_lesson_plan');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Điều khiển */}
        <div className="lg:col-span-4 space-y-6 no-print">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-base flex items-center gap-2 dark:text-slate-100">
                <BookOpen className="text-blue-500 w-5 h-5" /> Cấu hình bài dạy
              </h2>
              <div className="flex gap-1">
                <button 
                  onClick={exportToWord} 
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors" 
                  title="Tải Word"
                >
                  <Download className="w-3.5 h-3.5" /> Word
                </button>
              </div>
            </div>
            <div className="space-y-4 mb-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Khối Lớp</label>
                  <select 
                    value={grade} 
                    onChange={(e) => setGrade(e.target.value)} 
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-transparent rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none dark:text-slate-200"
                  >
                    <option value="">-- Không chọn --</option>
                    {["Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Môn học</label>
                  <select 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-transparent rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none dark:text-slate-200"
                  >
                    <option value="">-- Không chọn --</option>
                    {["Hoạt động trải nghiệm", "Toán", "Tiếng Việt", "Đạo đức", "Khoa học", "Lịch sử và Địa lí", "Tiết đọc thư viện"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Chủ đề / Tuần</label>
                <select 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-transparent rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none dark:text-slate-200"
                >
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Tên bài cụ thể</label>
                  <select 
                    value={specificLesson} 
                    onChange={(e) => setSpecificLesson(e.target.value)} 
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-transparent rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none dark:text-slate-200"
                  >
                    {lessons.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5">Số tiết / Tiết thứ</label>
                  <input 
                    type="text" 
                    value={period} 
                    onChange={(e) => setPeriod(e.target.value)} 
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-transparent rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none dark:text-slate-200" 
                    placeholder="VD: Tiết 1" 
                  />
                </div>
              </div>
              
              {/* Box Tích hợp AI */}
              <div className="p-4 bg-indigo-50/10 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={integrateAI} 
                    onChange={(e) => setIntegrateAI(e.target.checked)} 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                  />
                  <span className="text-sm font-bold text-indigo-500">Tích hợp Năng lực số & AI</span>
                </label>
                <p className="text-[11px] text-indigo-400 mt-1.5 ml-6 leading-relaxed">Tự động lồng ghép Mã chỉ báo (VD: 1.1.CB1a), Giáo dục AI, Công dân số vào các hoạt động Dạy học.</p>
              </div>

              {/* Upload Giáo án cũ */}
              <div className="p-4 bg-blue-50/10 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Giáo án cũ (Tham khảo)</label>
                  {uploadedFileName && (
                    <button onClick={removeUploadedFile} className="text-red-500 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                {!uploadedFileName ? (
                  <div 
                    onClick={() => !isFileReading && fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center cursor-pointer hover:bg-blue-50/50 transition-colors",
                      isFileReading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isFileReading ? (
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    ) : (
                      <FileUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    )}
                    <p className="text-[10px] font-bold text-blue-500 uppercase">
                      {isFileReading ? "Đang đọc file..." : "Tải lên file giáo án cũ (.docx, .txt)"}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 italic">AI sẽ đọc và giữ nguyên nội dung cũ của bạn</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept=".docx,.txt" 
                      className="hidden" 
                      disabled={isFileReading}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800">
                    <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 truncate">{uploadedFileName}</p>
                      <p className="text-[9px] text-blue-500">Đã sẵn sàng lồng ghép</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="w-full mt-6 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? "ĐANG XỬ LÝ..." : "SOẠN BÀI BẰNG AI"}</span>
            </button>
          </div>
        </div>

        {/* Khung hiển thị */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 editor-container flex flex-col relative overflow-hidden min-h-[650px]">
            <div className="border-b border-slate-100 dark:border-slate-700 p-2 flex items-center gap-1 bg-slate-50 dark:bg-slate-900">
              <button onClick={() => document.execCommand('bold')} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 transition-all"><Bold className="w-4 h-4" /></button>
              <button onClick={() => document.execCommand('italic')} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 transition-all"><Italic className="w-4 h-4" /></button>
              <button onClick={() => document.execCommand('underline')} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg text-slate-600 dark:text-slate-400 transition-all"><Underline className="w-4 h-4" /></button>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
              <span className={cn("text-[10px] text-slate-400 font-medium italic hidden md:inline ml-2 transition-opacity", autoSaveStatus ? "opacity-100" : "opacity-40")}>Tự động lưu...</span>
              <button onClick={clearEditor} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold ml-auto flex items-center gap-1.5 transition-all">
                <Eraser className="w-3.5 h-3.5" /> Xóa bảng
              </button>
            </div>
            
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex flex-col items-center justify-center text-center pt-10">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">AI đang xử lý...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Xin vui lòng đợi trong giây lát</p>
                {oldLessonContent.length > 30000 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-4 animate-pulse uppercase tracking-tighter">
                    File của bạn rất dài, AI sẽ cần thêm thời gian để đọc hết toàn bộ nội dung...
                  </p>
                )}
              </div>
            )}

            <div 
              ref={editorRef}
              contentEditable="true" 
              className="p-8 flex-grow outline-none prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm overflow-y-auto"
              suppressContentEditableWarning
            >
              <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-32">
                <BookOpenText className="w-12 h-12 mb-3 opacity-50" />
                <p>Chọn thông tin bên trái và nhấn "Soạn bài bằng AI"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
