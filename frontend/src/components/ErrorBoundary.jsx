// src/components/ErrorBoundary/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Oops! Something went wrong.</h2>
            <p className="text-lg">We're sorry for the inconvenience. Please try refreshing the page or contact support if the issue persists.</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-muted text-muted-foreground rounded-md text-sm text-left">
                <summary className="font-semibold cursor-pointer">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;