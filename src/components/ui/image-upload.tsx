'use client';

import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function ImageUpload({
  value,
  onChange,
  label,
  uploadLabel = 'Upload image',
  removeLabel = 'Remove',
  className,
  previewClassName,
}: {
  value?: string;
  onChange: (next: string) => void;
  label?: string;
  uploadLabel?: string;
  removeLabel?: string;
  className?: string;
  previewClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn('grid gap-3', className)}>
      {label && <p className="text-sm font-semibold text-slate-700">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          <img src={value} alt="" className={cn('h-20 w-20 rounded-lg border border-slate-200 object-cover', previewClassName)} />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
            <ImagePlus size={20} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            {uploadLabel}
          </Button>
          {value && (
            <Button type="button" variant="outline" size="sm" onClick={() => onChange('')}>
              <X size={14} />
              {removeLabel}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
