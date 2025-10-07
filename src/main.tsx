import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { suppressKnownErrors } from "./utils/errorSuppression";

// Suppress known browser extension errors
if (import.meta.env.DEV) {
  suppressKnownErrors();
}

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  // Suppress browser extension and media autoplay errors
  if (
    event.reason?.message?.includes('Could not establish connection') ||
    event.reason?.message?.includes('Extension context invalidated') ||
    event.reason?.message?.includes('The play() request was interrupted') ||
    event.reason?.name === 'AbortError'
  ) {
    event.preventDefault();
    return;
  }
  
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  // Suppress browser extension script errors
  if (
    event.filename?.includes('content-all.js') ||
    event.message?.includes('Could not establish connection')
  ) {
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
