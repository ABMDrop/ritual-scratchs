"use client";
import { useEffect, useRef, useState } from 'react';

export interface ToastData { title: string; body: string; error?: boolean; }

export function Toast({ toast, onClear }: { toast: ToastData | null; onClear: () => void }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast) { setVisible(false); return; }
    setVisible(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setVisible(false); setTimeout(onClear, 420); }, 5000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [toast]);

  if (!toast) return null;
  return (
    <div className={`tx-toast${toast.error ? ' error' : ''}${visible ? ' show' : ''}`}>
      <div className="tx-toast-title">{toast.title}</div>
      <div className="tx-toast-body">{toast.body}</div>
    </div>
  );
}
