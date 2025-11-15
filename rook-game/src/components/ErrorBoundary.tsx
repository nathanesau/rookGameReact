import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.errorCard}>
            <div className={styles.icon}>⚠️</div>
            <h1 className={styles.title}>Oops! Something went wrong</h1>
            <p className={styles.message}>
              We encountered an unexpected error. Don't worry, your game progress may be lost,
              but you can start a new game.
            </p>
            {this.state.error && (
              <details className={styles.details}>
                <summary className={styles.detailsSummary}>Error details</summary>
                <pre className={styles.errorText}>{this.state.error.toString()}</pre>
              </details>
            )}
            <button onClick={this.handleReset} className={styles.resetButton}>
              Restart Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
