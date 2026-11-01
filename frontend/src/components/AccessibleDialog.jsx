'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function AccessibleDialog({ children, onClose, labelledBy, className }) {
  const ref = useRef(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    const cancel = event => { event.preventDefault(); close.current(); };
    dialog.addEventListener('cancel', cancel);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.removeEventListener('cancel', cancel);
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);
  return createPortal(<dialog ref={ref} aria-labelledby={labelledBy} className={className}
    onClick={event => { if (event.target === ref.current) {
      const box = ref.current.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close.current();
    } }}>{children}</dialog>, document.body);
}
