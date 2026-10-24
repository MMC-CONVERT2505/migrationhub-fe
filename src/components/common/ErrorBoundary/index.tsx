import React from 'react';

interface Props {
  children: React.ReactNode;
  /** Changing this (e.g. the route) clears a previous error so navigating away recovers. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/** Keeps one broken page from blanking the whole app: shows a message with a retry instead. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto my-16 max-w-md text-center px-4">
        <h2 className="text-lg font-bold text-text-primary">Something went wrong on this page</h2>
        <p className="mt-2 text-sm text-text-secondary">
          The rest of the app still works. Try again, or reload if it keeps happening.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white text-text-primary hover:bg-bg-light"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
