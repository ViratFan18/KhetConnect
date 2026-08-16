import { Component } from 'react'
import ErrorPage from './ErrorPage'
import api from '../services/api'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null })
    }
  }

  componentDidCatch(error, errorInfo) {
    // Store error info for display/debugging
    this.setState({
      error,
      errorInfo,
    })

    // Log to console for development
    console.error('Unhandled UI error:', error, errorInfo)
    
    // Report to backend for monitoring
    this.reportErrorToBackend(error, errorInfo)
  }

  async reportErrorToBackend(error, errorInfo) {
    try {
      const errorReport = {
        message: error?.message || 'Unknown error',
        stack: error?.stack || '',
        componentStack: errorInfo?.componentStack || '',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        source: 'client-error-boundary',
      }

      await api.post('/client-errors', errorReport)
    } catch (err) {
      // Silently fail - don't want to create infinite error loop
      console.error('Failed to report error to backend:', err)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          type="default"
          title="Oops! Something went wrong"
          subtitle="Error Boundary"
          message="An unexpected error occurred in the application. Our team has been notified and we're working on a fix."
          details={process.env.NODE_ENV === 'development' ? this.state.error?.message : undefined}
          buttonText="Go back home"
          link="/"
        />
      )
    }

    return this.props.children
  }
}
