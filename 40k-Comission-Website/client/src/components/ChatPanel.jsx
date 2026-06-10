import { useEffect, useRef, useState } from 'react';
import api from '../api';
import './ChatPanel.css';

export default function ChatPanel({ commissionId, accessToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/commissions/${commissionId}/messages`)
      .then(r => setMessages(r.data));
  }, [commissionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/commissions/${commissionId}/messages`, { content: input.trim() });
      setMessages(m => [...m, data]);
      setInput('');
    } finally {
      setSending(false);
    }
  }

  const trackingUrl = `${window.location.origin}/track/${accessToken}`;

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>Messages</span>
        <div className="chat-link-row">
          <span className="chat-link-label">Client link:</span>
          <a href={trackingUrl} target="_blank" rel="noreferrer" className="chat-link">{trackingUrl}</a>
          <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(trackingUrl)}>Copy</button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && <p className="chat-empty">No messages yet. Send the client their tracking link and start a conversation.</p>}
        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble chat-bubble--${msg.sender}`}>
            <span className="bubble-sender">{msg.sender === 'admin' ? 'You' : 'Client'}</span>
            <p>{msg.content}</p>
            <span className="bubble-time">{new Date(msg.created_at).toLocaleString()}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={send}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send an update..."
          disabled={sending}
        />
        <button type="submit" className="btn-primary btn-sm" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
