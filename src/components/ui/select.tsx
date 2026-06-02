// src/components/ui/select.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/archive/src/lib/utils"
import { ChevronDown, Check } from "lucide-react"

// Context for Select
interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

function useSelect() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be used within a Select provider")
  }
  return context
}

// Select Root
interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, defaultValue, onValueChange, children }) => {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "")
  const [open, setOpen] = React.useState(false)
  
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])
  
  const handleValueChange = React.useCallback((newValue: string) => {
    if (value === undefined) {
      setSelectedValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }, [value, onValueChange])
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (open) {
        setOpen(false)
      }
    }
    
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])
  
  return (
    <SelectContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

// Select Trigger
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, value } = useSelect()
    
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {children}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

// Select Value
interface SelectValueProps {
  placeholder?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = useSelect()
  return <>{value || placeholder}</>
}

// Select Content
interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const { open } = useSelect()
  
  if (!open) return null
  
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
    >
      {children}
    </div>
  )
}

// Select Item
interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectItem: React.FC<SelectItemProps> = ({ value: itemValue, children, className }) => {
  const { value, onValueChange } = useSelect()
  const isSelected = value === itemValue
  
  return (
    <div
      onClick={() => onValueChange(itemValue)}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="pl-6">{children}</span>
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
