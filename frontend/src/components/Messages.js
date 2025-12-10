import React, { useState, useEffect } from 'react';

const Messages = ({ onBack }) => {
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('rently_user_profile') || 'null'); } catch { return null; }
  })();
  const effectiveUserId = profile?.id || profile?.email || 'anon';
  const convKey = `rently_conversations_user_${effectiveUserId}`;
  const msgKey = `rently_messages_user_${effectiveUserId}`;

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});

  useEffect(() => {
    const savedConvs = JSON.parse(localStorage.getItem(convKey) || '[]');
    const savedMsgs = JSON.parse(localStorage.getItem(msgKey) || '{}');
    setConversations(savedConvs);
    setMessages(savedMsgs);
    if (savedConvs.length > 0) setSelectedConversation(savedConvs[0].id);
  }, [convKey, msgKey]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = {
      ...messages,
      [selectedConversation]: [...(messages[selectedConversation] || []), newMessage]
    };
    setMessages(updatedMessages);
    localStorage.setItem(msgKey, JSON.stringify(updatedMessages));

    const updatedConvs = conversations.map(c => 
      c.id === selectedConversation ? { ...c, lastMessage: messageText, timestamp: 'Just now' } : c
    );
    setConversations(updatedConvs);
    localStorage.setItem(convKey, JSON.stringify(updatedConvs));

    setMessageText('');
  };

  const currentMsgs = messages[selectedConversation] || [];
  const activeConv = conversations.find(c => c.id === selectedConversation);

  const renderAvatar = (avatar, size = 40) => {
    const isUrl = typeof avatar === 'string' && avatar.startsWith('http');
    if (isUrl) {
      return (
        <img
          src={avatar}
          alt="avatar"
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      );
    }
    return <div className="emoji-avatar" style={{ width: size, height: size }}>{avatar || '👤'}</div>;
  };

  return (
    <div className="messages-shell">
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <button onClick={onBack} className="back-link">← Back</button>
          <h2>Messages</h2>
        </div>
        <div className="conv-list">
          {conversations.length === 0 && (
            <div className="empty-sidebar">No conversations yet</div>
          )}
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conv-item ${selectedConversation === conv.id ? 'active' : ''}`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <div className="conv-avatar">{renderAvatar(conv.avatar)}</div>
              <div className="conv-info">
                <h4>{conv.name}</h4>
                <p>{conv.lastMessage || 'Start the conversation'}</p>
              </div>
              <span className="conv-time">{conv.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {activeConv ? (
          <>
            <div className="chat-header">
              <div className="chat-avatar">{renderAvatar(activeConv.avatar, 52)}</div>
              <div>
                <h3>{activeConv.name}</h3>
                {(activeConv.propertyAddress || activeConv.major) && (
                  <p className="chat-subline">
                    {activeConv.propertyAddress || activeConv.major || ''}
                  </p>
                )}
              </div>
            </div>
            <div className="messages-list">
              {currentMsgs.map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  <p>{msg.text}</p>
                  <span className="msg-time">{msg.time}</span>
                </div>
              ))}
              {currentMsgs.length === 0 && <p className="empty-chat">Start the conversation!</p>}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">Select a conversation</div>
        )}
      </div>

      <style>{`
        .messages-shell { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 80px); max-width: 1200px; margin: 0 auto; background: white; box-shadow: 0 5px 20px rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden; }
        .messages-sidebar { border-right: 1px solid #eee; display: flex; flex-direction: column; background: #fafafa; }
        .sidebar-header { padding: 16px; border-bottom: 1px solid #eee; }
        .back-link { background: none; border: none; color: #555; cursor: pointer; margin-bottom: 8px; }
        .conv-list { overflow-y: auto; flex: 1; }
        .empty-sidebar { padding: 20px; text-align: center; color: #888; }
        .conv-item { display: flex; padding: 14px; border-bottom: 1px solid #f2f2f2; cursor: pointer; transition: background 0.2s; }
        .conv-item:hover { background: #f3f4f6; }
        .conv-item.active { background: #fff0f3; border-left: 4px solid #fd5068; }
        .conv-avatar { font-size: 2rem; margin-right: 12px; display: flex; align-items: center; }
        .emoji-avatar { display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: #f3f4f6; border-radius: 50%; }
        .conv-info { flex: 1; overflow: hidden; }
        .conv-info h4 { margin: 0 0 4px 0; font-size: 0.98rem; }
        .conv-info p { margin: 0; color: #888; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-time { font-size: 0.75rem; color: #aaa; }

        .chat-area { display: flex; flex-direction: column; background: #f7f8fb; }
        .chat-header { padding: 15px 20px; background: white; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 14px; }
        .chat-header h3 { margin: 0; }
        .chat-subline { margin: 2px 0 0 0; color: #6b7280; font-size: 0.9rem; }
        .messages-list { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .message-bubble { max-width: 70%; padding: 10px 15px; border-radius: 15px; font-size: 0.95rem; position: relative; }
        .message-bubble p { margin: 0; }
        .msg-time { font-size: 0.7rem; opacity: 0.7; display: block; text-align: right; margin-top: 5px; }
        .sent { align-self: flex-end; background: linear-gradient(45deg, #fd5068, #ff6b9d); color: white; border-bottom-right-radius: 2px; }
        .received { align-self: flex-start; background: white; border: 1px solid #eee; border-bottom-left-radius: 2px; }
        .chat-input { padding: 16px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; }
        .chat-input input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 25px; outline: none; }
        .chat-input button { padding: 0 24px; background: #fd5068; color: white; border: none; border-radius: 25px; font-weight: 600; cursor: pointer; }
        .empty-chat { text-align: center; color: #999; margin-top: 50px; }
        .no-chat-selected { display: flex; align-items: center; justify-content: center; flex: 1; color: #777; }

        .dark-mode .messages-shell { background: #0b1224; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
        .dark-mode .messages-sidebar { background: #0f172a; border-right: 1px solid rgba(255,255,255,0.08); }
        .dark-mode .sidebar-header { border-bottom: 1px solid rgba(255,255,255,0.08); }
        .dark-mode .back-link { color: #e5e7eb; }
        .dark-mode .conv-item { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .dark-mode .conv-item.active { background: rgba(255,255,255,0.08); border-left-color: #60a5fa; }
        .dark-mode .conv-item:hover { background: rgba(255,255,255,0.04); }
        .dark-mode .conv-info p { color: #cbd5e1; }
        .dark-mode .conv-time { color: #9ca3af; }
        .dark-mode .chat-area { background: #0b1224; }
        .dark-mode .chat-header { background: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .dark-mode .chat-subline { color: #cbd5e1; }
        .dark-mode .messages-list { background: #0b1224; }
        .dark-mode .message-bubble.received { background: #0f172a; border-color: rgba(255,255,255,0.1); color: #e5e7eb; }
        .dark-mode .message-bubble.sent { color: white; }
        .dark-mode .msg-time { color: #9ca3af; }
        .dark-mode .chat-input { background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08); }
        .dark-mode .chat-input input { background: #0b1224; border-color: rgba(255,255,255,0.12); color: #e5e7eb; }
      `}</style>
    </div>
  );
};

export default Messages;
