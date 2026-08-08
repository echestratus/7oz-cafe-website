'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { SITE_NAV_ITEMS } from '@/components/layout/site-nav-items';
import { AccountNav } from '@/features/auth/components/account-nav';

interface MobileNavProps {
  tone?: 'overlay' | 'solid';
}

export function MobileNav({ tone = 'solid' }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOverlay = tone === 'overlay';

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const trigger = triggerRef.current;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  const triggerClass = isOverlay
    ? 'border-white/45 text-white hover:bg-white/10'
    : 'border-divider text-text hover:bg-surface-secondary';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${triggerClass}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {typeof document === 'undefined'
        ? null
        : createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  key="mobile-nav"
                  className="fixed inset-0 z-[90] lg:hidden"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                  />

                  <motion.nav
                    id={panelId}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))] shadow-[var(--shadow-soft)]"
                    initial={reduceMotion ? false : { x: '100%' }}
                    animate={{ x: 0 }}
                    exit={reduceMotion ? undefined : { x: '100%' }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="mb-8 flex items-center justify-between gap-4">
                      <p id={titleId} className="text-eyebrow">
                        Menu
                      </p>
                      <button
                        ref={closeRef}
                        type="button"
                        className="inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-full border border-divider text-text transition-colors duration-200 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        aria-label="Close menu"
                        onClick={() => setOpen(false)}
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
                      {SITE_NAV_ITEMS.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block rounded-[12px] px-3 py-3 text-lg font-medium text-text transition-colors duration-200 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            onClick={() => setOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 space-y-5 border-t border-border pt-6">
                      <AccountNav tone="solid" layout="stack" onNavigate={() => setOpen(false)} />
                      <Link
                        href="/reservations"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-divider px-5 py-3 text-nav text-text transition-colors duration-200 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        onClick={() => setOpen(false)}
                      >
                        Reserve
                      </Link>
                    </div>
                  </motion.nav>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )}
    </>
  );
}
