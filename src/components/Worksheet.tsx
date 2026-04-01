import React, { useState, useRef } from 'react';
import { 
  ImagePlus, 
  Download, 
  UploadCloud, 
  X, 
  Wand2, 
  Eraser, 
  ScanLine 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { callGeminiAPI } from '../services/gemini';

interface WorksheetProps {
  showToast: (msg: string, type?: 'ok' | 'err' | 'info') => void;
  hasApiKey: boolean;
  openKeySelector: () => void;
}

export default function Worksheet({ showToast, hasApiKey, openKeySelector }: WorksheetProps) {
  const [wsImageBase64, setWsImageBase64] = useState<string | null>(null);
  const [wsImageMimeType, setWsImageMimeType] = useState<string | null>(null);
  const [wsTitle, setWsTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setWsImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setWsImageBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setWsImageBase64(null);
    setWsImageMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    const title = wsTitle.trim() || "PHIẾU BÀI TẬP";
    if (!wsImageBase64) return showToast("Vui lòng tải ảnh đề bài lên!", "err");
    
    setIsLoading(true);

    const prompt = `Bạn là công cụ số hóa tài liệu giáo dục. Nhiệm vụ: Đọc chữ trong ảnh được cung cấp và chuyển đổi thành Phiếu bài tập định dạng HTML đẹp mắt, CÓ THỂ TƯƠNG TÁC TRỰC TIẾP. 
    Yêu cầu BẮT BUỘC:
    - Header ghi: "Trường TH Lý Tự Trọng". Tiêu đề: "${title}".
    - Chèn 1 hình ảnh 3D minh hoạ bằng thẻ <img src="https://image.pollinations.ai/prompt/cute%203d%20cartoon%20school%20education%20[từ_khóa]?width=200&height=200&nologo=true"> ở đầu.
    - Bố cục dùng các class Tailwind như: bg-blue-50, rounded-xl, p-4.
    - THAY VÌ dùng dấu chấm (....) để điền, hãy BẮT BUỘC SỬ DỤNG thẻ <input type="text" class="border-b border-blue-500 outline-none bg-transparent w-32 px-2 text-center text-blue-700 font-bold">. 
    - Với trắc nghiệm, dùng <input type="radio" name="q1">.
    - Ở cuối phiếu, hãy thêm thẻ HTML sau: <div class="text-center mt-6"><button onclick="alert('Lưu kết quả thành công! Cô giáo sẽ chấm điểm cho em sau nhé.')" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl shadow-md">NỘP BÀI</button></div>
    - Trả về CHỈ mã HTML thuần túy. KHÔNG có \`\`\`.`;
    
    try {
      const htmlStr = await callGeminiAPI(
        [{ parts: [ { text: prompt }, { inlineData: { mimeType: wsImageMimeType!, data: wsImageBase64 } } ] }]
      );
      if (editorRef.current) {
        editorRef.current.innerHTML = `<div class="max-w-3xl mx-auto">${htmlStr.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim()}</div>`;
      }
      showToast("Tạo phiếu tương tác thành công!", "ok");
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
    if (!content.trim() || content.includes('Tải ảnh bài tập lên')) {
      showToast("Chưa có nội dung để xuất!", "err");
      return;
    }
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>body{font-family: "Times New Roman", Times, serif; font-size: 14pt;} table{border-collapse: collapse; width: 100%;} th, td{border: 1px solid black; padding: 8px;} th{font-weight: bold; background-color: #f2f2f2;} h1,h2,h3{text-align: center;}</style></head><body>`;
    const postHtml = "</body></html>";
    const blob = new Blob(['\ufeff', preHtml + content + postHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PhieuBaiTap_AI.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất file Word", "ok");
  };

  const clearEditor = () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ nội dung?")) return;
    if (editorRef.current) {
      editorRef.current.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-400 mt-32"><i data-lucide="scan-line" class="w-12 h-12 mb-3 opacity-50"></i><p>Tải ảnh bài tập lên và AI sẽ tạo phiếu tương tác cho học sinh.</p></div>`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6 no-print">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 relative">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-base flex items-center gap-2 dark:text-slate-100">
                <ImagePlus className="text-emerald-500 w-5 h-5" /> Trích xuất Phiếu
              </h2>
              <button 
                onClick={exportToWord} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Lưu Word
              </button>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Tải ảnh đề bài lên</label>
              <div className="relative w-full h-36 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group overflow-hidden flex items-center justify-center">
                <label htmlFor="wsImageUpload" className={cn("absolute inset-0 cursor-pointer flex flex-col items-center justify-center z-10", wsImageBase64 && "opacity-0")}>
                  <UploadCloud className="w-7 h-7 text-slate-400 mb-2 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-xs font-semibold text-slate-500">Nhấn để chọn ảnh</span>
                </label>
                {wsImageBase64 && (
                  <>
                    <img src={`data:${wsImageMimeType};base64,${wsImageBase64}`} className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-slate-900 z-0" alt="Preview" />
                    <button 
                      onClick={clearImage} 
                      className="absolute top-2 right-2 z-20 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <input 
                  ref={fileInputRef}
                  id="wsImageUpload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">Tiêu đề Phiếu</label>
              <input 
                type="text" 
                value={wsTitle}
                onChange={(e) => setWsTitle(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-transparent rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all dark:text-slate-200" 
                placeholder="VD: Phiếu Ôn Tập Cuối Tuần 5" 
              />
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isLoading ? "ĐANG XỬ LÝ..." : "BIẾN HOÁ THÀNH PHIẾU TƯƠNG TÁC"}</span>
            </button>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 editor-container flex flex-col relative overflow-hidden min-h-[650px]">
            <div className="border-b border-slate-100 dark:border-slate-700 p-2 flex items-center gap-1 bg-slate-50 dark:bg-slate-900">
              <button 
                onClick={clearEditor} 
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold ml-auto flex items-center gap-1.5 transition-all"
              >
                <Eraser className="w-3.5 h-3.5" /> Xóa bảng
              </button>
            </div>
            
            {isLoading && (
              <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex flex-col items-center justify-center text-center pt-10">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Đang nhận diện chữ và tạo form tương tác...</h3>
              </div>
            )}

            <div 
              ref={editorRef}
              className="p-8 flex-grow outline-none max-w-none text-slate-800 dark:text-slate-200 text-sm overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30"
            >
              <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-32">
                <ScanLine className="w-12 h-12 mb-3 opacity-50" />
                <p>Tải ảnh bài tập lên và AI sẽ tạo phiếu tương tác cho học sinh.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
