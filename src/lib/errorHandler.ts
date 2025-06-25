// Global error handler for unhandled script errors
export function setupGlobalErrorHandling() {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
    
    // Don't show generic "Script error" - try to get more details
    if (event.message === 'Script error.' && !event.filename) {
      console.warn('CORS-related script error detected. This usually means an external script failed to load.');
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior
    event.preventDefault();
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      console.error('Resource loading error:', {
        type: event.target?.constructor?.name,
        source: (event.target as any)?.src || (event.target as any)?.href,
        message: event.message
      });
    }
  }, true);
}

// Enhanced console logging for debugging
export function enhanceConsoleLogging() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.error = (...args) => {
    originalError.apply(console, ['🔴 ERROR:', ...args]);
  };

  console.warn = (...args) => {
    originalWarn.apply(console, ['🟡 WARNING:', ...args]);
  };

  console.log = (...args) => {
    originalLog.apply(console, ['🔵 LOG:', ...args]);
  };
}