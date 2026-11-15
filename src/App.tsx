import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Toaster } from 'sonner';
import { useTheme } from './utils/theme';
import { useTournamentRuntime } from './hooks/useTournamentRuntime';

export default function App() {
  const { theme } = useTheme();
  useTournamentRuntime();
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          gap={8}
          offset={16}
          theme={theme}
          toastOptions={{
            style: {
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-foreground)',
              padding: '12px 14px',
              fontSize: '13px',
              lineHeight: '1.5',
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
