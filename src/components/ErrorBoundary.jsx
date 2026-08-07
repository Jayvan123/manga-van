import { Component } from 'react'
import StatusPanel from './StatusPanel.jsx'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <main className="container page"><StatusPanel error={this.state.error} onRetry={() => window.location.reload()} /></main>
    }
    return this.props.children
  }
}