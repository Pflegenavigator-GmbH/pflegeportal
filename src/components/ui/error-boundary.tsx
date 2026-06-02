'use client'

import { Component, ReactNode } from 'react'
import { Button } from './button'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Ein Fehler ist aufgetreten
            </h2>
            <p className="text-slate-600 mb-4">
              Bitte laden Sie die Seite neu oder versuchen Sie es später erneut.
            </p>
            <Button onClick={() => window.location.reload()}>
              Seite neu laden
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
