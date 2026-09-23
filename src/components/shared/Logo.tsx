import React from 'react';
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export function Logo({ className, variant = 'horizontal' }: LogoProps) {
  return (
    <div className={cn("flex items-center", variant === 'vertical' ? 'flex-col justify-center text-center' : 'flex-row gap-2.5', className)}>
      <svg
        width={variant === 'vertical' ? "72" : "42"}
        height={variant === 'vertical' ? "72" : "42"}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0 transition-colors duration-300", variant === 'vertical' ? 'mb-3' : '')}
      >
        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Leaves */}
        <path d="M40 95 C 30 70 20 60 25 45 C 30 65 35 80 44 95" fill="currentColor" fillOpacity="0.45" />
        <path d="M48 95 C 55 75 65 60 75 45 C 65 60 55 75 51 95" fill="currentColor" fillOpacity="0.45" />
        <path d="M45 95 C 40 80 45 65 52 55 C 48 70 48 85 47 95" fill="currentColor" fillOpacity="0.45" />

        {/* Stalk */}
        <path d="M45 96 C 40 60 55 35 75 25" stroke="currentColor" strokeWidth="2.5" fill="none" />
        
        {/* Grains top */}
        <ellipse cx="68" cy="26" rx="2.2" ry="5" transform="rotate(60 68 26)" fill="currentColor" />
        <ellipse cx="61" cy="27" rx="2.2" ry="5" transform="rotate(50 61 27)" fill="currentColor" />
        <ellipse cx="55" cy="29" rx="2.2" ry="5" transform="rotate(35 55 29)" fill="currentColor" />
        <ellipse cx="49" cy="33" rx="2.2" ry="5" transform="rotate(25 49 33)" fill="currentColor" />
        <ellipse cx="45" cy="38" rx="2.2" ry="5" transform="rotate(15 45 38)" fill="currentColor" />
        <ellipse cx="41" cy="45" rx="2.2" ry="5" transform="rotate(5 41 45)" fill="currentColor" />

        {/* Grains bottom */}
        <ellipse cx="71" cy="33" rx="2.2" ry="5" transform="rotate(60 71 33)" fill="currentColor" />
        <ellipse cx="65" cy="34" rx="2.2" ry="5" transform="rotate(45 65 34)" fill="currentColor" />
        <ellipse cx="59" cy="37" rx="2.2" ry="5" transform="rotate(35 59 37)" fill="currentColor" />
        <ellipse cx="54" cy="41" rx="2.2" ry="5" transform="rotate(25 54 41)" fill="currentColor" />
        <ellipse cx="49" cy="47" rx="2.2" ry="5" transform="rotate(15 49 47)" fill="currentColor" />
      </svg>
      <div className={cn("flex flex-col", variant === 'vertical' ? 'items-center' : 'items-start')}>
        <div className={cn("font-sans font-extrabold uppercase leading-[1.1] tracking-[0.08em] transition-colors duration-300", variant === 'vertical' ? 'text-xl md:text-2xl' : 'text-[0.9rem]')}>
          Avantika Grain Mills
        </div>
        <div className={cn("font-sans font-semibold uppercase tracking-[0.25em] opacity-75 transition-colors duration-300", variant === 'vertical' ? 'text-xs mt-1.5' : 'text-[0.55rem] mt-0.5')}>
          Private Limited
        </div>
      </div>
    </div>
  );
}
