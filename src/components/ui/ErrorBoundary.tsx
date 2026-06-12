import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time errors in a subtree and shows a recoverable fallback
 * instead of a blank screen. Wrapped around route content.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-red-100 text-red-500 dark:bg-red-500/15">
          <AlertTriangle className="size-7" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-semibold">Something went wrong</h2>
          <p className="max-w-md text-sm text-slate-500">{this.state.error.message}</p>
        </div>
        <Button variant="secondary" onClick={this.reset}>
          Try again
        </Button>
      </div>
    )
  }
}
