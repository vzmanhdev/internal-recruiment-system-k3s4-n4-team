"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  X,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Check,
  Crop,
  Sparkles,
  RefreshCw,
  Eye
} from "lucide-react";
import { getCroppedImg, CroppedAvatarResult } from "@/lib/cropImage";

export interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropSave: (result: CroppedAvatarResult) => void;
}

export function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropSave,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [cropShape, setCropShape] = useState<"round" | "rect">("round");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropSave(result);
      onClose();
    } catch (error) {
      console.error("Lỗi khi xử lý cắt ảnh:", error);
    } finally {

      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* ========================================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold shadow-xs">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Chỉnh Sửa & Cắt Ảnh Đại Diện
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ lệ chuẩn 1:1 • Kéo để căn chỉnh tâm điểm và phóng to / xoay ảnh
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CROPPER VIEWPORT (KHUNG CẮT ẢNH) */}
        {/* ========================================================================= */}
        <div className="p-6 space-y-5">
          <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape={cropShape}
              showGrid={true}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropCompleteCallback}
              classes={{
                containerClassName: "rounded-2xl",
                cropAreaClassName:
                  cropShape === "round"
                    ? "border-2 border-[#4285F4] shadow-[0_0_0_9999px_rgba(15,23,42,0.7)]"
                    : "border-2 border-[#4285F4] shadow-[0_0_0_9999px_rgba(15,23,42,0.7)]",
              }}
            />

            {/* Shape Toggle Badge */}
            <div className="absolute top-3 left-3 z-10">
              <button
                type="button"
                onClick={() =>
                  setCropShape((prev) => (prev === "round" ? "rect" : "round"))
                }
                className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-[11px] font-medium border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Chuyển đổi chế độ xem Tròn / Vuông"
              >
                <Eye className="w-3 h-3 text-blue-300" />
                <span>
                  {cropShape === "round" ? "Xem dạng Tròn" : "Xem dạng Vuông"}
                </span>
              </button>
            </div>

            {/* Rotation Badge */}
            {rotation !== 0 && (
              <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-blue-500/80 text-white backdrop-blur-md text-[11px] font-bold">
                {rotation}°
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* EDIT TOOLS (CÔNG CỤ CHỈNH SỬA: ZOOM & ROTATE) */}
          {/* ========================================================================= */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-gray-100">
            {/* 1. Zoom Slider (Thu phóng) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-[#4285F4]" />
                  <span>Thu phóng (Zoom)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4285F4] focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Rotate Controls (Xoay 90 độ trái / phải) */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Xoay góc:
                </span>
                <button
                  type="button"
                  onClick={handleRotateLeft}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Xoay trái 90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleRotateRight}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Xoay phải 90°</span>
                </button>
              </div>

              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[#4285F4] hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Đặt lại ban đầu</span>
                </button>
              )}
            </div>
          </div>

          {/* Technical Specs Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              Ảnh xuất ra tự động gồm: <strong>Bản nét 500x500px</strong> và <strong>Bản thu nhỏ Header 150x150px</strong> tối ưu load.
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER ACTIONS */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            disabled={isProcessing || !croppedAreaPixels}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/25 cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý ảnh...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Cắt & Lưu</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
