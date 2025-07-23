import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './pages/App.jsx';
import { BrowserRouter } from 'react-router';
import WineContextProvider from './contexts/WineContextProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WineContextProvider>
        <App />
      </WineContextProvider>
    </BrowserRouter>
  </StrictMode>,
);
