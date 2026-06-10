// src/app/[locale]/pflegekraefte/_component/CategoryFilterBar.tsx
'use client';

import type { ToolCategory } from '@/src/data/pflegekraefte.tools';

type Props = {
  labels: Record<ToolCategory, string>;
  onJump: (id: ToolCategory) => void;
};

export function CategoryFilterBar({ labels, onJump }: Props) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
      {Object.entries(labels).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onJump(key as ToolCategory)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
