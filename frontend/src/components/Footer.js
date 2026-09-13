import React from 'react';
export default function Footer({ onNavigate }) {
  return <footer className="app-footer"><div><strong>Reelty</strong><p>A place to live. People to share it with.</p></div><div className="action-row"><button onClick={() => onNavigate('browse-properties')}>Browse rentals</button><button onClick={() => onNavigate('messages')}>Messages</button><button onClick={() => onNavigate('settings')}>Your account</button></div><small>© {new Date().getFullYear()} Reelty</small></footer>;
}
