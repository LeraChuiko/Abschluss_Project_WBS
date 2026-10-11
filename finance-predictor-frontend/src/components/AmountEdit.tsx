import { useEffect, useRef, useState } from 'react';
import { euro, fieldClass } from '../lib/format.ts';

export function AmountEdit({
  value,
  onSave,
  canEdit = false,
  compact = false,
}: {
  value: number;
  onSave: (amount: number) => void;
  canEdit?: boolean;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(String(value));
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const amount = Number(text);
    setEditing(false);
    if (Number.isNaN(amount) || amount < 0) {
      setText(String(value));
      return;
    }
    if (amount === value) {
      return;
    }
    onSave(amount);
  };

  const box = compact ? 'min-w-20 w-20 pr-4' : 'min-w-28 w-28 pr-5';

  if (!editing) {
    return (
      <div className={`relative flex min-h-6 items-start ${box}`}>
        <p className={`shrink-0 tabular-nums ${compact ? 'w-20 text-sm' : 'w-28'}`}>{euro(value)}</p>
        {canEdit && (
          <button
            type="button"
            className="absolute top-0 right-0 hidden h-5 w-5 items-center justify-center rounded text-sm text-stone-400 group-hover/line:flex hover:bg-violet-50 hover:text-violet-700"
            aria-label="Bearbeiten"
            title="Bearbeiten"
            onClick={() => setEditing(true)}
          >
            ✎
          </button>
        )}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      className={`${fieldClass} py-1 tabular-nums ${compact ? 'w-20' : 'w-28'}`}
      type="number"
      min="0"
      step="0.01"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
        }
        if (e.key === 'Escape') {
          setText(String(value));
          setEditing(false);
        }
      }}
    />
  );
}
