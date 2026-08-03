import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import WineContextProvider from './contexts/WineContextProvider';
import App from './pages/App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WineContextProvider>
      <App />
    </WineContextProvider>
  </StrictMode>,
);
