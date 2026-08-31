import { Component } from 'react';

/*
  ErrorBoundary
  - Fängt Render-/Lifecycle-Fehler ab, damit ein Absturz in der Spielerei
    (Katze, Hütchenspiel) nicht die Druckfunktion mitreißt.
  - props:
    - label?: string   Name des Bereichs, erscheint in der Meldung + im Log
    - silent?: boolean  true = kaputter Bereich verschwindet kommentarlos
    - children
*/
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Serverseitiges Logging gibt es hier nicht – Konsole ist die einzige Spur.
    console.error(
      `[ErrorBoundary${this.props.label ? ': ' + this.props.label : ''}]`,
      error,
      info?.componentStack,
    );
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.silent) return null;

    return (
      <div role="alert" style={styles.box}>
        <strong style={styles.title}>
          ⚠️ {this.props.label || 'Dieser Bereich'} ist abgestürzt
        </strong>
        <span style={styles.detail}>{String(error?.message || error)}</span>
        <button style={styles.button} onClick={() => this.setState({ error: null })}>
          Nochmal versuchen
        </button>
      </div>
    );
  }
}

const styles = {
  box: {
    position: 'fixed',
    zIndex: 99999,
    left: '50%',
    top: '1rem',
    transform: 'translateX(-50%)',
    maxWidth: 'min(90vw, 32rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    padding: '1rem 1.25rem',
    borderRadius: '.75rem',
    border: '1px solid #b91c1c',
    background: '#fef2f2',
    color: '#7f1d1d',
    font: '14px/1.4 system-ui, sans-serif',
    boxShadow: '0 8px 24px rgba(0,0,0,.18)',
  },
  title: { fontSize: '1rem' },
  detail: { opacity: 0.8, wordBreak: 'break-word' },
  button: {
    alignSelf: 'flex-start',
    padding: '.4rem .9rem',
    borderRadius: '.5rem',
    border: '1px solid #b91c1c',
    background: '#fff',
    color: '#7f1d1d',
    cursor: 'pointer',
  },
};
