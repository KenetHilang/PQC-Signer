'use client';

import type { DragEvent, KeyboardEvent } from 'react';
import { useRef, useState } from 'react';

import { formatBytes } from '@/lib/formatters';

interface FileDropzoneProps {
  label: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
}

export default function FileDropzone({
  label,
  file,
  onFileSelect,
  accept = '*/*',
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);

  function openFilePicker() {
    if (!inputRef.current) {
      return;
    }
    // Reset input so selecting the same file still triggers onChange.
    inputRef.current.value = '';
    inputRef.current.click();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsOver(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) {
      onFileSelect(nextFile);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  }

  return (
    <div
      className={[
        'cursor-pointer rounded-[20px] border border-dashed px-5 py-5 transition md:px-6',
        isOver
          ? 'border-[rgba(214,107,45,0.48)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(214,107,45,0.09))] -translate-y-px'
          : 'border-[rgba(24,32,29,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,242,233,0.82))] hover:-translate-y-px hover:border-[rgba(214,107,45,0.48)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(214,107,45,0.09))]',
      ].join(' ')}
      onClick={openFilePicker}
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={accept}
        onChange={(event) => onFileSelect(event.target.files?.[0] || null)}
      />
      <p className="mb-2 text-[0.82rem] uppercase tracking-[0.14em] text-[color:var(--ink)]">{label}</p>
      {file ? (
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <strong>{file.name}</strong>
          <span className="text-sm text-[color:var(--muted)]">{formatBytes(file.size)}</span>
        </div>
      ) : (
        <p className="text-sm leading-6 text-[color:var(--muted)]">Drop a file here or click to browse.</p>
      )}
    </div>
  );
}
