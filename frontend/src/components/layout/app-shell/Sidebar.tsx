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

function LeafLink({ item, active, onNavigate, nested }: { item: VisibleLeaf; active: boolean; onNavigate?: () => void; nested?: boolean }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg ${nested ? "pl-9 pr-2.5" : "px-2.5"} py-2 text-[13px] leading-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
        active ? "bg-blue-50 text-[#2563EB] font-semibold" : "text-[#334155] hover:bg-slate-100 hover:text-[#0F172A]"
      }`}
    >
      {!nested && <NavIcon name={item.icon} className={`w-4 h-4 shrink-0 ${active ? "text-[#2563EB]" : "text-[#64748B]"}`} />}
      <span className="truncate">{item.label}</span>
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
    <nav aria-label="Điều hướng chính" className="p-2.5 space-y-1">
      {groups.map((g) => {
        // "Tổng quan" is a single top-level link; every other module stays a collapsible group
        if (g.id === "overview" && g.items.length === 1 && !isSubgroup(g.items[0])) {
          const only = g.items[0];
          return <LeafLink key={g.id} item={{ ...only, label: only.label }} active={current === only.href} onNavigate={onNavigate} />;
        }
        const expanded = !!open[g.id];
        const panelId = `nav-${g.id}`;
        const hasActive = owner?.groupId === g.id;
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => toggle(g.id)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 ${
                hasActive ? "text-[#0F172A]" : "text-[#334155]"
              } hover:bg-slate-100`}
            >
              <NavIcon name={g.icon} className={`w-4 h-4 shrink-0 ${hasActive ? "text-[#2563EB]" : "text-[#64748B]"}`} />
              <span className="flex-1 text-left truncate">{g.label}</span>
              <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            <div id={panelId} hidden={!expanded} className="mt-0.5 space-y-0.5">
              {g.items.map((item) =>
                isSubgroup(item) ? (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-expanded={!!open[item.id]}
                      aria-controls={`nav-${item.id}`}
                      className="w-full flex items-center gap-2.5 rounded-lg pl-9 pr-2.5 py-2 text-[13px] text-[#334155] hover:bg-slate-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
                    >
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${open[item.id] ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    <div id={`nav-${item.id}`} hidden={!open[item.id]} className="space-y-0.5">
                      {item.children.map((c) => (
                        <div key={c.id} className="pl-3">
                          <LeafLink item={c} active={current === c.href} onNavigate={onNavigate} nested />
                        </div>
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
