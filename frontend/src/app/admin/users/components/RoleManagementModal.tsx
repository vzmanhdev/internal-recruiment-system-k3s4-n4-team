"use client";

import React, { useState, useEffect } from "react";
import { Shield, X, Check, AlertCircle } from "lucide-react";
import { UserItem, ROLE_DEFINITIONS } from "./types";

interface RoleManagementModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSave: (userId: number, updatedRoles: string[]) => void;
}

export function RoleManagementModal({
  isOpen,
  user,
  onClose,
  onSave,
}: RoleManagementModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles && user.roles.length > 0 ? [...user.roles] : [user.role || "candidate"]);
      setErrorMsg(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const toggleRole = (roleCode: string) => {
    setErrorMsg(null);
    if (selectedRoles.includes(roleCode)) {
      if (selectedRoles.length === 1) {
        setErrorMsg("Tài khoản phải duy trì ít nhất một vai trò hợp lệ trong hệ thống.");
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== roleCode));
    } else {
      setSelectedRoles([...selectedRoles, roleCode]);
    }
  };

  const handleSave = () => {
    if (selectedRoles.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất một vai trò.");
      return;
    }
    onSave(user.id, selectedRoles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Quản lý Vai trò (Multi-Role)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Gán hoặc thu hồi phân quyền cho nhân sự
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Brief Info */}
        <div className="px-6 py-4 bg-indigo-50/30 border-b border-indigo-100/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {user.full_name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">{user.full_name}</div>
              <div className="text-[11px] text-slate-500 font-medium">{user.email} • {user.employee_code}</div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full border border-indigo-200">
              {selectedRoles.length} vai trò đã gán
            </span>
          </div>
        </div>

        {/* Roles List */}
        <div className="p-6 space-y-3 max-h-[380px] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 font-medium mb-1">
            Chọn các vai trò áp dụng cho tài khoản này (có thể chọn nhiều vai trò cùng lúc):
          </p>

          <div className="space-y-2.5">
            {ROLE_DEFINITIONS.map((role) => {
              const isSelected = selectedRoles.includes(role.code);
              return (
                <div
                  key={role.code}
                  onClick={() => toggleRole(role.code)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {role.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${role.badgeClass}`}
                        >
                          {role.shortName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Lưu thay đổi vai trò</span>
          </button>
        </div>
      </div>
    </div>
  );
}
