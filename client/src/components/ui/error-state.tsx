import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: "page" | "inline";
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "Please try again or contact support if the problem persists.",
  onRetry,
  variant = "inline" 
}: ErrorStateProps) {
  const containerClass = variant === "page" 
    ? "min-h-screen flex items-center justify-center bg-slate-50"
    : "py-12 text-center";

  return (
    <div className={containerClass}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="inline-flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    </div>
  );
}