import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { starteFehlerberichte } from './fehler/bugsink.js';
import './styles.css';

// Läuft nebenher und scheitert still – der Etikettendruck wartet nicht darauf.
starteFehlerberichte();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary label="Die Anwendung">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);