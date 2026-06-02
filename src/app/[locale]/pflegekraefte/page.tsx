// src/app/[locale]/pflegekraefte/page.tsx
// src/app/[locale]/pflegekraefte/page.tsx
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';

import { usePflegekraefte } from '@/src/hooks/usePflegekraefte';
import { PflegekraefteHeader } from '@/src/app/[locale]/pflegekraefte/_component/PflegekraefteHeader';
import { TransparencyNotice } from '@/src/app/[locale]/pflegekraefte/_component/TransparencyNotice';
import { CategoryFilterBar } from '@/src/app/[locale]/pflegekraefte/_component/CategoryFilterBar';
import { CategorySection } from '@/src/app/[locale]/pflegekraefte/_component/CategorySection';
import { FutureOutlookBanner } from '@/src/app/[locale]/pflegekraefte/_component/FutureOutlookBanner';
import {ToolCategory} from "@/src/data/pflegekraefte.tools";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default function PflegekraeftePage(props: PageProps) {
    const router = useRouter();
    const params = use(props.params);
    const locale = params?.locale || 'de';

    const { toolsByCategory, categoryMeta, scrollToSection } = usePflegekraefte();

    const categoryLabels = Object.fromEntries(
        Object.entries(categoryMeta).map(([key, meta]) => [key, meta.label])
    ) as Record<keyof typeof categoryMeta, string>;

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-white">
            <PflegekraefteHeader locale={locale} onBack={() => router.push(`/${locale}`)} />

            <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
                <TransparencyNotice />

                <CategoryFilterBar labels={categoryLabels} onJump={scrollToSection} />

                <div className="space-y-12">
                    {Object.entries(toolsByCategory).map(([category, categoryTools]) => {
                        // ✅ Explizites Casting auf deinen verankerten ToolCategory Typ
                        const catKey = category as ToolCategory;
                        const meta = categoryMeta[catKey];

                        // Falls in den Rohdaten Kategorien auftauchen, die im Meta-Verzeichnis fehlen
                        if (!meta) return null;

                        return (
                            <CategorySection
                                key={catKey}
                                id={catKey}
                                label={meta.label}
                                icon={meta.icon}
                                colorClass={meta.colorClass}
                                tools={categoryTools}
                            />
                        );
                    })}
                </div>

                <FutureOutlookBanner />
            </main>
        </div>
    );
}