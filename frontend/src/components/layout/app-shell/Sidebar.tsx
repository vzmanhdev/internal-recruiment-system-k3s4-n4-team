"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { flattenHrefs, isSubgroup, visibleNavigation, type VisibleGroup, type VisibleLeaf } from "@/lib/auth/navigation";
import { useAuth } from "@/providers/auth-provider";
import { NavIcon } from "./NavIcon";

/** Longest visible href that is the current path or a parent of it. */
function activeHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const h of hrefs) {
    if ((pathname === h || pathname.startsWith(h + "/")) && (!best || h.length > best.length)) best = h;
  }
  return best;
}

function LeafLink({
  item,
  active,
  onNavigate,
  nested,
}: {
  item: VisibleLeaf;
  active: boolean;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] leading-snug transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
        active
          ? "bg-blue-100 text-blue-900 font-bold border-2 border-blue-400/80 shadow-xs translate-x-0.5"
          : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 hover:translate-x-0.5 font-medium border border-transparent"
      }`}
    >
      {nested ? (
        <span
          className={`w-2 h-2 rounded-full shrink-0 transition-all ${
            active ? "bg-blue-600 scale-125 ring-2 ring-blue-300" : "bg-slate-400 group-hover:bg-slate-600"
          }`}
          aria-hidden="true"
        />
      ) : (
        <NavIcon
          name={item.icon}
          className={`w-4 h-4 shrink-0 transition-colors ${
            active ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
          }`}
        />
      )}
      <span className="truncate flex-1 tracking-tight" title={item.label}>
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAccess, status } = useAuth();
  const groups: VisibleGroup[] = useMemo(() => (status === "authenticated" ? visibleNavigation(canAccess) : []), [canAccess, status]);
  const flat = useMemo(() => flattenHrefs(groups), [groups]);
  const current = activeHref(pathname, flat.map((f) => f.href));
  const owner = flat.find((f) => f.href === current);

  const [open, setOpen] = useState<Record<string, boolean>>({});
  // The group (and subgroup) holding the active page is always expanded.
  useEffect(() => {
    if (!owner) return;
    queueMicrotask(() =>
      setOpen((prev) => ({ ...prev, [owner.groupId]: true, ...(owner.subId ? { [owner.subId]: true } : {}) })),
    );
  }, [owner?.groupId, owner?.subId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  if (status === "loading") {
    return (
      <div className="p-3 space-y-2" aria-busy="true" aria-label="Đang tải menu">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <nav aria-label="Điều hướng chính" className="p-2 space-y-1.5">
      {groups.map((g) => {
        // "Tổng quan" is a single top-level link; every other module stays a collapsible group
        if (g.id === "overview" && g.items.length === 1 && !isSubgroup(g.items[0])) {
          const only = g.items[0];
          return (
            <div key={g.id} className="pb-1 mb-1 border-b border-slate-300">
              <LeafLink item={{ ...only, label: only.label }} active={current === only.href} onNavigate={onNavigate} />
            </div>
          );
        }
        const expanded = !!open[g.id];
        const panelId = `nav-${g.id}`;
        const hasActive = owner?.groupId === g.id;
        const isElevated = expanded || hasActive;
        return (
          <div
            key={g.id}
            className={`transition-all duration-200 rounded-2xl ${
              isElevated
                ? "bg-slate-100/90 border-2 border-slate-300 shadow-md p-2 my-2"
                : "border border-transparent hover:border-slate-300/80 p-0.5 my-1"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(g.id)}
              aria-expanded={expanded}
              aria-controls={panelId}
              title={g.label}
              className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-bold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                hasActive
                  ? "text-blue-900 bg-white border border-blue-300 shadow-xs"
                  : expanded
                  ? "text-slate-900 bg-white border border-slate-300 shadow-xs"
                  : "text-slate-800 bg-slate-100/95 border border-slate-200/90 shadow-2xs hover:bg-slate-200/80 hover:border-slate-300 hover:text-slate-900 hover:shadow-xs hover:-translate-y-0.5"
              }`}
            >
              <NavIcon
                name={g.icon}
                className={`w-4 h-4 shrink-0 transition-colors ${
                  hasActive || expanded ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                }`}
              />
              <span className="flex-1 text-left truncate tracking-tight">{g.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expanded ? "rotate-180 text-blue-600" : "text-slate-500"
                }`}
                aria-hidden="true"
              />
            </button>
            <div id={panelId} hidden={!expanded} className="ml-3 pl-2.5 border-l-2 border-slate-300 space-y-1.5 my-1.5">
              {g.items.map((item) =>
                isSubgroup(item) ? (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-expanded={!!open[item.id]}
                      aria-controls={`nav-${item.id}`}
                      title={item.label}
                      className={`w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-[12.5px] font-semibold transition-all duration-150 cursor-pointer ${
                        open[item.id]
                          ? "text-slate-900 bg-white border border-slate-200 shadow-2xs"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/70"
                      }`}
                    >
                      <span className="flex-1 text-left truncate tracking-tight">{item.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
                          open[item.id] ? "rotate-180 text-blue-600" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <div id={`nav-${item.id}`} hidden={!open[item.id]} className="ml-2 pl-2 border-l-2 border-slate-300/80 space-y-1 my-0.5">
                      {item.children.map((c) => (
                        <LeafLink key={c.id} item={c} active={current === c.href} onNavigate={onNavigate} nested />
                      ))}
                    </div>
                  </div>
                ) : (
                  <LeafLink key={item.id} item={item} active={current === item.href} onNavigate={onNavigate} nested />
                ),
              )}
            </div>
          </div>
        );
      })}
      {groups.length === 0 && <p className="px-2.5 py-3 text-xs text-[#64748B]">Chưa có chức năng nào được cấp quyền.</p>}
    </nav>
  );
}
