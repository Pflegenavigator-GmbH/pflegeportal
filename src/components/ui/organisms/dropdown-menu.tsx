'use client';

import * as React from 'react';

import { cn } from '@/src/lib/utils';

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  rootRef: React.RefObject<HTMLDivElement | null>;
};

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

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const rootElement = rootRef.current;
      const targetNode = event.target as Node | null;

      if (open && rootElement && targetNode && !rootElement.contains(targetNode)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, rootRef }}>
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
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild = false, className }, _ref) => {
    const { open, setOpen } = useDropdownMenu();

    const toggleOpen = () => setOpen((prev) => !prev);

    if (asChild && React.isValidElement<TriggerChildProps>(children)) {
      const child = children;

      return React.cloneElement(child, {
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          child.props.onClick?.(event);
          if (!event.defaultPrevented) {
            toggleOpen();
          }
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          child.props.onKeyDown?.(event);

          if (event.defaultPrevented) return;

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleOpen();
          }
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
        ref={_ref}
        type="button"
        onClick={toggleOpen}
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
  ({ className, align = 'end', sideOffset = 8, children, style, ...props }, ref) => {
    const { open } = useDropdownMenu();

    if (!open) return null;

    return (
      <div
        ref={ref}
        role="menu"
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
        tabIndex: child.props.tabIndex ?? 0,
        ...props,
      });
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        onClick={handleSelect}
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
