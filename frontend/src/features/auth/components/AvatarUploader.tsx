"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Camera, Crop, RotateCcw, UserRound, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function AvatarUploader({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const id = ++request.current;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
    if (file.size > 2 * 1024 * 1024) return setError("Ảnh đại diện không được vượt quá 2 MB.");
    setLoading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new window.Image();
      image.src = url;
      await image.decode();
      if (id === request.current) setSource(image);
    } catch {
      if (id === request.current) setError("Không thể đọc ảnh. Vui lòng chọn một tệp ảnh khác.");
    } finally {
      URL.revokeObjectURL(url);
      if (id === request.current) setLoading(false);
    }
  }

  return <div className="space-y-3">
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:text-left">
      <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-blue-100 text-blue-600 shadow-sm">
        {value ? <Image src={value} alt="Ảnh đại diện" fill unoptimized className="object-cover" /> : <UserRound className="h-10 w-10" />}
      </div>
      <div className="text-center sm:text-left">
        <p className="font-bold text-slate-900">Ảnh đại diện</p>
        <p className="mb-3 mt-1 text-xs leading-5 text-slate-500">JPG, PNG hoặc WebP, tối đa 2 MB.<br />Cắt ảnh vuông trước khi lưu hồ sơ.</p>
        <Button variant="outline" size="sm" onClick={() => input.current?.click()} isLoading={loading} leftIcon={<Camera className="h-4 w-4" />}>Thay ảnh đại diện</Button>
        <input ref={input} aria-label="Chọn ảnh đại diện" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectFile} />
      </div>
    </div>
    {error && <Alert variant="error">{error}</Alert>}
    {source && <AvatarCropDialog image={source} onCancel={() => setSource(null)} onApply={(cropped) => { onChange(cropped); setSource(null); }} />}
  </div>;
}

function AvatarCropDialog({ image, onCancel, onApply }: { image: HTMLImageElement; onCancel: () => void; onApply: (value: string) => void }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom;

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 512, 512);
    context.drawImage(image, (image.naturalWidth - size) * position.x, (image.naturalHeight - size) * position.y, size, size, 0, 0, 512, 512);
  }, [image, position, size]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])');
      if (!controls?.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", keyboard); previous?.focus(); };
  }, [onCancel]);

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!pointer.current) return;
    const width = event.currentTarget.getBoundingClientRect().width;
    const dx = (event.clientX - pointer.current.x) / width * size;
    const dy = (event.clientY - pointer.current.y) / width * size;
    pointer.current = { x: event.clientX, y: event.clientY };
    setPosition((current) => ({
      x: Math.max(0, Math.min(1, current.x - dx / (image.naturalWidth - size || 1))),
      y: Math.max(0, Math.min(1, current.y - dy / (image.naturalHeight - size || 1))),
    }));
  }

  function apply() {
    if (!canvas.current?.getContext("2d")) return setError("Trình duyệt chưa hỗ trợ cắt ảnh. Vui lòng thử lại.");
    try { onApply(canvas.current.toDataURL("image/jpeg", 0.9)); }
    catch { setError("Không thể cắt ảnh. Vui lòng chọn lại ảnh."); }
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title" aria-describedby="avatar-crop-description" className="max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-xl sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="avatar-crop-title" className="flex items-center gap-2 text-lg font-bold text-slate-900"><Crop className="h-5 w-5 text-blue-600" />Cắt ảnh đại diện</h2>
        <button type="button" aria-label="Đóng công cụ cắt ảnh" onClick={onCancel} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </div>
      <p id="avatar-crop-description" className="mt-2 text-sm text-slate-500">Kéo ảnh hoặc dùng thanh điều chỉnh để chọn vùng ảnh vuông.</p>
      <canvas ref={canvas} width={512} height={512} aria-label="Xem trước vùng ảnh vuông" className="mx-auto mt-5 aspect-square w-full max-w-64 touch-none cursor-grab rounded-xl border border-blue-100 bg-blue-50 active:cursor-grabbing" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pointer.current = { x: event.clientX, y: event.clientY }; }} onPointerMove={move} onPointerUp={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }} />
      <div className="mt-5 space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Phóng to <span className="float-right text-blue-600">{zoom.toFixed(1)}×</span><input aria-label="Phóng to ảnh" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-1 w-full accent-blue-600" /></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-xs font-semibold text-slate-500">Vị trí ngang<input aria-label="Vị trí ngang" type="range" min="0" max="1" step="0.01" disabled={image.naturalWidth === size} value={position.x} onChange={(event) => setPosition({ ...position, x: Number(event.target.value) })} className="w-full accent-blue-600" /></label>
          <label className="block text-xs font-semibold text-slate-500">Vị trí dọc<input aria-label="Vị trí dọc" type="range" min="0" max="1" step="0.01" disabled={image.naturalHeight === size} value={position.y} onChange={(event) => setPosition({ ...position, y: Number(event.target.value) })} className="w-full accent-blue-600" /></label>
        </div>
      </div>
      <button type="button" onClick={() => { setZoom(1); setPosition({ x: 0.5, y: 0.5 }); }} className="mt-2 flex items-center gap-2 text-xs font-semibold text-blue-600"><RotateCcw className="h-4 w-4" />Đặt lại vị trí</button>
      {error && <Alert variant="error" className="mt-3">{error}</Alert>}
      <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4"><Button variant="outline" onClick={onCancel}>Hủy</Button><Button onClick={apply}>Dùng ảnh này</Button></div>
    </div>
  </div>;
}
