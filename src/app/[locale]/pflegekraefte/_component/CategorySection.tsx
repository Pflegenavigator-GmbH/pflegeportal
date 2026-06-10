// src/app/[locale]/pflegekraefte/_component/CategorySection.tsx
// src/app/[locale]/pflegekraefte/_component/CategorySection.tsx
import type { LucideIcon } from 'lucide-react';

import type { Tool, ToolCategory } from '@/src/data/pflegekraefte.tools';

import { ToolCard } from './ToolCard';

type Props = {
  id: ToolCategory;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  tools: Tool[];
};

export function CategorySection({ id, label, icon: Icon, colorClass, tools }: Props) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <h2 className="flex items-center gap-2.5 border-b border-white/5 pb-2 text-xl font-bold">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
        <span className="text-xs font-normal text-gray-500 font-mono">
          ({tools.length} Einträge)
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} categoryLabel={label} categoryColor={colorClass} />
        ))}
      </div>
    </section>
  );
}
