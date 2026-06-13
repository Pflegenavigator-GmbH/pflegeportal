// src/hooks/usePflegekraefte.ts
import type { LucideIcon } from 'lucide-react';
import { BookOpen, Brain, ClipboardList, MessageCircle, Pill } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { tools, type Tool, type ToolCategory } from '@/src/data/pflegekraefte.tools';
import { logger } from '@/src/lib/logger';

type CategoryMetaEntry = {
  label: string;
  colorClass: string;
  icon: LucideIcon;
};

type CategoryMeta = Record<ToolCategory, CategoryMetaEntry>;

const categoryMeta: CategoryMeta = {
  documentation: {
    label: 'Pflegedokumentation',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: ClipboardList,
  },
  ai: {
    label: 'KI-Tools',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Brain,
  },
  medication: {
    label: 'Medikationsmanagement',
    colorClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Pill,
  },
  communication: {
    label: 'Kommunikation',
    colorClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: MessageCircle,
  },
  legal: {
    label: 'Leitlinien & Recht',
    colorClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: BookOpen,
  },
};

export function usePflegekraefte() {
  const toolsByCategory = useMemo(() => {
    logger.debug('Kategorisiere Pflegekräfte-Tools');
    return tools.reduce(
      (acc, tool) => {
        (acc[tool.category] ??= []).push(tool);
        return acc;
      },
      {} as Record<ToolCategory, Tool[]>
    );
  }, []);

  const scrollToSection = useCallback((id: string) => {
    logger.debug({ sectionId: id }, 'Versuche zu Sektion zu scrollen');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      logger.warn({ sectionId: id }, 'Scroll-Ziel-Element nicht gefunden');
    }
  }, []);

  return {
    tools,
    toolsByCategory,
    categoryMeta,
    scrollToSection,
  };
}
