import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-4 bg-red-50 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Something went wrong</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              The application encountered an unexpected error.
            </p>
            {this.state.error && (
              <pre className="text-xs text-red-600 bg-red-50 p-3 rounded max-w-md mx-auto overflow-auto text-left">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
