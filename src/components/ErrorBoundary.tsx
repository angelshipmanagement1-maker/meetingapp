import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center gradient-dark p-4">
          <div className="text-center animate-slide-up max-w-md">
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full glass">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-foreground">Something went wrong</h1>
            <p className="mb-6 text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 rounded bg-secondary p-3 text-xs text-destructive overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button
              onClick={() => window.location.reload()}
              variant="hero"
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}