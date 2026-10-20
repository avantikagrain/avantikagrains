"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, X, User, ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

type HeaderTheme = "light" | "dark";

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<HeaderTheme>("dark"); // Default to dark background sections
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Scroll state
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();
    
    // Function to detect which theme section is under the header
    const updateTheme = () => {
      const elements = document.querySelectorAll("[data-header-theme]");
      if (elements.length === 0) return;
      
      const headerHeight = headerRef.current?.offsetHeight || 80;
      const detectY = headerHeight / 2; // Midpoint of header
      
      let currentTheme: HeaderTheme = "dark"; // fallback
      let found = false;
      
      for (let i = elements.length - 1; i >= 0; i--) {
        const rect = elements[i].getBoundingClientRect();
        // Check if the detectY line falls inside this element
        if (rect.top <= detectY && rect.bottom >= detectY) {
          const sectionTheme = elements[i].getAttribute("data-header-theme");
          if (sectionTheme === "light" || sectionTheme === "dark") {
            currentTheme = sectionTheme;
            found = true;
          }
          break;
        }
      }
      
      setTheme(currentTheme);
    };

    // Run on scroll and resize
    window.addEventListener("scroll", updateTheme, { passive: true });
    window.addEventListener("resize", updateTheme, { passive: true });
    
    // Polling handles React hydration/routing delays
    const intervalId = setInterval(updateTheme, 200);
    updateTheme(); // Initial immediate call

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", updateTheme);
      window.removeEventListener("resize", updateTheme);
      clearInterval(intervalId);
    };
  }, [pathname]);

  const navLinks = [
    { name: "Products", href: "/products" },
    { name: "Manufacturing", href: "/manufacturing" },
    { name: "Quality", href: "/quality" },
    { name: "About", href: "/about" },
  ];

  // Dynamic classes based on theme
  // If the mobile menu is open, the overlay is dark, so text must be light.
  const effectiveTheme = isMobileMenuOpen ? "dark" : theme;
  const isDarkTheme = effectiveTheme === "dark";
  
  const headerBgClass = isScrolled
    ? isDarkTheme && !isMobileMenuOpen
      ? "bg-brand-charcoal/90 backdrop-blur-md shadow-sm border-b border-brand-ivory/10"
      : isMobileMenuOpen ? "bg-transparent" : "bg-brand-ivory/90 backdrop-blur-md shadow-sm border-b border-brand-charcoal/10"
    : "bg-transparent";

  const textColorClass = isDarkTheme ? "text-brand-ivory" : "text-brand-charcoal";
  const hoverTextColorClass = isDarkTheme ? "hover:text-brand-gold" : "hover:text-brand-gold";
  
  const ctaClass = isDarkTheme
    ? "border-brand-ivory text-brand-ivory hover:bg-brand-ivory hover:text-brand-charcoal"
    : "border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-brand-ivory";

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out pointer-events-auto",
          headerBgClass,
          textColorClass
        )}
      >
      <div className="container mx-auto px-6 md:px-12 py-4 md:py-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="z-50 group"
        >
          <Logo className="group-hover:opacity-80 transition-opacity duration-300" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm tracking-wide uppercase transition-colors duration-300",
                  isActive ? "text-brand-gold" : hoverTextColorClass
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA & Icons */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/contact"
            className={cn(
              "px-6 py-2 border transition-all duration-300 uppercase text-sm tracking-wider",
              ctaClass
            )}
          >
            Let&apos;s Talk
          </Link>
          
          <div className="flex items-center gap-4 border-l border-brand-charcoal/20 pl-6 ml-2">
            <Link 
              href={isAuthenticated ? "/account" : "/account/login"}
              className={cn("transition-colors duration-300 flex items-center gap-2", hoverTextColorClass)}
              title={isAuthenticated ? "My Account" : "Login"}
            >
              <User className="w-5 h-5" />
              {isAuthenticated && user?.firstName && (
                <span className="text-sm font-medium">Hi, {user.firstName}</span>
              )}
            </Link>
            
            <Link 
              href="/cart"
              className={cn("relative transition-colors duration-300", hoverTextColorClass)}
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-gold text-brand-charcoal text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Icons & Menu Toggle */}
        <div className="flex md:hidden items-center gap-4 z-50">
          <Link 
            href="/cart"
            className={cn("relative p-1.5 transition-colors duration-300", hoverTextColorClass)}
            title="Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-gold text-brand-charcoal text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            className="p-1.5 transition-colors duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-brand-ivory" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </header>

    {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-brand-charcoal z-40 flex flex-col justify-center px-12 transition-transform duration-500 ease-in-out",
          isMobileMenuOpen ? "translate-y-0 pointer-events-auto" : "-translate-y-full pointer-events-none"
        )}
      >
        <nav className="flex flex-col gap-6">
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "font-serif text-3xl text-brand-ivory hover:text-brand-gold transition-all duration-500 transform",
                isMobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              )}
              style={{ transitionDelay: `${index * 80 + 200}ms` }}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-4 border-t border-brand-ivory/10 flex flex-col gap-4">
            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-serif text-2xl text-brand-gold hover:text-brand-ivory transition-colors flex items-center justify-between"
            >
              <span>Cart</span>
              <span className="text-xs uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-gold/20 text-brand-gold font-sans font-bold">
                {totalItems} {totalItems === 1 ? "Item" : "Items"}
              </span>
            </Link>

            <Link
              href={isAuthenticated ? "/account" : "/account/login"}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-serif text-2xl text-brand-ivory/80 hover:text-brand-gold transition-colors"
            >
              {isAuthenticated ? "My Account" : "Login / Register"}
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-serif text-2xl text-brand-gold hover:text-brand-ivory transition-colors mt-2"
            >
              Let&apos;s Talk
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
