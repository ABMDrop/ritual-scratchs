"use client";
interface ModalProps { open: boolean; icon: string; title: string; body: string; onClose: () => void; }

export function Modal({ open, icon, title, body, onClose }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal open">
      <div className="modal-box">
        <div className="modal-icon">{icon}</div>
        <div className="modal-title">{title}</div>
        <div className="modal-body">{body}</div>
        <button className="modal-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
