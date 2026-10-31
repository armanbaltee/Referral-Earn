import React from 'react';

import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { Providers } from './providers';
import { AppRouter } from './router';

export default function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <Providers>
        <AppRouter />
      </Providers>
    </ErrorBoundary>
  );
}
