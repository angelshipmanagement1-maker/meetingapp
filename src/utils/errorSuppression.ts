// Suppress known browser extension errors that we can't control
export const suppressKnownErrors = () => {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress browser extension, media autoplay, and connection errors
    if (
      message.includes('Could not establish connection. Receiving end does not exist') ||
      message.includes('Extension context invalidated') ||
      message.includes('content-all.js') ||
      message.includes('The play() request was interrupted') ||
      message.includes('AbortError') ||
      message.includes('TransportError: xhr poll error') ||
      message.includes('Socket not connected') ||
      message.includes('Failed to connect to server')
    ) {
      return;
    }
    
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args.join(' ');

    // Suppress React DevTools warning and util externalization warnings
    if (
      message.includes('Download the React DevTools') ||
      message.includes('Module "util" has been externalized') ||
      message.includes('Socket not connected, cannot emit')
    ) {
      return;
    }

    originalWarn.apply(console, args);
  };
};

// Clean up function
export const restoreConsole = () => {
  // This would restore original console methods if needed
  // Implementation depends on specific requirements
};