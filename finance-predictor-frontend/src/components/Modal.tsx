import type { ReactNode } from 'react';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-stone-500 hover:bg-stone-100"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
