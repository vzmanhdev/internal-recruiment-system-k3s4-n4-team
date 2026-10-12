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
  // Safe bounded page number
  const safePage = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)));

  // Generate range of pages with ellipsis support
  const paginationRange = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= Math.max(1, totalPages); i++) {
        pages.push(i);
      }
    } else {
      if (safePage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safePage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [totalPages, safePage]);

  // Compute item range indices
  const startIndex = totalItems !== undefined ? (safePage - 1) * itemsPerPage : 0;
  const endIndex =
    totalItems !== undefined ? Math.min(safePage * itemsPerPage, totalItems) : 0;

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100',
        className
      )}
    >
      {/* Information display */}
      {showItemCount && totalItems !== undefined && (
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị{' '}
          <span className="font-bold text-slate-900">
            {totalItems === 0 ? 0 : startIndex + 1}-{endIndex}
          </span>{' '}
          trên tổng số <span className="font-bold text-slate-900">{totalItems}</span> {itemLabel}
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end ml-auto">
        {/* Nút Trước (Previous) */}
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className={clsx(
            'px-3 py-1 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
            safePage <= 1 ? 'opacity-50 cursor-not-allowed hover:bg-white' : 'cursor-pointer'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Trước</span>
        </button>

        {/* Danh sách các số trang */}
        {paginationRange.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-slate-400 text-sm font-medium select-none"
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
                'min-w-[32px] px-3 py-1 border rounded-md text-sm font-medium transition-colors cursor-pointer text-center',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Nút Sau (Next) */}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className={clsx(
            'px-3 py-1 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
            safePage >= totalPages ? 'opacity-50 cursor-not-allowed hover:bg-white' : 'cursor-pointer'
          )}
        >
          <span>Sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
