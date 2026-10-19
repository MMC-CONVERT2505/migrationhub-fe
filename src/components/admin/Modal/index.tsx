import React, { useEffect, useId, useRef } from 'react';
import { motion } from 'framer-motion';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Wider dialog for forms. */
  size?: 'md' | 'lg';
  /** Ignore Escape / backdrop clicks (e.g. while a request is in flight). */
  locked?: boolean;
}

/** Accessible dialog: role="dialog", labelled, closes on Escape / backdrop, keeps focus inside. */
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = 'md', locked = false }) => {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    // Land on the first control inside, else the dialog itself.
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus], input, select, textarea, button:not([data-close])');
    (first ?? panel.current)?.focus();
    return () => { (previouslyFocused.current as HTMLElement | null)?.focus?.(); };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !locked) { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-black/40" onClick={() => !locked && onClose()} aria-hidden="true" />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${size === 'lg' ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto focus:outline-none`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 id={titleId} className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            disabled={locked}
            aria-label="Close"
            className="text-text-secondary hover:text-text-primary disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
};
