import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import './TrackPage.css';

const STATUS_LABELS = {
  pending: 'Awaiting Review',
  accepted: 'Accepted',
  wip: 'In Progress',
  complete: 'Complete',
  declined: 'Declined',
};

export default function TrackPage() {
  const { token } = useParams();
  const [commission, setCommission] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/track/${token}`)
      .then(r => setCommission(r.data))
      .catch(() => setNotFound(true));
    api.get(`/track/${token}/messages`)
      .then(r => setMessages(r.data))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/track/${token}/messages`, { content: input.trim() });
      setMessages(m => [...m, data]);
      setInput('');
    } finally {
      setSending(false);
    }
  }

  if (notFound) return (
    <div className="page track-page">
      <div className="container track-not-found">
        <h2>Commission not found</h2>
        <p>This link may be invalid or expired.</p>
      </div>
    </div>
  );

  if (!commission) return <div className="page"><div className="container loading">Loading your commission...</div></div>;

  return (
    <div className="page track-page">
      <div className="container">
        <h1 className="page-title">Your Commission</h1>
        <p className="page-subtitle">Track your order and message us directly below.</p>

        <div className="track-status-card card">
          <div className="track-status-header">
            <div>
              <div className="track-name">{commission.name}</div>
              {commission.faction && <div className="track-faction">{commission.faction}</div>}
            </div>
            <span className={`badge badge-${commission.status}`}>
              {STATUS_LABELS[commission.status] ?? commission.status}
            </span>
          </div>
          <div className="track-details">
            <div><label>Models</label><p>{commission.quantity} × {commission.tier_name || 'Custom'}</p></div>
            <div><label>Description</label><p>{commission.model_description}</p></div>
            <div><label>Submitted</label><p>{new Date(commission.created_at).toLocaleDateString()}</p></div>
          </div>
        </div>

        <div className="track-chat card">
          <div className="track-chat-header">Messages</div>
          <div className="track-messages">
            {messages.length === 0 && (
              <p className="chat-empty">No messages yet. Feel free to ask a question below!</p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`chat-bubble chat-bubble--${msg.sender}`}>
                <span className="bubble-sender">{msg.sender === 'admin' ? 'Tangerine Hobbies' : 'You'}</span>
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
              placeholder="Ask a question or leave a note..."
              disabled={sending}
            />
            <button type="submit" className="btn-primary btn-sm" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
