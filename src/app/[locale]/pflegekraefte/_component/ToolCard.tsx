// src/app/[locale]/pflegekraefte/_component/ToolCard.tsx
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ExternalLink, FileCheck } from 'lucide-react';
import type { Tool } from '@/src/data/pflegekraefte.tools';

type Props = {
    tool: Tool;
    categoryLabel: string;
    categoryColor: string;
};

export function ToolCard({ tool, categoryLabel, categoryColor }: Props) {
    return (
        <Card className="flex flex-col justify-between border-white/10 bg-white/5 text-white shadow-xl">
            <CardHeader className="p-5 pb-3">
                <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-bold leading-tight text-white">{tool.name}</CardTitle>
                        <p className="mt-0.5 text-xs text-gray-400">Anbieter: {tool.provider}</p>
                    </div>

                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryColor}`}>
            {categoryLabel.split(' ')[0]}
          </span>
                </div>

                <CardDescription className="line-clamp-3 pt-1 text-xs leading-relaxed text-gray-300">
                    {tool.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 p-5 pt-0">
                <div className="space-y-1.5 border-t border-white/5 pt-3">
                    {tool.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs text-gray-400">
                            <FileCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#20b2aa]" />
                            <span className="truncate">{feature}</span>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
                    className="h-10 w-full rounded-xl bg-[#20b2aa] text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-[#3ddbd0]"
                >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Anwendung aufrufen
                </Button>
            </CardContent>
        </Card>
    );
}