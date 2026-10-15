'use client';

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, FileText, CheckCircle2, ArrowUpRight, BarChart2 } from 'lucide-react';

// Hardcoded mock data strictly per requirements (No backend modification or API calls)
const chartData = [
  { name: 'Tuần 36', cv: 25, closed: 2 },
  { name: 'Tuần 37', cv: 32, closed: 3 },
  { name: 'Tuần 38', cv: 28, closed: 1 },
  { name: 'Tuần 39', cv: 42, closed: 4 },
  { name: 'Tuần 40', cv: 39, closed: 2 },
  { name: 'Tuần 41 (Hiện tại)', cv: 48, closed: 5 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const cvValue = payload.find((p) => p.dataKey === 'cv')?.value || 0;
    const closedValue = payload.find((p) => p.dataKey === 'closed')?.value || 0;

    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 text-xs min-w-[200px] space-y-2.5 transition-all">
        <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Báo cáo tuần
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 shadow-xs" />
              <span>Lượng CV nộp:</span>
            </div>
            <span className="font-black text-blue-700 text-sm">{cvValue} CV</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span>Vị trí đóng:</span>
            </div>
            <span className="font-black text-emerald-600 text-sm">{closedValue} vị trí</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
          <span>Tỷ lệ lấp đầy:</span>
          <span className="text-emerald-600 font-bold">
            {((closedValue / (cvValue || 1)) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function RecruitmentComboChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCv = chartData.reduce((acc, curr) => acc + curr.cv, 0);
  const totalClosed = chartData.reduce((acc, curr) => acc + curr.closed, 0);

  return (
    <div className="bg-white/95 rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 space-y-6">
      {/* Header section with titles and metric pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs shrink-0">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Xu Hướng Tiếp Nhận CV & Vị Trí Đã Đóng
                <span className="hidden sm:inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200/60 uppercase tracking-wider">
                  Combo Chart
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                So sánh số lượng hồ sơ ứng tuyển (CV) và kết quả tuyển dụng hoàn tất (Closed) theo 6 tuần gần nhất
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-100/80">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
            <div className="text-[11px] text-slate-600 font-medium">
              Tổng CV: <strong className="text-blue-700 font-black">{totalCv}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-[11px] text-slate-600 font-medium">
              Đã đóng: <strong className="text-emerald-700 font-black">{totalClosed}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Container with strictly ResponsiveContainer width="100%" height={350} and ComposedChart */}
      <div className="w-full">
        {!mounted ? (
          <div className="h-[350px] w-full flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Đang tải biểu đồ xu hướng...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 10, left: -10 }}
            >
              <defs>
                <linearGradient id="cvGradientBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.75} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                dy={8}
              />

              {/* Left Y-Axis for CV Count */}
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                domain={[0, 60]}
                unit=" CV"
              />

              {/* Right Y-Axis for Closed Requisitions Count */}
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#059669', fontSize: 12, fontWeight: 600 }}
                domain={[0, 6]}
                unit=" VT"
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 20 }}
                formatter={(value: string) => {
                  if (value === 'cv') {
                    return (
                      <span className="text-xs font-bold text-slate-700 mr-4">
                        Lượng CV nộp (Trục trái)
                      </span>
                    );
                  }
                  if (value === 'closed') {
                    return (
                      <span className="text-xs font-bold text-emerald-700">
                        Vị trí đã đóng (Trục phải)
                      </span>
                    );
                  }
                  return value;
                }}
              />

              {/* Column Bar: CV received */}
              <Bar
                yAxisId="left"
                dataKey="cv"
                name="cv"
                fill="url(#cvGradientBar)"
                radius={[8, 8, 0, 0]}
                barSize={32}
                animationDuration={1000}
              />

              {/* Trend Line: Requisitions Closed */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="closed"
                name="closed"
                stroke="#10b981"
                strokeWidth={3.5}
                dot={{
                  r: 5,
                  fill: '#ffffff',
                  stroke: '#10b981',
                  strokeWidth: 2.5,
                }}
                activeDot={{
                  r: 7,
                  fill: '#10b981',
                  stroke: '#ffffff',
                  strokeWidth: 2.5,
                }}
                animationDuration={1200}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer insight note */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            Tuần 41 ghi nhận mức kỷ lục: <strong className="text-slate-800">48 hồ sơ ứng tuyển</strong> và{' '}
            <strong className="text-emerald-600">5 vị trí được đóng thành công</strong>.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Dữ liệu định kỳ cập nhật vào mỗi Thứ Hai
        </div>
      </div>
    </div>
  );
}
