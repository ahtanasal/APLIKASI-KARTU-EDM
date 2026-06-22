import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DesignProvider } from './contexts/DesignContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignProvider>
      <App />
    </DesignProvider>
  </StrictMode>,
);
