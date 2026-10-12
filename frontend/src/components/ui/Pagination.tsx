'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
  showItemCount?: boolean;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 20,
  className = '',
  showItemCount = true,
  itemLabel = 'mục',
}: PaginationProps) {
  // Đảm bảo số trang hợp lệ
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.max(1, Math.min(currentPage, safeTotalPages));

  // Logic rút gọn số trang với dấu '...' nếu tổng số trang > 5
  const paginationRange = useMemo(() => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 5) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safePage <= 3) {
        pages.push(1, 2, 3, 4, '...', safeTotalPages);
      } else if (safePage >= safeTotalPages - 2) {
        pages.push(1, '...', safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', safeTotalPages);
      }
    }
    return pages;
  }, [safeTotalPages, safePage]);

  // Tính toán chỉ số hiển thị bản ghi
  const startIndex = totalItems !== undefined ? (safePage - 1) * itemsPerPage : 0;
  const endIndex =
    totalItems !== undefined ? Math.min(safePage * itemsPerPage, totalItems) : 0;

  return (
    <div
      className={clsx(
        showItemCount && totalItems !== undefined
          ? 'flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100'
          : 'flex justify-end items-center gap-2 mt-6',
        className
      )}
    >
      {/* Thông tin số lượng hiển thị (nếu có truyền totalItems) */}
      {showItemCount && totalItems !== undefined && (
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị{' '}
          <span className="font-bold text-slate-900">
            {totalItems === 0 ? 0 : startIndex + 1}-{endIndex}
          </span>{' '}
          trên tổng số <span className="font-bold text-slate-900">{totalItems}</span> {itemLabel}
        </div>
      )}

      {/* Điều khiển phân trang (Căn phải) */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Nút Trang trước (Previous) */}
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className={clsx(
            'px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 text-sm font-medium',
            safePage <= 1 ? 'opacity-50 cursor-not-allowed hover:bg-white' : 'cursor-pointer'
          )}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trang trước</span>
        </button>

        {/* Danh sách các số trang & Dấu ba chấm */}
        {paginationRange.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1.5 text-slate-400 text-sm font-medium select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === safePage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={clsx(
                'min-w-[36px] px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors text-center',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 cursor-default'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Nút Trang sau (Next) */}
        <button
          type="button"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
          className={clsx(
            'px-3 py-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 text-sm font-medium',
            safePage >= safeTotalPages ? 'opacity-50 cursor-not-allowed hover:bg-white' : 'cursor-pointer'
          )}
          aria-label="Trang sau"
        >
          <span className="hidden sm:inline">Trang sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
