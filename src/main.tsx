import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { TrainProvider } from './context/TrainContext';
import './index.css';

// Ensure official Indian Railways logo is actively set on the browser favicon
const IR_FAVICON_DATA_URI = 'data:image/png;base64,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';

const updateBrowserFavicon = () => {
  try {
    const existingIcons = document.querySelectorAll("link[rel*='icon']");
    existingIcons.forEach(el => el.remove());

    const link = document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = IR_FAVICON_DATA_URI;
    document.head.appendChild(link);

    const shortcutLink = document.createElement('link');
    shortcutLink.type = 'image/png';
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.href = IR_FAVICON_DATA_URI;
    document.head.appendChild(shortcutLink);
  } catch {
    // Fail-safe
  }
};

if (typeof document !== 'undefined') {
  updateBrowserFavicon();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TrainProvider>
            <App />
          </TrainProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
