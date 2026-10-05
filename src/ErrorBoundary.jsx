import { Component } from 'react';

// Last line of defence: without this, any error thrown while rendering unmounts the whole
// tree and leaves a blank black screen with no way out. The in-progress game, queued
// games and edits all live in localStorage, so a reload genuinely recovers - say so.
// Deliberately plain and un-rotated (no dependence on the app's 90° layout) so it can
// always render, whatever broke.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 24, boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 360, width: '100%', backgroundColor: 'rgba(18,18,20,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '28px 24px', textAlign: 'center', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Something Went Wrong</div>
          <div style={{ marginTop: 12, fontWeight: 700, fontSize: 13, lineHeight: 1.45, color: 'rgba(255,255,255,0.6)' }}>
            Your game in progress and any unsynced games are saved on this device. Reloading should pick up right where you left off.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, width: '100%', padding: '12px 20px', borderRadius: 999, border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 900, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >Reload</button>
          {/* If the saved in-progress game is what's broken, reloading would crash again -
              this clears ONLY that game; queued games/edits and settings are kept. */}
          <button
            onClick={() => { try { localStorage.removeItem('mtg_live_game'); } catch (e) { /* ignore */ } window.location.reload(); }}
            style={{ marginTop: 10, width: '100%', padding: '12px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontWeight: 900, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >Start a Fresh Game</button>
          <div style={{ marginTop: 14, fontSize: 10, color: 'rgba(255,255,255,0.3)', wordBreak: 'break-word' }}>{String(this.state.error?.message || this.state.error)}</div>
        </div>
      </div>
    );
  }
}
