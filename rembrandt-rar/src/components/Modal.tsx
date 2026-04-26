'use client';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20,
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--rar-text)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--rar-text-muted)',
              cursor: 'pointer', fontSize: 20, padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
