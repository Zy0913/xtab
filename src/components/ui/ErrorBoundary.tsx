import { Component, type ReactNode, type ErrorInfo } from 'react'
import { RefreshCw } from 'lucide-react'

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
    console.error('Widget error:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-text-tertiary">
          <p className="text-xs">组件加载失败</p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1 rounded-btn bg-surface px-2 py-1 text-xs hover:bg-surface-strong transition"
          >
            <RefreshCw size={10} /> 重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
