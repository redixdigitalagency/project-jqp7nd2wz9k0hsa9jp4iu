import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
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
    
    // Log additional debugging information
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-2xl card-gradient border-2">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-red-100 rounded-lg w-fit mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-600">שגיאה במערכת</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  אירעה שגיאה במערכת. אנא רענן את הדף ונסה שוב.
                </p>
                
                <div className="flex gap-2 justify-center mb-6">
                  <Button onClick={this.handleReload} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    רענן דף
                  </Button>
                  <Button variant="outline" onClick={this.handleClearError} className="gap-2">
                    <Bug className="h-4 w-4" />
                    נסה שוב
                  </Button>
                </div>
              </div>

              {this.state.error && (
                <details className="text-xs bg-gray-100 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium mb-2">
                    פרטי השגיאה (לצורכי דיבוג)
                  </summary>
                  <div className="space-y-2 text-left" dir="ltr">
                    <div>
                      <strong>Error:</strong> {this.state.error.name}
                    </div>
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs bg-gray-200 p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs bg-gray-200 p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="text-center text-xs text-muted-foreground">
                אם השגיאה ממשיכה להופיע, אנא צור קשר עם התמיכה הטכנית
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}