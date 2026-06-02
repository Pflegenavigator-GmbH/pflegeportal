// src/app/components/ui/tabs.tsx
"use client"

import * as React from "react"
import { cn } from "@/archive/src/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider")
  }
  return context
}

interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value, defaultValue, onValueChange, children, className }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || "")
    
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
    }, [value, onValueChange])
    
    return (
      <TabsContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn("w-full", className)}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          className
        )}
      >
        {children}
      </div>
    )
  }
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, className, disabled }, ref) => {
    const { value: selectedValue, onValueChange } = useTabs()
    const isSelected = selectedValue === value
    
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isSelected}
        disabled={disabled}
        onClick={() => onValueChange(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isSelected
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50 hover:text-foreground",
          className
        )}
      >
        {children}
      </button>
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
  forceMount?: boolean
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, children, className, forceMount }, ref) => {
    const { value: selectedValue } = useTabs()
    const isSelected = selectedValue === value
    
    if (!isSelected && !forceMount) {
      return null
    }
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        hidden={!isSelected}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
