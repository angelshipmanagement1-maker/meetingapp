import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Example from './src/App.enhanced'
import KombaiWrapper from './KombaiWrapper'
import { ErrorBoundary } from './src/components/ErrorBoundary'
import { suppressKnownErrors } from './src/utils/errorSuppression'
import './src/index.css'

// Suppress known browser errors and warnings
suppressKnownErrors();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <KombaiWrapper>
        <Example />
      </KombaiWrapper>
    </ErrorBoundary>
  </StrictMode>,
)