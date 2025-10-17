"use client"

import React, { useEffect, useRef, useState } from "react";

const BlackholeCursor = () => {
  const dotRef = useRef(null);
  const warpRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const warpPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const snapMetaRef = useRef({
    pageW: 0,
    pageH: 0,
    canvasW: 0,
    canvasH: 0,
    scale: 1,
  });
  const lensScaleRef = useRef(2.6);

  useEffect(() => {
    let cancel = false;
    const capture = async () => {
      try {
        const mod = await import("html2canvas");
        const html2canvas = mod.default || mod;
        const pageW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const pageH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        const scale = Math.min(2, window.devicePixelRatio || 1) * lensScaleRef.current / 1.6; // boost detail with lens scale
        const canvas = await html2canvas(document.body, {
          backgroundColor: null,
          scale,
          useCORS: true,
          logging: false,
          windowWidth: pageW,
          windowHeight: pageH,
        });
        if (cancel) return;
        setSnapshotUrl(canvas.toDataURL("image/png"));
        snapMetaRef.current = {
          pageW,
          pageH,
          canvasW: canvas.width,
          canvasH: canvas.height,
          scale,
        };
      } catch (e) {
        // Fallback silently if unavailable
        setSnapshotUrl(null);
      }
    };

    // Initial capture after first paint
    const t = setTimeout(capture, 200);

    // Recapture on resize (debounced)
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(capture, 300);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancel = true;
      clearTimeout(t);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMove, { passive: true });

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.35;
      pos.current.y += (target.current.y - pos.current.y) * 0.35;
      warpPos.current.x += (target.current.x - warpPos.current.x) * 0.12;
      warpPos.current.y += (target.current.y - warpPos.current.y) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x - 6}px, ${pos.current.y - 6}px, 0)`;
      }
      if (warpRef.current) {
        warpRef.current.style.transform = `translate3d(${warpPos.current.x - 24}px, ${warpPos.current.y - 24}px, 0)`;
        // Magnifier background follow
        if (snapshotUrl) {
          const { pageW, pageH, canvasW, canvasH, scale } = snapMetaRef.current;
          const lensScale = lensScaleRef.current;
          // Ensure we fully override any gradient background
          warpRef.current.style.background = `url(${snapshotUrl}) no-repeat`;
          warpRef.current.style.backgroundSize = `${canvasW}px ${canvasH}px`;
          const cx = window.scrollX + warpPos.current.x;
          const cy = window.scrollY + warpPos.current.y;
          const rectSize = 48; // warp size in CSS (px)
          const radius = rectSize / 2;
          const sx = (cx / pageW) * canvasW;
          const sy = (cy / pageH) * canvasH;
          const bx = -(sx - radius) * lensScale;
          const by = -(sy - radius) * lensScale;
          warpRef.current.style.backgroundPosition = `${bx}px ${by}px`;
          warpRef.current.style.backgroundSize = `${canvasW * lensScale}px ${canvasH * lensScale}px`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [snapshotUrl]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden>
      <div ref={warpRef} className="cursor-warp" />
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
};

export default BlackholeCursor;


