// src/component/ui/dialog.tsx
'use client'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/archive/src/lib/utils'

type DialogContextValue = {
    open: boolean
    setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

function useDialog() {
    const context = React.useContext(DialogContext)
    if (!context) {
        throw new Error('Dialog components must be used within a Dialog')
    }
    return context
}

interface DialogProps {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({
                                           open,
                                           defaultOpen = false,
                                           onOpenChange,
                                           children,
                                       }) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

    const isControlled = open !== undefined
    const currentOpen = isControlled ? open : internalOpen

    const setOpen = React.useCallback(
        (nextOpen: boolean) => {
            if (!isControlled) {
                setInternalOpen(nextOpen)
            }
            onOpenChange?.(nextOpen)
        },
        [isControlled, onOpenChange]
    )

    return (
        <DialogContext.Provider value={{ open: currentOpen, setOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    showCloseButton?: boolean
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
    ({ className, children, showCloseButton = true, ...props }, ref) => {
        const { open, setOpen } = useDialog()

        React.useEffect(() => {
            const onKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setOpen(false)
                }
            }

            if (open) {
                document.addEventListener('keydown', onKeyDown)
                document.body.style.overflow = 'hidden'
            }

            return () => {
                document.removeEventListener('keydown', onKeyDown)
                document.body.style.overflow = ''
            }
        }, [open, setOpen])

        if (!open) return null
        if (typeof document === 'undefined') return null

        return ReactDOM.createPortal(
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                aria-hidden={!open}
            >
                <div
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
                <div
                    ref={ref}
                    role="dialog"
                    aria-modal="true"
                    className={cn(
                        'relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl outline-none',
                        className
                    )}
                    {...props}
                >
                    {showCloseButton && (
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute right-4 top-4 rounded-md p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                            aria-label="Dialog schließen"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    {children}
                </div>
            </div>,
            document.body
        )
    }
)
DialogContent.displayName = 'DialogContent'

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('flex flex-col space-y-1.5', className)}
            {...props}
        />
    )
)
DialogHeader.displayName = 'DialogHeader'

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
    ({ className, ...props }, ref) => (
        <h2
            ref={ref}
            className={cn('text-lg font-semibold leading-none tracking-tight', className)}
            {...props}
        />
    )
)
DialogTitle.displayName = 'DialogTitle'

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn('text-sm text-gray-400', className)}
            {...props}
        />
    )
)
DialogDescription.displayName = 'DialogDescription'

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription }