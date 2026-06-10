// src/components/ui/card.tsx

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/archive/src/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-emerald-600 text-white hover:bg-emerald-700',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        ghost: 'hover:bg-slate-100 hover:text-slate-900',
        link: 'text-emerald-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Aria-Label für Accessibility (besonders wichtig für Icon-Buttons) */
  'aria-label'?: string;
}

/**
 * Button Komponente mit Radix UI Styling
 *
 * Accessibility:
 * - Verwendet focus-visible für Tastatur-Navigation
 * - Unterstützt aria-label für Screenreader
 * - Disabled-Zustand mit korrekter Semantik
 *
 * @example
 * ```tsx
 * <Button>Click me</Button>
 * <Button aria-label="Menü öffnen" size="icon"><Menu /></Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, 'aria-label': ariaLabel, children, ...props }, ref) => {
    // Auto-generiere aria-label für Icon-Buttons
    const computedAriaLabel =
      ariaLabel || (size === 'icon' && typeof children === 'object' ? 'Button' : undefined);

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-label={computedAriaLabel}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
