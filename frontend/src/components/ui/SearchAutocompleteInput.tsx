"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, Sparkles, CheckCircle2, ChevronRight, User, Briefcase, FileText, ArrowRight } from "lucide-react";
import { getSearchScore, highlightMatches, normalizeVietnamese } from "@/utils/vietnameseSearch";

export interface SuggestionOption {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  category_label?: string;
  score?: number;
  badge?: string;
  action_url?: string;
}

interface SearchAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: SuggestionOption) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  scope?: "global" | "users" | "requisitions" | "candidates" | "jobs" | "approval_flows";
  localSuggestions?: SuggestionOption[];
  size?: "sm" | "md" | "lg";
  autoFocus?: boolean;
}

export function SearchAutocompleteInput({
  value,
  onChange,
  onSelectSuggestion,
  onSubmit,
  placeholder = "Tìm kiếm...",
  className = "",
  scope = "global",
  localSuggestions,
  size = "md",
  autoFocus = false,
}: SearchAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query for remote suggestions
  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    // 1. Local suggestions mode
    if (localSuggestions && localSuggestions.length > 0) {
      const scored = localSuggestions
        .map((item) => {
          const s1 = getSearchScore(item.title, q);
          const s2 = item.subtitle ? getSearchScore(item.subtitle, q) : 0;
          const score = Math.max(s1, s2);
          const badge = score >= 80 ? "Khớp chính xác" : "Khớp gần đúng";
          return { ...item, score, badge };
        })
        .filter((entry) => (entry.score ?? 0) > 0);

      scored.sort((a, b) => (b.score || 0) - (a.score || 0));
      setSuggestions(scored.slice(0, 8));
      setIsOpen(scored.length > 0);
      setSelectedIndex(-1);
      return;
    }

    // 2. Remote API suggestions mode
    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        const res = await fetch(
          `/api/v1/search/suggestions?q=${encodeURIComponent(q)}&scope=${scope}&limit=8`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (res.ok) {
          const data: SuggestionOption[] = await res.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [value, scope, localSuggestions]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: SuggestionOption) => {
    onChange(item.title);
    setIsOpen(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && onSubmit) {
        onSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (onSubmit) {
        setIsOpen(false);
        onSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const heightClass = size === "sm" ? "h-9 text-xs" : size === "lg" ? "h-14 text-sm sm:text-base" : "h-12 text-xs sm:text-sm";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-5 h-5" : "w-4 h-4";
  const iconLeftPad = size === "sm" ? "pl-8" : size === "lg" ? "pl-12" : "pl-11";
  const iconLeftPos = size === "sm" ? "left-2.5" : size === "lg" ? "left-4" : "left-3.5";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative w-full flex items-center">
        <Search className={`${iconSize} text-slate-400 absolute ${iconLeftPos} pointer-events-none transition-colors group-focus-within:text-blue-600`} />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full ${heightClass} ${iconLeftPad} pr-10 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs`}
        />

        {/* Loading Spinner or Clear button */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Autocomplete Dropdown Popup */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Gợi ý đề xuất theo độ ưu tiên</span>
            </span>
            <span className="text-[10px] lowercase font-medium text-slate-400">
              {suggestions.length} kết quả
            </span>
          </div>

          {/* List items */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100/80 p-1">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isExact = (item.score ?? 0) >= 80;

              return (
                <div
                  key={item.id || idx}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-50/80 text-blue-900" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Category Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.category === "user" ? (
                        <User className="w-4 h-4" />
                      ) : item.category === "requisition" ? (
                        <FileText className="w-4 h-4" />
                      ) : item.category === "job" ? (
                        <Briefcase className="w-4 h-4" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold truncate flex items-center gap-2">
                        <span>{highlightMatches(item.title, value)}</span>
                        {item.category_label && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200/60">
                            {item.category_label}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Relevance Badge & Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isExact
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-sky-50 text-sky-700 border-sky-200"
                      }`}
                    >
                      {item.badge || (isExact ? "Khớp chính xác" : "Khớp gần đúng")}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-blue-600 translate-x-0.5" : "text-slate-300"}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer instruction */}
          <div className="px-4 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Dùng phím <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">↓</kbd> để chọn</span>
            <span>Nhấn <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">Enter</kbd> xác nhận</span>
          </div>
        </div>
      )}
    </div>
  );
}
