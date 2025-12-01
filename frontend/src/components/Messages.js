import React, { useState, useEffect } from 'react';

const Messages = ({ onBack }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});

  // Load conversations from localStorage
  useEffect(() => {
    const savedConvs = JSON.parse(localStorage.getItem('rently_conversations') || '[]');
    const savedMsgs = JSON.parse(localStorage.getItem('rently_messages') || '{}');
    
    // Add some sample data if empty
    if (savedConvs.length === 0) {
      const samples = [
        { id: 1, name: 'Landlord: 123 Main St', avatar: '🏠', lastMessage: 'When can you visit?', timestamp: '10:00 AM', unread: 1 },
        { id: 2, name: 'Sarah (Roommate)', avatar: '👩‍💻', lastMessage: 'That looks great!', timestamp: 'Yesterday', unread: 0 }
      ];
      setConversations(samples);
      localStorage.setItem('rently_conversations', JSON.stringify(samples));
    } else {
      setConversations(savedConvs);
    }
    setMessages(savedMsgs);
    
    // Select first conversation by default
    if (savedConvs.length > 0 && !selectedConversation) {
        setSelectedConversation(savedConvs[0].id);
    }
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update Messages
    const updatedMessages = {
      ...messages,
      [selectedConversation]: [...(messages[selectedConversation] || []), newMessage]
    };
    setMessages(updatedMessages);
    localStorage.setItem('rently_messages', JSON.stringify(updatedMessages));

    // Update Conversation Last Message
    const updatedConvs = conversations.map(c => 
      c.id === selectedConversation ? { ...c, lastMessage: messageText, timestamp: 'Just now' } : c
    );
    setConversations(updatedConvs);
    localStorage.setItem('rently_conversations', JSON.stringify(updatedConvs));

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
    return <div className="emoji-avatar" style={{ width: size, height: size }}>{avatar || '🏠'}</div>;
  };

  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="sidebar-header">
            <button onClick={onBack} className="back-link">← Back</button>
            <h2>Messages</h2>
        </div>
        <div className="conv-list">
          {conversations.map(conv => (
            <div key={conv.id} className={`conv-item ${selectedConversation === conv.id ? 'active' : ''}`} onClick={() => setSelectedConversation(conv.id)}>
              <div className="conv-avatar">{renderAvatar(conv.avatar)}</div>
              <div className="conv-info">
                <h4>{conv.name}</h4>
                <p>{conv.lastMessage}</p>
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
                {(activeConv.propertyAddress || activeConv.propertyRent) && (
                  <p className="chat-subline">
                    {activeConv.propertyAddress || ''} {activeConv.propertyRent ? `• $${activeConv.propertyRent}/mo` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="messages-list">
              {currentMsgs.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  <p>{msg.text}</p>
                  <span className="msg-time">{msg.time}</span>
                </div>
              ))}
              {currentMsgs.length === 0 && <p className="empty-chat">Start the conversation!</p>}
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input type="text" value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type a message..." />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">Select a conversation</div>
        )}
      </div>

      <style>{`
        .messages-container { display: flex; height: calc(100vh - 80px); max-width: 1200px; margin: 0 auto; background: white; box-shadow: 0 5px 20px rgba(0,0,0,0.05); border-radius: 12px; overflow: hidden; }
        .messages-sidebar { width: 350px; border-right: 1px solid #eee; display: flex; flex-direction: column; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid #eee; }
        .back-link { background: none; border: none; color: #666; cursor: pointer; margin-bottom: 10px; }
        .conv-list { overflow-y: auto; flex: 1; }
        .conv-item { display: flex; padding: 15px; border-bottom: 1px solid #f9f9f9; cursor: pointer; transition: background 0.2s; }
        .conv-item:hover { background: #f5f5f5; }
        .conv-item.active { background: #fff0f3; border-left: 4px solid #fd5068; }
        .conv-avatar { font-size: 2rem; margin-right: 15px; display: flex; align-items: center; }
        .emoji-avatar { display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background: #f3f4f6; border-radius: 50%; }
        .conv-info { flex: 1; overflow: hidden; }
        .conv-info h4 { margin: 0 0 5px 0; font-size: 1rem; }
        .conv-info p { margin: 0; color: #888; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-time { font-size: 0.75rem; color: #aaa; }
        
        .chat-area { flex: 1; display: flex; flex-direction: column; background: #f9f9f9; }
        .chat-header { padding: 15px 20px; background: white; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 15px; }
        .chat-header h3 { margin: 0; }
        .chat-subline { margin: 2px 0 0 0; color: #6b7280; font-size: 0.9rem; }
        .messages-list { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .message-bubble { max-width: 70%; padding: 10px 15px; border-radius: 15px; font-size: 0.95rem; position: relative; }
        .message-bubble p { margin: 0; }
        .msg-time { font-size: 0.7rem; opacity: 0.7; display: block; text-align: right; margin-top: 5px; }
        .sent { align-self: flex-end; background: linear-gradient(45deg, #fd5068, #ff6b9d); color: white; border-bottom-right-radius: 2px; }
        .received { align-self: flex-start; background: white; border: 1px solid #eee; border-bottom-left-radius: 2px; }
        .chat-input { padding: 20px; background: white; border-top: 1px solid #eee; display: flex; gap: 10px; }
        .chat-input input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 25px; outline: none; }
        .chat-input button { padding: 0 25px; background: #fd5068; color: white; border: none; border-radius: 25px; font-weight: 600; cursor: pointer; }
        .empty-chat { text-align: center; color: #999; margin-top: 50px; }
      `}</style>
    </div>
  );
};

export default Messages;
