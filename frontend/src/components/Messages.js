import React, { useState, useEffect } from 'react';

const SAMPLE_CONVERSATIONS = [
  {
    id: 1,
    name: 'Sarah Johnson',
    avatar: '👩‍🎓',
    major: 'Computer Science',
    matchScore: 92,
    lastMessage: 'I\'m also looking for a place near campus!',
    timestamp: '2 min ago',
    unread: 2,
    online: true
  },
  {
    id: 2,
    name: 'Mike Chen',
    avatar: '👨‍💼',
    major: 'Business',
    matchScore: 85,
    lastMessage: 'My budget is around $800/month too',
    timestamp: '1 hour ago',
    unread: 0,
    online: false
  },
  {
    id: 3,
    name: 'Emma Davis',
    avatar: '👩‍🎨',
    major: 'Fine Arts',
    matchScore: 78,
    lastMessage: 'I\'m a night owl too! Perfect match',
    timestamp: '3 hours ago',
    unread: 1,
    online: true
  },
  {
    id: 4,
    name: 'Alex Kumar',
    avatar: '👨‍🔬',
    major: 'Engineering',
    matchScore: 88,
    lastMessage: 'Want to check out some apartments together?',
    timestamp: 'Yesterday',
    unread: 0,
    online: false
  }
];

const SAMPLE_MESSAGES = {
  1: [
    { id: 1, sender: 'them', text: 'Hey! We matched on Rently! I\'m looking for a roommate near campus', time: '10:30 AM' },
    { id: 2, sender: 'me', text: 'Hi Sarah! Me too! What\'s your budget?', time: '10:32 AM' },
    { id: 3, sender: 'them', text: 'Around $800-900/month. I\'m studying CS at UofT', time: '10:35 AM' },
    { id: 4, sender: 'me', text: 'Perfect! Same budget here. I\'m pretty clean and quiet', time: '10:36 AM' },
    { id: 5, sender: 'them', text: 'I\'m also looking for a place near campus!', time: '10:40 AM' }
  ],
  2: [
    { id: 1, sender: 'them', text: 'Hi! Saw we have a 85% match. Looking for a roommate?', time: '9:15 AM' },
    { id: 2, sender: 'me', text: 'Yes! What year are you in?', time: '9:20 AM' },
    { id: 3, sender: 'them', text: 'Second year Business. My budget is around $800/month too', time: '9:25 AM' }
  ],
  3: [
    { id: 1, sender: 'them', text: 'Hey! I\'m an art student looking for a chill roommate', time: '7:00 AM' },
    { id: 2, sender: 'me', text: 'Cool! I\'m pretty laid back. What\'s your schedule like?', time: '7:05 AM' },
    { id: 3, sender: 'them', text: 'I\'m a night owl too! Perfect match', time: '7:10 AM' }
  ],
  4: [
    { id: 1, sender: 'them', text: 'Hi! Engineering student here. Want to team up on apartment hunting?', time: 'Yesterday' },
    { id: 2, sender: 'me', text: 'Definitely! That would make it easier', time: 'Yesterday' },
    { id: 3, sender: 'them', text: 'Want to check out some apartments together?', time: 'Yesterday' }
  ]
};

const Messages = ({ onBack }) => {
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState(SAMPLE_CONVERSATIONS);
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('rently_conversations');
    const savedMessages = localStorage.getItem('rently_messages');
    
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      // Merge with sample conversations
      setConversations([...parsed, ...SAMPLE_CONVERSATIONS]);
    }
    
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      // Merge with sample messages
      setMessages({ ...SAMPLE_MESSAGES, ...parsed });
    }
  }, []);

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentMessages = messages[selectedConversation] || [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMessage = {
      id: currentMessages.length + 1,
      sender: 'me',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages({
      ...messages,
      [selectedConversation]: [...currentMessages, newMessage]
    });

    setConversations(conversations.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: messageText, timestamp: 'Just now' }
        : conv
    ));

    setMessageText('');
  };

  const markAsRead = (convId) => {
    setConversations(conversations.map(conv =>
      conv.id === convId ? { ...conv, unread: 0 } : conv
    ));
  };

  const handleSelectConversation = (convId) => {
    setSelectedConversation(convId);
    markAsRead(convId);
  };

  return (
    <div className="messages-container">
      <div className="messages-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Messages</h2>
      </div>

      <div className="messages-layout">
        {/* Conversations List */}
        <div className="conversations-list">
          <div className="conversations-header">
            <h3>Conversations</h3>
            <span className="unread-count">
              {conversations.reduce((sum, c) => sum + c.unread, 0)} unread
            </span>
          </div>

          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''}`}
              onClick={() => handleSelectConversation(conv.id)}
            >
              <div className="conv-avatar-container">
                <span className="conv-avatar">{conv.avatar}</span>
                {conv.online && <span className="online-indicator"></span>}
              </div>
              
              <div className="conv-details">
                <div className="conv-header">
                  <h4>{conv.name}</h4>
                  <span className="match-badge">{conv.matchScore}% Match</span>
                </div>
                <div className="conv-major">{conv.major}</div>
                <div className="conv-preview">
                  <p>{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="unread-badge">{conv.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          <div className="chat-header">
            <div className="chat-user-info">
              <span className="chat-avatar">{currentConversation?.avatar}</span>
              <div>
                <h3>{currentConversation?.name}</h3>
                <span className="chat-major">{currentConversation?.major} • {currentConversation?.matchScore}% Match</span>
                <span className="status">
                  {currentConversation?.online ? '🟢 Online' : '⚫ Offline'}
                </span>
              </div>
            </div>
            <button className="options-btn">⋮</button>
          </div>

          <div className="messages-area">
            {currentMessages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-bubble">
                  <p>{msg.text}</p>
                  <span className="message-time">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          <form className="message-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit" disabled={!messageText.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .messages-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          height: calc(100vh - 100px);
          display: flex;
          flex-direction: column;
        }

        .messages-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .messages-header h2 {
          margin: 0;
          font-size: 2rem;
        }

        .back-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .back-btn:hover {
          background: #f5f5f5;
          border-color: #9b59b6;
        }

        .messages-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 20px;
          flex: 1;
          overflow: hidden;
        }

        .conversations-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .conversations-header {
          padding: 20px;
          border-bottom: 2px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .conversations-header h3 {
          margin: 0;
          font-size: 1.3rem;
        }

        .unread-count {
          background: #fd5068;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .conversation-item {
          display: flex;
          gap: 15px;
          padding: 15px 20px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid #f0f0f0;
        }

        .conversation-item:hover {
          background: #f8f9fa;
        }

        .conversation-item.active {
          background: #ffe6ec;
          border-left: 4px solid #fd5068;
        }

        .conv-avatar-container {
          position: relative;
        }

        .conv-avatar {
          font-size: 2.5rem;
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: #51cf66;
          border: 2px solid white;
          border-radius: 50%;
        }

        .conv-details {
          flex: 1;
          min-width: 0;
        }

        .conv-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .conv-header h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .match-badge {
          font-size: 0.75rem;
          padding: 2px 8px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border-radius: 10px;
          font-weight: 600;
        }

        .conv-major {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .conv-time {
          font-size: 0.75rem;
          color: #999;
        }

        .conv-preview {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .conv-preview p {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .unread-badge {
          background: #fd5068;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }

        .chat-area {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          padding: 20px;
          border-bottom: 2px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .chat-avatar {
          font-size: 2.5rem;
        }

        .chat-user-info h3 {
          margin: 0 0 5px 0;
          font-size: 1.2rem;
        }

        .chat-major {
          display: block;
          font-size: 0.9rem;
          color: #fd5068;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .status {
          font-size: 0.85rem;
          color: #666;
        }

        .options-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px 10px;
          border-radius: 4px;
        }

        .options-btn:hover {
          background: #f0f0f0;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
        }

        .message {
          display: flex;
          margin-bottom: 15px;
        }

        .message.me {
          justify-content: flex-end;
        }

        .message.them {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 60%;
          padding: 12px 16px;
          border-radius: 16px;
        }

        .message.me .message-bubble {
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.them .message-bubble {
          background: white;
          color: #333;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .message-bubble p {
          margin: 0 0 5px 0;
          line-height: 1.5;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .message-input-area {
          padding: 20px;
          border-top: 2px solid #f0f0f0;
          display: flex;
          gap: 10px;
        }

        .message-input-area input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 24px;
          font-size: 1rem;
        }

        .message-input-area input:focus {
          outline: none;
          border-color: #fd5068;
        }

        .message-input-area button {
          padding: 12px 30px;
          background: linear-gradient(45deg, #fd5068, #ff6b9d);
          color: white;
          border: none;
          border-radius: 24px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .message-input-area button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .message-input-area button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .messages-layout {
            grid-template-columns: 1fr;
          }

          .conversations-list {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Messages;
