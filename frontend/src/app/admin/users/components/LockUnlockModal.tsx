"use client";

import React, { useState } from "react";
import { Lock, Unlock, AlertTriangle, X } from "lucide-react";
import { UserItem } from "./types";

interface LockUnlockModalProps {
  isOpen: boolean;
  user: UserItem | null;
  mode: "lock" | "unlock";
  onClose: () => void;
  onConfirm: (userId: number, reason?: string) => void;
}

export function LockUnlockModal({
  isOpen,
  user,
  mode,
  onClose,
  onConfirm,
}: LockUnlockModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen || !user) return null;

  const isLockMode = mode === "lock";

  const handleAction = () => {
    onConfirm(user.id, reason);
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 ${
                isLockMode
                  ? "bg-rose-50 text-rose-600 border-rose-100"
                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
              }`}
            >
              {isLockMode ? (
                <Lock className="w-6 h-6" />
              ) : (
                <Unlock className="w-6 h-6" />
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
              {isLockMode ? "Xác nhận khóa tài khoản" : "Mở khóa tài khoản"}
            </h3>
            <div className="mt-2 text-xs text-slate-600 leading-relaxed">
              {isLockMode ? (
                <p>
                  Bạn có chắc chắn muốn khóa tài khoản{" "}
                  <span className="font-bold text-slate-900">{user.full_name}</span> (
                  <span className="font-mono text-slate-700">{user.email}</span>)?
                  <br />
                  <span className="font-semibold text-rose-600 mt-1 block">
                    Người dùng sẽ bị đăng xuất và mất quyền truy cập hệ thống ngay lập tức.
                  </span>
                </p>
              ) : (
                <p>
                  Bạn có chắc chắn muốn mở khóa tài khoản{" "}
                  <span className="font-bold text-slate-900">{user.full_name}</span>?
                  Sau khi mở khóa, người dùng có thể đăng nhập và tiếp tục thao tác bình thường.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reason for locking */}
        {isLockMode && (
          <div className="px-6 pb-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lý do khóa tài khoản (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Chuyển công tác, Bàn giao nhân sự, Tạm nghỉ..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleAction}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95 ${
              isLockMode
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
            }`}
          >
            {isLockMode ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa tài khoản ngay</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở khóa tài khoản</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
