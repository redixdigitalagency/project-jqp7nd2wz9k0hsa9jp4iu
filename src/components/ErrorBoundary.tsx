import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center" dir="rtl">
          <Card className="w-full max-w-md card-gradient border-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-red-100 rounded-lg w-fit mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-600">שגיאה במערכת</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                אירעה שגיאה במערכת. אנא רענן את הדף ונסה שוב.
              </p>
              {this.state.error && (
                <details className="text-xs text-left bg-gray-100 p-2 rounded">
                  <summary>פרטי השגיאה</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                רענן דף
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}