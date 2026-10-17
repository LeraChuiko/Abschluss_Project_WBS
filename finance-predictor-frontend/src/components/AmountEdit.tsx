import { useEffect, useRef, useState } from 'react';
import { euro, fieldClass } from '../lib/format.ts';

export function AmountEdit({
  value,
  onSave,
  canEdit = false,
  compact = false,
  name,
}: {
  value: number;
  onSave: (amount: number, title?: string) => void;
  canEdit?: boolean;
  compact?: boolean;
  name?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(value));
  const [nameText, setNameText] = useState(name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(String(value));
  }, [value]);

  useEffect(() => {
    setNameText(name ?? '');
  }, [name]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const cancel = () => {
    setText(String(value));
    setNameText(name ?? '');
    setEditing(false);
  };

  const commit = () => {
    const amount = Number(text);
    if (Number.isNaN(amount) || amount < 0) {
      cancel();
      return;
    }
    const nextTitle = name === undefined ? undefined : nameText.trim();
    if (nextTitle === '') {
      cancel();
      return;
    }
    setEditing(false);
    if (amount === value && (nextTitle === undefined || nextTitle === name)) {
      return;
    }
    onSave(amount, nextTitle);
  };

  const box = compact ? 'min-w-0 pr-4' : 'min-w-28 w-28 pr-5';
  const amountBox = compact ? 'text-sm' : 'w-28';

  if (!editing) {
    return (
      <div className={`relative flex min-h-6 min-w-0 items-start gap-2 ${name !== undefined ? 'flex-1' : box}`}>
        <p className={`shrink-0 tabular-nums ${amountBox}`}>{euro(value)}</p>
        {name !== undefined && (
          <p className="min-w-0 leading-tight font-medium break-words">{name}</p>
        )}
        {canEdit && (
          <button
            type="button"
            className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded text-sm text-stone-400 hover:bg-violet-50 hover:text-violet-700"
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

  const amountInput = (
    <input
      ref={inputRef}
      className={`${fieldClass} py-1 tabular-nums ${compact ? 'w-20' : 'w-28'} shrink-0`}
      type="number"
      min="0"
      step="0.01"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
        }
        if (e.key === 'Escape') {
          cancel();
        }
      }}
    />
  );

  if (name === undefined) {
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
            cancel();
          }
        }}
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className="flex min-w-0 flex-1 items-start gap-2"
      onBlur={(e) => {
        if (wrapRef.current?.contains(e.relatedTarget as Node)) {
          return;
        }
        commit();
      }}
    >
      {amountInput}
      <input
        className={`${fieldClass} min-w-0 flex-1 py-1`}
        value={nameText}
        maxLength={80}
        onChange={(e) => setNameText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
          }
          if (e.key === 'Escape') {
            cancel();
          }
        }}
      />
    </div>
  );
}
