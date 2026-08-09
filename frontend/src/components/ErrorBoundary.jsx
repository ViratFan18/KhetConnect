import { Component } from 'react'
import ErrorPage from './ErrorPage'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  componentDidCatch(error, info) {
    // In production, this could be sent to a logging service.
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          title="Something went wrong"
          message="An unexpected error happened. Please go back home or refresh the page."
          buttonText="Go home"
          link="/"
        />
      )
    }
    return this.props.children
  }
}
