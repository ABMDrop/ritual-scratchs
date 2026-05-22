"use client";

interface GlobalLoaderProps {
  show: boolean;
  msg?: string;
}

export function GlobalLoader({ show, msg = "LOADING PROFILE..." }: GlobalLoaderProps) {
  if (!show) return null;
  return (
    <div className="global-loader show">
      <div className="loader-spinner" />
      <div className="loader-text">{msg}</div>
    </div>
  );
}
