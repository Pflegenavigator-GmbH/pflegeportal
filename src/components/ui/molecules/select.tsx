// src/components/ui/select.tsx
'use client';

import { ChevronDown, Check } from 'lucide-react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useRef,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';

import { cn } from '@/src/lib/utils';

// Context for Select
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelect() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
}

// Select Root
interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

const Select = ({ value, defaultValue, onValueChange, children }: SelectProps) => {
  // Best Practice: Controlled vs Uncontrolled Pattern
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '');

  // Der aktuelle Wert ist entweder der Prop (wenn von außen gesteuert) oder der interne State
  const currentValue = isControlled ? value : uncontrolledValue;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  // Saubere Click-Outside Logik mit Ref
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Schließt das Menü nur, wenn der Klick AUSSERHALB des Select-Containers war
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen }}
    >
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// Select Trigger
type SelectTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, value } = useSelect();

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{children}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

// Select Value
interface SelectValueProps {
  placeholder?: string;
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { value } = useSelect();
  return <>{value || placeholder}</>;
};

// Select Content
interface SelectContentProps {
  children: ReactNode;
  className?: string;
}

const SelectContent = ({ children, className }: SelectContentProps) => {
  const { open } = useSelect();

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
};

// Select Item
interface SelectItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

const SelectItem = ({ value: itemValue, children, className }: SelectItemProps) => {
  const { value, onValueChange } = useSelect();
  const isSelected = value === itemValue;

  return (
    <div
      onClick={() => onValueChange(itemValue)}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="pl-6">{children}</span>
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
