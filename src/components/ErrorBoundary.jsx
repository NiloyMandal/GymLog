import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[var(--color-bg-primary)] text-center">
          <div className="rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-6 max-w-sm w-full">
            <h2 className="mb-2 text-xl font-bold text-[var(--color-accent)]">Oops! Something went wrong.</h2>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
              An unexpected error occurred in the application.
            </p>
            <div className="mb-6 rounded-lg bg-[var(--color-bg-elevated)] p-3 text-left text-xs text-[var(--color-text-muted)] overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 font-bold text-black transition-transform hover:scale-[1.02] active:scale-95"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
