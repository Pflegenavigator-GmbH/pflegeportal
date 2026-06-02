'use client';

import * as React from "react"
import { cn } from "@/archive/src/lib/utils"

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const RadioGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps {
  value: string;
  id: string;
  children?: React.ReactNode;
  className?: string;
}

function RadioGroupItem({ value, id, children, className }: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext);
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup");

  const isSelected = context.value === value;

  return (
    <>
      <input
        type="radio"
        id={id}
        value={value}
        checked={isSelected}
        onChange={() => context.onValueChange(value)}
        className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
      />
      {children && <span className="flex-1">{children}</span>}
    </>
  );
}

export { RadioGroup, RadioGroupItem };
