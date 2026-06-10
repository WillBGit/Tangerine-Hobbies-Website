import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../adminApi';
import ChatPanel from '../components/ChatPanel';
import './AdminDashboard.css';

const STATUSES = ['pending', 'accepted', 'wip', 'complete', 'declined'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('commissions');
  const [commissions, setCommissions] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [patchState, setPatchState] = useState({});
  const [paymentInputs, setPaymentInputs] = useState({});
  const [newItem, setNewItem] = useState({ title: '', faction: '', description: '', image_url: '' });
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin'); return; }
    Promise.all([
      api.get('/commissions'),
      api.get('/portfolio'),
    ]).then(([c, p]) => {
      setCommissions(c.data);
      setPortfolio(p.data);
    }).catch(() => {
      localStorage.removeItem('adminToken');
      navigate('/admin');
    }).finally(() => setLoading(false));
  }, [navigate]);

  function logout() {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  }

  async function saveCommission(id) {
    const patch = patchState[id] || {};
    const orig = commissions.find(c => c.id === id);
    const updated = { status: orig.status, admin_notes: orig.admin_notes, ...patch };
    const { data } = await api.patch(`/commissions/${id}`, updated);
    setCommissions(cs => cs.map(c => c.id === id ? data : c));
    setPatchState(s => { const n = { ...s }; delete n[id]; return n; });
  }

  async function requestPayment(id) {
    const amount = paymentInputs[id];
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    const { data } = await api.post(`/stripe/create-payment/${id}`, { amount: Number(amount) });
    setCommissions(cs => cs.map(c => c.id === id
      ? { ...c, payment_status: 'pending', payment_amount: amount, stripe_checkout_url: data.url }
      : c
    ));
    setPaymentInputs(s => { const n = { ...s }; delete n[id]; return n; });
  }

  async function deleteCommission(id) {
    if (!confirm('Delete this commission request?')) return;
    await api.delete(`/commissions/${id}`);
    setCommissions(cs => cs.filter(c => c.id !== id));
    if (expanded === id) setExpanded(null);
  }

  async function addPortfolioItem(e) {
    e.preventDefault();
    setAddError('');
    try {
      const { data } = await api.post('/portfolio', newItem);
      setPortfolio(p => [data, ...p]);
      setNewItem({ title: '', faction: '', description: '', image_url: '' });
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add item.');
    }
  }

  async function deletePortfolioItem(id) {
    if (!confirm('Remove this portfolio item?')) return;
    await api.delete(`/portfolio/${id}`);
    setPortfolio(p => p.filter(i => i.id !== id));
  }

  if (loading) return <div className="page"><div className="container loading">Loading dashboard...</div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="admin-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <button className="btn-ghost btn-sm" onClick={logout}>Log Out</button>
        </div>

        <div className="admin-tabs">
          <button className={`tab-btn ${tab === 'commissions' ? 'tab-active' : ''}`} onClick={() => setTab('commissions')}>
            Commissions ({commissions.length})
          </button>
          <button className={`tab-btn ${tab === 'portfolio' ? 'tab-active' : ''}`} onClick={() => setTab('portfolio')}>
            Portfolio ({portfolio.length})
          </button>
        </div>

        {tab === 'commissions' && (
          <div className="commissions-list">
            {commissions.length === 0 && <p className="loading">No commission requests yet.</p>}
            {commissions.map(c => (
              <div key={c.id} className="commission-row card">
                <div className="commission-summary" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                  <div className="commission-meta">
                    <strong>{c.name}</strong>
                    <span className="text-muted">{c.email}</span>
                    {c.faction && <span className="faction-tag">{c.faction}</span>}
                  </div>
                  <div className="commission-right">
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                    <span className="text-muted cdate">{new Date(c.created_at).toLocaleDateString()}</span>
                    <span className="expand-icon">{expanded === c.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === c.id && (
                  <div className="commission-detail">
                    <div className="detail-grid">
                      <div><label>Models</label><p>{c.quantity} × {c.tier_name || 'No tier'}</p></div>
                      <div><label>Budget</label><p>{c.budget || '—'}</p></div>
                      <div className="detail-full"><label>Description</label><p>{c.model_description}</p></div>
                      {c.message && <div className="detail-full"><label>Message</label><p>{c.message}</p></div>}
                    </div>

                    <div className="detail-actions">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Status</label>
                        <select
                          value={patchState[c.id]?.status ?? c.status}
                          onChange={e => setPatchState(s => ({ ...s, [c.id]: { ...s[c.id], status: e.target.value } }))}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label>Admin Notes</label>
                        <input
                          value={patchState[c.id]?.admin_notes ?? (c.admin_notes || '')}
                          onChange={e => setPatchState(s => ({ ...s, [c.id]: { ...s[c.id], admin_notes: e.target.value } }))}
                          placeholder="Internal notes..."
                        />
                      </div>
                      <div className="action-btns">
                        <button className="btn-primary btn-sm" onClick={() => saveCommission(c.id)}>Save</button>
                        <button className="btn-danger btn-sm" onClick={() => deleteCommission(c.id)}>Delete</button>
                      </div>
                    </div>
                    <ChatPanel commissionId={c.id} accessToken={c.access_token} />

                    <div className="payment-section">
                      <label className="payment-label">Payment</label>
                      {(!c.payment_status || c.payment_status === 'none') && (
                        <div className="payment-request-row">
                          <input
                            type="number"
                            className="payment-amount-input"
                            placeholder="Amount ($)"
                            min="0.01"
                            step="0.01"
                            value={paymentInputs[c.id] || ''}
                            onChange={e => setPaymentInputs(s => ({ ...s, [c.id]: e.target.value }))}
                          />
                          <button className="btn-primary btn-sm" onClick={() => requestPayment(c.id)}>
                            Request Payment
                          </button>
                        </div>
                      )}
                      {c.payment_status === 'pending' && (
                        <div className="payment-pending-row">
                          <span className="badge badge-wip">Awaiting Payment · ${Number(c.payment_amount).toFixed(2)}</span>
                          <button className="btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(c.stripe_checkout_url)}>
                            Copy Link
                          </button>
                        </div>
                      )}
                      {c.payment_status === 'paid' && (
                        <span className="badge badge-complete">Paid ✓ · ${Number(c.payment_amount).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'portfolio' && (
          <div>
            <form className="add-portfolio-form card" onSubmit={addPortfolioItem}>
              <h3>Add Portfolio Item</h3>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Title *</label>
                  <input value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))} required placeholder="e.g. Ultramarines Tactical Squad" />
                </div>
                <div className="form-group">
                  <label>Faction</label>
                  <input value={newItem.faction} onChange={e => setNewItem(n => ({ ...n, faction: e.target.value }))} placeholder="e.g. Space Marines" />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL *</label>
                <input value={newItem.image_url} onChange={e => setNewItem(n => ({ ...n, image_url: e.target.value }))} required placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} rows={2} placeholder="Optional description..." />
              </div>
              {addError && <p className="error-msg">{addError}</p>}
              <button type="submit" className="btn-primary btn-sm">Add Item</button>
            </form>

            <div className="portfolio-admin-grid">
              {portfolio.map(item => (
                <div key={item.id} className="portfolio-admin-card card">
                  <img src={item.image_url} alt={item.title} />
                  <div className="portfolio-admin-info">
                    <strong>{item.title}</strong>
                    {item.faction && <span>{item.faction}</span>}
                  </div>
                  <button className="btn-danger btn-sm" onClick={() => deletePortfolioItem(item.id)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
