import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './utils/apiConfig';
import App from './App.tsx';
import './index.css';

// Production performance optimized QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes fresh cache prevents duplicate requests
      gcTime: 1000 * 60 * 15,    // 15 minutes garbage collection for instant return visits
      refetchOnWindowFocus: false, // Prevents layout shifts and unnecessary refetches on tab switch
      retry: 1,
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

