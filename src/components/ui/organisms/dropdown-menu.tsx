'use client';

import * as React from 'react';

import { cn } from '@/src/lib/utils';

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rootRef: React.RefObject<HTMLDivElement | null>;
  /** Für die Fokusrückgabe beim Schließen (WAI-ARIA Menu Button). */
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  schliesseUndFokussiereTrigger: () => void;
};

/**
 * Aktivierbare Einträge in Dokumentreihenfolge.
 * Wird bei jeder Tastenbewegung frisch gelesen, damit bedingt gerenderte
 * Einträge nicht zu Sprüngen ins Leere führen.
 */
function menueEintraege(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return [...container.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter(
    (el) => el.getAttribute('aria-disabled') !== 'true' && !el.hasAttribute('data-disabled')
  );
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

function useDropdownMenu(): DropdownMenuContextValue {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu');
  }
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className }) => {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Schließen per Tastatur muss den Fokus zurückgeben — sonst landet er am
  // Dokumentanfang und die Tastaturnutzung beginnt von vorne.
  const schliesseUndFokussiereTrigger = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const rootElement = rootRef.current;
      const targetNode = event.target as Node | null;

      if (open && rootElement && targetNode && !rootElement.contains(targetNode)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        schliesseUndFokussiereTrigger();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, schliesseUndFokussiereTrigger]);

  return (
    <DropdownMenuContext.Provider
      value={{ open, setOpen, rootRef, triggerRef, contentRef, schliesseUndFokussiereTrigger }}
    >
      <div ref={rootRef} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

interface TriggerChildProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
  role?: string;
  tabIndex?: number;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu' | boolean;
  // React 19: ref ist eine reguläre Prop und lässt sich über cloneElement setzen.
  ref?: React.Ref<HTMLElement>;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild = false, className }, _ref) => {
    const { open, setOpen, triggerRef } = useDropdownMenu();

    const toggleOpen = () => setOpen((prev) => !prev);

    /**
     * Tastenbelegung nach WAI-ARIA Menu Button: Enter und Leertaste schalten
     * um, Pfeil-runter/-hoch öffnen. Das Fokussieren des ersten Eintrags
     * übernimmt anschließend der Inhalt.
     */
    const onTastendruck = (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.defaultPrevented) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleOpen();
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
      }
    };

    if (asChild && React.isValidElement<TriggerChildProps>(children)) {
      const child = children;

      return React.cloneElement(child, {
        ref: (knoten: HTMLElement | null) => {
          triggerRef.current = knoten;
        },
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          child.props.onClick?.(event);
          if (!event.defaultPrevented) {
            toggleOpen();
          }
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          child.props.onKeyDown?.(event);
          onTastendruck(event);
        },
        role: child.props.role ?? 'button',
        tabIndex: child.props.tabIndex ?? 0,
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        className: cn(child.props.className, className),
      });
    }

    return (
      <button
        ref={(knoten) => {
          triggerRef.current = knoten;
          if (typeof _ref === 'function') _ref(knoten);
          else if (_ref) _ref.current = knoten;
        }}
        type="button"
        onClick={toggleOpen}
        onKeyDown={onTastendruck}
        className={className}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
  sideOffset?: number;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'end', sideOffset = 8, children, style, onKeyDown, ...props }, ref) => {
    const { open, contentRef, schliesseUndFokussiereTrigger, setOpen } = useDropdownMenu();

    // Beim Öffnen den ersten Eintrag fokussieren: Ohne das bliebe der Fokus
    // am Trigger, und Screenreader-Nutzer stünden vor einem angekündigten,
    // aber unerreichbaren Menü.
    React.useEffect(() => {
      if (!open) return;
      menueEintraege(contentRef.current)[0]?.focus();
    }, [open, contentRef]);

    if (!open) return null;

    const bewegeFokus = (richtung: 1 | -1 | 'erster' | 'letzter') => {
      const eintraege = menueEintraege(contentRef.current);
      if (eintraege.length === 0) return;

      if (richtung === 'erster') return eintraege[0].focus();
      if (richtung === 'letzter') return eintraege[eintraege.length - 1].focus();

      const aktuell = eintraege.indexOf(document.activeElement as HTMLElement);
      // Umlauf: Vom letzten Eintrag geht es zurück zum ersten.
      const naechster = (aktuell + richtung + eintraege.length) % eintraege.length;
      eintraege[naechster].focus();
    };

    return (
      <div
        ref={(knoten) => {
          contentRef.current = knoten;
          if (typeof ref === 'function') ref(knoten);
          else if (ref) ref.current = knoten;
        }}
        role="menu"
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;

          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              return bewegeFokus(1);
            case 'ArrowUp':
              event.preventDefault();
              return bewegeFokus(-1);
            case 'Home':
              event.preventDefault();
              return bewegeFokus('erster');
            case 'End':
              event.preventDefault();
              return bewegeFokus('letzter');
            case 'Escape':
              event.preventDefault();
              return schliesseUndFokussiereTrigger();
            case 'Tab':
              // Tab verlässt das Menü — schließen, aber den Fokus seinen
              // natürlichen Weg gehen lassen (kein preventDefault).
              return setOpen(false);
          }
        }}
        className={cn(
          'absolute z-50 mt-2 min-w-56 rounded-xl border bg-slate-950 p-1 text-white shadow-xl outline-none',
          align === 'end' ? 'right-0' : 'left-0',
          className
        )}
        style={{
          marginTop: sideOffset,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

interface ItemChildProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  role?: string;
  tabIndex?: number;
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  disabled?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, asChild = false, disabled = false, children, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenu();

    const baseClassName = cn(
      'flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors',
      'hover:bg-white/10 focus:bg-white/10',
      disabled && 'pointer-events-none opacity-50',
      className
    );

    const handleSelect = (event: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      onClick?.(event as React.MouseEvent<HTMLDivElement>);
      setOpen(false);
    };

    // Ein <div role="menuitem"> löst bei Enter/Leertaste — anders als ein
    // <button> — kein Click-Event aus. Ohne das hier wäre der Eintrag
    // fokussierbar, aber per Tastatur nicht auslösbar.
    const handleKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        (event.currentTarget as HTMLElement).click();
      }
    };

    if (asChild && React.isValidElement<ItemChildProps>(children)) {
      const child = children;

      return React.cloneElement(child, {
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          child.props.onClick?.(event);
          if (!event.defaultPrevented && !disabled) {
            setOpen(false);
          }
        },
        className: cn(child.props.className, baseClassName),
        role: child.props.role ?? 'menuitem',
        // Roving Tabindex: Das Menü steuert den Fokus per Pfeiltasten selbst,
        // die Einträge sind deshalb keine eigenen Tabstopps.
        tabIndex: child.props.tabIndex ?? -1,
        ...props,
      });
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={disabled || undefined}
        onClick={handleSelect}
        onKeyDown={handleKey}
        className={baseClassName}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

type DropdownMenuSeparatorProps = React.HTMLAttributes<HTMLDivElement>;

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="separator" className={cn('my-1 h-px bg-white/10', className)} {...props} />
  )
);
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-sm font-semibold text-[var(--color-text-muted)]',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
