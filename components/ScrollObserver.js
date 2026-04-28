"use client";

import { useEffect, useRef } from "react";

export default function ScrollObserver({ children }) {
  const observerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize IntersectionObserver
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active", "revealed");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px 0px 100px 0px",
      threshold: 0.01,
    });
    observerRef.current = observer;

    // 2. Setup MutationObserver to catch new elements (even after route changes)
    const scan = () => {
      const elements = document.querySelectorAll(".reveal:not(.active):not(.revealed)");
      elements.forEach((el) => {
        // Quick check: if already in viewport, show it immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("active", "revealed");
        } else {
          observer.observe(el);
        }
      });
    };

    const mutationObserver = new MutationObserver((mutations) => {
      if (mutations.some(m => m.addedNodes.length > 0)) {
        scan();
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Initial and repeated scans for safety
    scan();
    const intervalId = setInterval(scan, 1000); // Pulse check every second for missed elements

    // 3. Parallax Logic
    const handleScroll = () => {
      document.documentElement.style.setProperty("--scroll-y", window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      clearInterval(intervalId);
    };
  }, []); // Run only once on mount of layout

  return <>{children}</>;
}
