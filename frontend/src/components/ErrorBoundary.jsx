/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * ErrorBoundary.jsx — React Error Boundary
 * ==========================================
 * Class component that catches unhandled JavaScript errors anywhere in the
 * child component tree and displays a fallback UI instead of a blank screen.
 *
 * On error: logs the error and component stack to the console and renders
 * a full-screen error page with a reload button and a home navigation button.
 * Wraps the entire app in main.jsx to prevent full crashes.
 */
import { Component } from 'react'
import { Home, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  // Initializes the component with hasError set to false.
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  // React lifecycle: updates state to trigger the fallback UI when any child throws.
  static getDerivedStateFromError() {
    return { hasError: true }
  }

  // Logs the error and component stack to the console for debugging.
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  // Renders the fallback error screen or the normal children tree.
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-6xl font-black text-red-500 mb-4">!</p>
          <h1 className="text-2xl font-bold text-white mb-3">משהו השתבש</h1>
          <p className="text-dark-400 text-sm mb-8 max-w-xs">
            אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw size={16} /> רענן דף
            </button>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
              className="btn-secondary flex items-center gap-2"
            >
              <Home size={16} /> דף הבית
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
