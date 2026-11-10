import { Component, type ReactNode, type ErrorInfo } from 'react'
import { RefreshCw } from 'lucide-react'
import { error as logError } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('Widget error:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2.5 text-center">
          <p className="text-body text-text-secondary">组件加载失败</p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex h-7 items-center gap-1.5 rounded-control bg-btn px-3 text-caption font-medium text-text-primary shadow-btn transition-colors hover:bg-btn-hover"
          >
            <RefreshCw size={12} aria-hidden /> 重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
