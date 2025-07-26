import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import WineContextProvider from './contexts/WineContextProvider';
import App from './pages/App.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WineContextProvider>
        <App />
      </WineContextProvider>
    </BrowserRouter>
  </StrictMode>,
);
