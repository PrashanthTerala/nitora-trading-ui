import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { STORAGE_KEYS } from './lib/storageKeys';
import App from './App';
import './styles/index.css';

// apply saved theme before first paint
try {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const dark = saved ? saved === 'dark' : true;
  document.documentElement.classList.toggle('dark', dark);
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
