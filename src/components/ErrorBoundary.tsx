"use client";
import { Component, ReactNode } from "react";

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("View error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-crimson/10 flex items-center justify-center mb-6">
            <span className="text-3xl">⚠</span>
          </div>
          <h2 className="text-xl font-semibold text-carbon mb-2">Something went wrong</h2>
          <p className="text-sm text-stone max-w-md mb-6">{this.state.error?.message || "An unexpected error occurred."}</p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 bg-carbon text-white text-sm font-medium rounded-xl hover:bg-carbon-light transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              className="px-5 py-2.5 border border-carbon/10 text-sm font-medium rounded-xl hover:bg-carbon/5 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
