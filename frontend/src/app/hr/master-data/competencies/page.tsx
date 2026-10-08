'use client';

import React, { useState } from 'react';
import { 
  UserCheck, Plus, Search, Award, HelpCircle, Star, CheckCircle2, 
  Layers, BookOpen, ChevronRight
} from 'lucide-react';

interface CompetencyItem {
  id: string;
  code: string;
  name: string;
  category: 'Chuyên Môn' | 'Tư Duy & Kỹ Năng' | 'Văn Hóa & Thái Độ';
  weight: number; // %
  scale_description: Record<number, string>;
  questions: string[];
}

export default function HRCompetenciesPage() {
  const [competencies, setCompetencies] = useState<CompetencyItem[]>([
    {
      id: "COMP-01",
      code: "TECH-ARCH",
      name: "Tư Duy Thiết Kế Kiến Trúc Phần Mềm (Clean & System Design)",
      category: "Chuyên Môn",
      weight: 40,
      scale_description: {
        1: "Hiểu biết cơ bản về cấu trúc ứng dụng đơn giản",
        3: "Thiết kế được RESTful API và mô hình CSDL tối ưu",
        5: "Kiến trúc hệ thống Microservices quy mô lớn chịu tải cao"
      },
      questions: [
        "Hãy mô tả cách bạn xử lý khi hệ thống gặp nghẽn nút chai (bottleneck) CSDL?",
        "Bạn thiết kế chiến lược Caching (Redis/Memcached) như thế nào để đảm bảo tính nhất quán dữ liệu?"
      ]
    },
    {
      id: "COMP-02",
      code: "PROBLEM-SOLVING",
      name: "Kỹ Năng Giải Quyết Vấn Đề (Problem Solving)",
      category: "Tư Duy & Kỹ Năng",
      weight: 30,
      scale_description: {
        1: "Cần sự hỗ trợ của người khác khi gặp sự cố phức tạp",
        3: "Tự chủ phân tích nguyên nhân gốc rễ (Root Cause Analysis)",
        5: "Đề xuất giải pháp đột phá, phòng ngừa rủi ro tương lai"
      },
      questions: [
        "Kể về một sự cố hệ thống nghiêm trọng nhất bạn từng gặp và cách bạn khắc phục nó trong thời gian ngắn nhất?"
      ]
    },
    {
      id: "COMP-03",
      code: "CULTURE-FIT",
      name: "Độ Tương Thích Văn Hóa Doanh Nghiệp (Culture Fit)",
      category: "Văn Hóa & Thái Độ",
      weight: 30,
      scale_description: {
        1: "Khó thích nghi với văn hóa làm việc linh hoạt",
        3: "Chủ động hợp tác nhóm và tôn trọng sự đa dạng",
        5: "Lan tỏa tinh thần tích cực, dẫn dắt đội ngũ"
      },
      questions: [
        "Giá trị cốt lõi nào của bạn trùng khớp nhất với định hướng phát triển của công ty?"
      ]
    }
  ]);

  const [activeTab, setActiveTab] = useState<'framework' | 'questions'>('framework');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Khung Năng Lực & Ngân Hàng Câu Hỏi Phỏng Vấn</h1>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              [S6-07] Evaluation Framework
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cấu hình bộ năng lực chuẩn theo vị trí, thang điểm 1-5, trọng số % và ngân hàng câu hỏi đánh giá</p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Thêm Tiêu Chí Năng Lực</span>
        </button>
      </div>

      {/* Segmented Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button 
          onClick={() => setActiveTab('framework')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'framework' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Bộ Khung Năng Lực (Thang 1-5 & Trọng Số)
        </button>
        <button 
          onClick={() => setActiveTab('questions')}
          className={`pb-3 px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Ngân Hàng Câu Hỏi Phỏng Vấn Gợi Ý
        </button>
      </div>

      {/* Main List */}
      {activeTab === 'framework' ? (
        <div className="space-y-4">
          {competencies.map((comp) => (
            <div key={comp.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
                      {comp.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{comp.name}</h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Phân loại: <strong>{comp.category}</strong></div>
                </div>

                <div className="bg-blue-50 text-blue-700 font-extrabold text-xs px-3 py-1 rounded-full border border-blue-200">
                  Trọng số: {comp.weight}%
                </div>
              </div>

              {/* Rating Scale 1-5 */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mô Tả Thang Đánh Giá (1 - 5 Điểm)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-amber-700 block mb-0.5">⭐ Mức 1 Điểm (Cơ bản)</span>
                    <p className="text-slate-600 text-[11px]">{comp.scale_description[1]}</p>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                    <span className="font-bold text-blue-700 block mb-0.5">⭐⭐⭐ Mức 3 Điểm (Đạt chuẩn)</span>
                    <p className="text-slate-600 text-[11px]">{comp.scale_description[3]}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
                    <span className="font-bold text-emerald-700 block mb-0.5">⭐⭐⭐⭐⭐ Mức 5 Điểm (Xuất sắc)</span>
                    <p className="text-slate-600 text-[11px]">{comp.scale_description[5]}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Ngân Hàng Câu Hỏi Gợi Ý Theo Tiêu Chí</h2>
          <div className="space-y-3">
            {competencies.flatMap(c => c.questions.map((q, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3 text-xs">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">{q}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Thuộc tiêu chí: <strong>{c.name}</strong></span>
                </div>
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  );
}
