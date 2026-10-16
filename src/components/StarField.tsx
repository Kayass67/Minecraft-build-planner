"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number; // in radians
  opacity: number;
  decay: number;
  color: string;
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Detect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Generate static stars
    const starCount = Math.min(220, Math.floor((width * height) / 8000));
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() < 0.8 ? Math.random() * 0.9 + 0.4 : Math.random() * 0.8 + 1.2,
        baseAlpha: Math.random() * 0.5 + 0.25,
        twinkleSpeed: Math.random() * 0.002 + 0.001,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Shooting stars state
    let activeShootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();
    let nextShootingStarInterval = 10000 + Math.random() * 15000; // 10-25s

    const spawnShootingStar = () => {
      if (prefersReducedMotion) return;
      if (activeShootingStars.length >= 2) return;

      const startX = Math.random() * (width * 0.8) + width * 0.1;
      const startY = Math.random() * (height * 0.4);
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.3; // ~45 degrees diagonal

      activeShootingStars.push({
        x: startX,
        y: startY,
        length: 80 + Math.random() * 70,
        speed: 12 + Math.random() * 8,
        angle,
        opacity: 0.9,
        decay: 0.012 + Math.random() * 0.008,
        color: Math.random() > 0.3 ? "#38bdf8" : "#c084fc", // Cyan or soft purple glow
      });
    };

    // Throttled scroll listener that occasionally chances a shooting star
    let lastScrollTrigger = 0;
    const handleScroll = () => {
      if (prefersReducedMotion) return;
      const now = Date.now();
      // Allow scroll to trigger a shooting star at most once every 12 seconds
      if (now - lastScrollTrigger > 12000) {
        lastScrollTrigger = now;
        spawnShootingStar();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Window resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Re-scatter any out of bounds stars
      for (const s of stars) {
        if (s.x > width) s.x = Math.random() * width;
        if (s.y > height) s.y = Math.random() * height;
      }
    };
    window.addEventListener("resize", handleResize);

    // Render loop
    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Draw starry points
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        let alpha = s.baseAlpha;

        if (!prefersReducedMotion) {
          // Gentle sinusoidal twinkle
          const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.25;
          alpha = Math.max(0.1, Math.min(0.95, s.baseAlpha + twinkle));
        }

        ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle faint cyan glow for larger stars
        if (s.radius > 1.3 && alpha > 0.5) {
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.2})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Check shooting star timer
      const now = Date.now();
      if (!prefersReducedMotion && now - lastShootingStarTime > nextShootingStarInterval) {
        lastShootingStarTime = now;
        nextShootingStarInterval = 12000 + Math.random() * 16000;
        spawnShootingStar();
      }

      // Draw & update shooting stars
      if (!prefersReducedMotion && activeShootingStars.length > 0) {
        activeShootingStars = activeShootingStars.filter((st) => {
          const dx = Math.cos(st.angle) * st.speed;
          const dy = Math.sin(st.angle) * st.speed;
          const tailX = st.x - Math.cos(st.angle) * st.length;
          const tailY = st.y - Math.sin(st.angle) * st.length;

          const gradient = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
          gradient.addColorStop(0, st.color);
          gradient.addColorStop(1, "transparent");

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.8;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          // Move
          st.x += dx;
          st.y += dy;
          st.opacity -= st.decay;

          return (
            st.opacity > 0 &&
            st.x - st.length < width &&
            st.y - st.length < height &&
            st.x > -st.length &&
            st.y > -st.length
          );
        });
      }

      // If reduced motion is preferred, render once and don't loop
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(0);
    } else {
      animationFrameId = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Rich nebula-like atmospheric backdrop */}
      <div className="absolute inset-0 bg-[#030712]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/60 via-slate-950 to-transparent blur-3xl mix-blend-screen" />
      <div className="absolute top-1/3 -right-20 w-[700px] h-[700px] opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/50 via-slate-950 to-transparent blur-3xl mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[600px] opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-transparent blur-3xl mix-blend-screen" />

      {/* Canvas for stars and occasional shooting stars */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
