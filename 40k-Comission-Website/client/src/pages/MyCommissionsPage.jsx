import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './MyCommissionsPage.css';

const STATUS_LABELS = {
  pending: 'Awaiting Review', accepted: 'Accepted',
  wip: 'In Progress', complete: 'Complete', declined: 'Declined',
};

function CommissionThread({ commission }) {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  async function loadMessages() {
    const { data } = await api.get(`/users/me/commissions/${commission.id}/messages`);
    setMessages(data);
  }

  function toggle() {
    if (!open) loadMessages();
    setOpen(o => !o);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/users/me/commissions/${commission.id}/messages`, { content: input.trim() });
      setMessages(m => [...m, data]);
      setInput('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="myc-card card">
      <div className="myc-header" onClick={toggle}>
        <div className="myc-info">
          <strong>{commission.model_description.slice(0, 60)}{commission.model_description.length > 60 ? '…' : ''}</strong>
          <span className="myc-meta">{commission.quantity} models · {commission.tier_name || 'Custom'} · {new Date(commission.created_at).toLocaleDateString()}</span>
        </div>
        <div className="myc-right">
          <span className={`badge badge-${commission.status}`}>{STATUS_LABELS[commission.status] ?? commission.status}</span>
          <span className="expand-icon">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="myc-thread">
          {commission.payment_status === 'pending' && (
            <div className="myc-payment-banner">
              <span>Payment requested: <strong>${Number(commission.payment_amount).toFixed(2)}</strong></span>
              <a href={commission.stripe_checkout_url} target="_blank" rel="noreferrer" className="btn-primary btn-sm">
                Pay Now
              </a>
            </div>
          )}
          {commission.payment_status === 'paid' && (
            <div className="myc-payment-complete">
              ✓ Payment complete — ${Number(commission.payment_amount).toFixed(2)}
            </div>
          )}
          <div className="myc-messages">
            {messages.length === 0 && <p className="chat-empty">No messages yet. Send us a note below!</p>}
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
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Send a message..." disabled={sending} />
            <button type="submit" className="btn-primary btn-sm" disabled={sending || !input.trim()}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function MyCommissionsPage() {
  const { user, logout } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/users/me/commissions')
      .then(r => setCommissions(r.data))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <div className="page"><div className="container loading">Loading your commissions...</div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="myc-page-header">
          <div>
            <h1 className="page-title">My Commissions</h1>
            <p className="page-subtitle">Welcome back, {user?.name}.</p>
          </div>
          <div className="myc-actions">
            <Link to="/request" className="btn-primary btn-sm">New Request</Link>
          </div>
        </div>

        {commissions.length === 0 ? (
          <div className="myc-empty">
            <p>You haven't submitted any commissions yet.</p>
            <Link to="/request" className="btn-primary">Request a Commission</Link>
          </div>
        ) : (
          <div className="myc-list">
            {commissions.map(c => <CommissionThread key={c.id} commission={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
