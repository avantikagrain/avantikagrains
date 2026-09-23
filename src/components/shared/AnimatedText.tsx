"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface AnimatedTextProps {
  text: string;
  className?: string;
  el?: React.ElementType;
}

export function AnimatedText({ text, className, el: Wrapper = "div" }: AnimatedTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Split text into words manually or use CSS/JS for word masking
    const words = containerRef.current.querySelectorAll(".word");
    
    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { autoAlpha: 0, y: 50, rotateX: -90 },
        {
          autoAlpha: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <Wrapper ref={containerRef} className={cn("perspective-1000", className)}>
      {text.split(" ").map((word, i) => (
        <span
          key={i}
          className="word inline-block origin-bottom transform-style-3d mr-[0.25em]"
        >
          {word}
        </span>
      ))}
    </Wrapper>
  );
}
