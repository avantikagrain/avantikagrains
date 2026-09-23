"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface GrainParticlesProps {
  density?: number; // low, medium, high representation
}

export function GrainParticles({ density = 30 }: GrainParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Determine particle count based on screen size (responsive)
    const isMobile = width < 768;
    const numParticles = isMobile ? Math.floor(density / 2) : density;

    const particles: any[] = [];
    
    // Initialize particles
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1, // small grains
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5 + 0.1, // flowing slightly downwards
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p) => {
        // Draw grain (elliptical shape)
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius, p.radius * 1.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(227, 210, 166, ${p.opacity})`; // brand-wheat color
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Reset if out of bounds
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-10 opacity-70"
    />
  );
}
