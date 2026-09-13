import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
const date = value => new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
export default function Messages({ userProfile, initialConversationId, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [retry, setRetry] = useState(0);
  const end = useRef(null);
  const activeId = useRef(selected);
  useEffect(() => { activeId.current = selected; setMessages([]); setDraft(''); }, [selected]);
  useEffect(() => {
    let disposed = false;
    let timer;
    const poll = async () => {
      try {
        const { conversations: rows } = await api.getConversations();
        if (disposed) return;
        setConversations(rows);
        if (!activeId.current && rows.length) setSelected(rows[0].id);
        setError('');
      } catch (err) { if (!disposed) setError(err.message); }
      finally { if (!disposed) { setLoading(false); timer = setTimeout(poll, 4000); } }
    };
    poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [retry]);
  useEffect(() => {
    if (!selected) return;
    let disposed = false;
    let timer;
    const poll = async () => {
      try {
        const data = await api.getMessages(selected);
        if (!disposed) {
          setMessages(previous => data.messages.length >= previous.length ? data.messages : previous);
          setConversations(rows => rows.map(c => c.id === selected ? { ...c, unread: 0 } : c));
        }
      } catch (err) { if (!disposed) setError(err.message); }
      finally { if (!disposed) timer = setTimeout(poll, 2500); }
    };
    poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [selected, retry]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);
  const send = async e => {
    e.preventDefault();
    if (!draft.trim() || sending || !selected) return;
    const id = selected;
    setSending(true); setError('');
    try {
      const data = await api.sendMessage(id, draft.trim());
      if (activeId.current === id) { setMessages(data.messages); setDraft(''); }
      const { conversations: rows } = await api.getConversations(); setConversations(rows);
    } catch (err) { setError(err.message); } finally { setSending(false); }
  };
  const conversation = conversations.find(c => c.id === selected);
  return <main className="workspace">
    <header className="page-heading"><div><p className="eyebrow">STAY CONNECTED</p><h1>Messages</h1><p>Conversations with landlords and potential roommates.</p></div><button onClick={onBack}>Dashboard</button></header>
    {error && <p className="notice error" role="alert">{error} <button onClick={() => setRetry(v => v + 1)}>Retry</button></p>}
    <div className="panel inbox">
      <aside className="conversation-list" aria-label="Conversations">{loading ? <p role="status">Loading conversations…</p> : !conversations.length ? <p>No conversations yet. Message a landlord or a liked roommate to get started.</p> : conversations.map(c => <button className={selected === c.id ? 'conversation active' : 'conversation'} key={c.id} onClick={() => setSelected(c.id)}><strong>{c.name}{c.unread > 0 && <span className="tag">{c.unread} unread</span>}</strong><span>{c.lastMessage || 'Start the conversation'}</span><small>{date(c.timestamp)}</small></button>)}</aside>
      <section className="chat-panel">{conversation ? <><header><h2>{conversation.name}</h2><p>{conversation.user_type}</p></header><div className="chat-history" aria-label="Message history" role="log">{messages.map(m => <article key={m.id} className={'chat-bubble ' + (m.sender_id === userProfile.id ? 'sent' : 'received')}><p>{m.text}</p><small>{date(m.timestamp)}{m.sender_id === userProfile.id ? m.read ? ' · Read' : ' · Sent' : ''}</small></article>)}{!messages.length && <p className="muted">Say hello to start your conversation.</p>}<div ref={end} /></div><form className="message-compose" onSubmit={send}><label className="sr-only" htmlFor="message">Message</label><textarea id="message" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write a message…" rows={2} maxLength={5000} required /><button className="primary" disabled={sending || !draft.trim()}>{sending ? 'Sending…' : 'Send'}</button></form></> : <div className="empty-state"><h2>Your conversations live here</h2><p>Select a conversation to read and reply.</p></div>}</section>
    </div>
  </main>;
}
