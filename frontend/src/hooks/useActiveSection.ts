"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect the currently active section in the viewport using IntersectionObserver
 * with fallback to window scroll position calculations.
 * 
 * @param sectionIds Array of section HTML element IDs to track
 * @param offset Pixel offset from top (accounts for fixed/sticky header)
 * @returns Currently active section ID
 */
export function useActiveSection(sectionIds: string[], offset: number = 100): string {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] || "");

  useEffect(() => {
    if (typeof window === "undefined" || sectionIds.length === 0) return;

    // Helper: calculate active section based on scroll offset
    const checkScrollPosition = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 1. At the very top of page -> select first section
      if (scrollY < 100) {
        setActiveSection(sectionIds[0]);
        return;
      }

      // 2. Near bottom of page -> select last section
      if (scrollY + windowHeight >= documentHeight - 60) {
        setActiveSection(sectionIds[sectionIds.length - 1]);
        return;
      }

      // 3. Find the section whose top position is closest to or past the offset threshold
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Element has scrolled up to or past the offset line
          if (rect.top <= offset + 20) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    // Use IntersectionObserver with rootMargin tuned for sticky header
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: `-${Math.max(offset, 80)}px 0px -40% 0px`,
      threshold: [0, 0.2, 0.5, 0.8],
    };

    const sectionEntries = new Map<string, number>();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sectionEntries.set(entry.target.id, entry.intersectionRatio);
        } else {
          sectionEntries.delete(entry.target.id);
        }
      });

      // Find section with the highest intersection ratio
      let bestId = "";
      let highestRatio = -1;
      sectionEntries.forEach((ratio, id) => {
        if (ratio > highestRatio) {
          highestRatio = ratio;
          bestId = id;
        }
      });

      if (bestId) {
        setActiveSection(bestId);
      } else {
        checkScrollPosition();
      }
    }, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    // Throttled scroll listener for responsive updates during fast scrolling
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Check initially on mount
    checkScrollPosition();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [sectionIds.join(","), offset]);

  return activeSection;
}
