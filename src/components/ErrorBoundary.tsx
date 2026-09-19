import React from "react";

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "ui.render.failed",
        time: new Date().toISOString(),
        message: error.message,
        componentStack: info.componentStack,
      }),
    );
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div
          role="alert"
          className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"
        >
          <h1 className="text-2xl font-bold text-slate-950">
            Something went wrong.
          </h1>
          <p className="mt-3 text-slate-600">
            The page could not be displayed. No reservation was created.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to search
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
