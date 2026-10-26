'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { siteContact } from '@/config/site';
import { buildWhatsappLink, quickChatMessage } from '@/lib/whatsapp';

interface QuickOption {
  label: string;
  context: string;
}

const OPTIONS: QuickOption[] = [
  { label: 'Product availability', context: 'Availability and pack sizes' },
  { label: 'Bulk / wholesale pricing', context: 'Bulk and wholesale pricing' },
  { label: 'Delivery and shipping', context: 'Delivery timelines and shipping' },
  { label: 'Order status', context: 'Status of a placed order' },
];

const HIDDEN_PREFIXES = ['/admin', '/checkout'];

export function WhatsappLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!siteContact.whatsappNumber) return null;
  if (HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return null;

  const generalLink = buildWhatsappLink({ message: quickChatMessage() });
  if (!generalLink) return null;

  return (
    <div
      className="fixed right-4 z-30 flex flex-col items-end gap-3"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Chat on WhatsApp"
          className="w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--hairline)] bg-[var(--bg-raised)] shadow-[var(--shadow-lift)]"
        >
          <div className="border-b border-[var(--hairline)] bg-[var(--bg-panel)] px-4 py-3">
            <p className="display text-h4 leading-tight">Chat with us</p>
            <p className="mt-0.5 text-micro text-[var(--fg-faint)]">
              {siteContact.businessHours}
            </p>
          </div>

          <ul className="p-2">
            {OPTIONS.map((option) => {
              const href = buildWhatsappLink({
                message: quickChatMessage(option.context),
              });
              if (!href) return null;
              return (
                <li key={option.label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-[var(--radius-control)] px-3 py-2.5 text-spec text-[var(--fg-muted)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--bg-sunken)] hover:text-[var(--accent)]"
                  >
                    {option.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-[var(--hairline)] p-2">
            <a
              href={generalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-[var(--radius-control)] px-3 py-2.5 text-spec font-medium text-[var(--accent)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--bg-sunken)]"
            >
              Something else
            </a>
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close WhatsApp chat options' : 'Chat with us on WhatsApp'}
        className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent)] text-[var(--color-cream-50)] shadow-[var(--shadow-lift)] transition-transform duration-[var(--t-fast)] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {open ? <X size={20} strokeWidth={1.8} /> : <MessageCircle size={21} strokeWidth={1.8} />}
      </button>
    </div>
  );
}
