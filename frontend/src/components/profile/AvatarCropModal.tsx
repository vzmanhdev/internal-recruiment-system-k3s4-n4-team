"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  RotateCcw,
  RotateCw,
  RefreshCw,
  X,
  Info,
  Heart,
  Crop,
  ImageIcon,
  Move
} from "lucide-react";

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string | null;
  onSaveAvatar: (newAvatarUrl: string) => void;
  userName: string;
}

export function AvatarCropModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSaveAvatar,
  userName,
}: AvatarCropModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<"upload" | "presets">("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(
    currentAvatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop"
  );

  // Crop & Transform Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetAvatars = [
    { id: "1", bg: "bg-blue-600", initial: "Q" },
    { id: "2", bg: "bg-[#4285F4]", initial: "N" },
    { id: "3", bg: "bg-amber-600", initial: "T" },
    { id: "4", bg: "bg-teal-600", initial: "H" },
    { id: "5", bg: "bg-cyan-600", initial: "L" },
    { id: "6", bg: "bg-indigo-600", initial: "A" },
    { id: "7", bg: "bg-rose-600", initial: "M" },
    { id: "8", bg: "bg-purple-600", initial: "P" },
  ];

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      console.warn("File avatar vượt quá 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
        setZoomLevel(100);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Image Panning / Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleSave = () => {
    if (selectedImage) {
      onSaveAvatar(selectedImage);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Thay đổi ảnh đại diện</h3>
              <p className="text-xs text-slate-400">Tải ảnh hoặc, cắt và xem trước để cập nhật ảnh đại diện của bạn.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal 3-Column Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* COL 1: Upload Dropzone & Instructions (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            {/* Sub Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-px">
              <button
                onClick={() => setActiveSubTab("upload")}
                className={`pb-2 text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === "upload"
                    ? "border-[#4285F4] text-[#4285F4]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh lên</span>
              </button>

              <button
                onClick={() => setActiveSubTab("presets")}
                className={`pb-2 text-xs font-extrabold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === "presets"
                    ? "border-[#4285F4] text-[#4285F4]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🎨 Chọn mẫu có sẵn</span>
              </button>
            </div>

            {activeSubTab === "upload" ? (
              <div className="space-y-4">
                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 text-center space-y-3 transition-all ${
                    dragActive
                      ? "border-[#4285F4] bg-blue-50/50"
                      : "border-blue-200 bg-blue-50/20 hover:border-blue-400"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-[#4285F4] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-900">Kéo và thả ảnh vào đây</p>
                    <p className="text-[11px] text-slate-400 font-medium">hoặc</p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg, image/png, image/webp"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Chọn ảnh từ máy tính</span>
                  </button>

                  <p className="text-[10px] text-slate-400 font-medium pt-1">
                    Hỗ trợ: JPG, PNG, WEBP &bull; Tối đa 2MB
                  </p>
                </div>

                {/* Blue Requirement Box */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-[#4285F4]">
                    <Info className="w-4 h-4" />
                    <span>Yêu cầu ảnh đại diện:</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600 font-medium pl-1">
                    <li>&bull; Định dạng: JPG, PNG hoặc WEBP</li>
                    <li>&bull; Kích thước tối đa: 2MB</li>
                    <li>&bull; Sẽ được cắt ảnh theo tỷ lệ 1:1 (hình vuông)</li>
                    <li>&bull; Kéo rê chuột để di chuyển căn chỉnh vị trí ảnh</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Presets Grid */
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700">Chọn avatar ký tự màu mẫu:</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {presetAvatars.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#2563EB"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="90" font-weight="bold">${item.initial}</text></svg>`;
                        const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
                        setSelectedImage(dataUrl);
                        setPosition({ x: 0, y: 0 });
                      }}
                      className={`w-12 h-12 rounded-full ${item.bg} text-white font-extrabold text-lg flex items-center justify-center border-2 border-white shadow-xs hover:scale-110 transition-transform cursor-pointer mx-auto`}
                    >
                      {item.initial}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COL 2: Crop & Drag Canvas (5 cols) */}
          <div className="md:col-span-5 space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Crop className="w-4 h-4 text-[#4285F4]" />
                Cắt ảnh (tỷ lệ 1:1)
              </h4>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Move className="w-3 h-3 text-[#4285F4]" />
                Kéo giữ ảnh để di chuyển
              </span>
            </div>

            {/* Zoom Slider Bar */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-2xs">
              <span className="text-slate-400 text-[11px] whitespace-nowrap">Thu phóng</span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))}
                className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-extrabold cursor-pointer"
              >
                -
              </button>
              <input
                type="range"
                min="50"
                max="200"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4285F4]"
              />
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(200, prev + 10))}
                className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-extrabold cursor-pointer"
              >
                +
              </button>
              <span className="text-[11px] font-bold text-[#4285F4] w-10 text-right">{zoomLevel}%</span>
            </div>

            {/* Crop Overlay Canvas Frame with Interactive Mouse Drag */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-gray-200 shadow-inner select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {selectedImage && (
                <div
                  className="w-full h-full flex items-center justify-center transition-transform duration-75"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={selectedImage}
                    alt="Crop preview"
                    className="max-w-full max-h-full object-cover pointer-events-none"
                  />
                </div>
              )}

              {/* Square Crop Overlay Frame with Corners */}
              <div className="absolute inset-4 border-2 border-white/90 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.5)] pointer-events-none flex flex-col justify-between p-1">
                <div className="flex justify-between">
                  <div className="w-3 h-3 border-t-2 border-l-2 border-white"></div>
                  <div className="w-3 h-3 border-t-2 border-r-2 border-white"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-3 h-3 border-b-2 border-l-2 border-white"></div>
                  <div className="w-3 h-3 border-b-2 border-r-2 border-white"></div>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-gray-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Xoay trái</span>
              </button>

              <button
                type="button"
                onClick={handleRotateRight}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-gray-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Xoay phải</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-gray-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>

          {/* COL 3: Live Previews (3 cols) */}
          <div className="md:col-span-3 space-y-4 text-center">
            <div className="text-left space-y-0.5">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#4285F4]" />
                Xem trước
              </h4>
              <p className="text-[11px] text-slate-400">Ảnh sẽ hiển thị như bên dưới sau khi lưu.</p>
            </div>

            {/* Large Preview 128x128 */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center">
                {selectedImage && (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      transform: `translate(${position.x / 2}px, ${position.y / 2}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img src={selectedImage} alt="Preview 128" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-400">Ảnh đại diện (128 &times; 128)</span>
            </div>

            {/* Medium & Small Previews Row */}
            <div className="flex items-end justify-center gap-6 pt-2">
              <div className="space-y-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center">
                  {selectedImage && (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        transform: `translate(${position.x / 4}px, ${position.y / 4}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      }}
                    >
                      <img src={selectedImage} alt="Preview 64" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400">64 &times; 64</span>
              </div>

              <div className="space-y-1 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-slate-100 flex items-center justify-center">
                  {selectedImage && (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        transform: `translate(${position.x / 8}px, ${position.y / 8}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      }}
                    >
                      <img src={selectedImage} alt="Preview 32" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400">32 &times; 32</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-gray-200 hover:bg-slate-50 font-bold text-xs text-slate-700 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-7 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            Lưu ảnh đại diện
          </button>
        </div>

      </div>
    </div>
  );
}
