import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../adminApi';
import ChatPanel from '../components/ChatPanel';
import './AdminDashboard.css';

const STATUSES = ['pending', 'accepted', 'wip', 'complete', 'declined'];

function SortableThumbs({ urls, onReorder }) {
  function move(i, dir) {
    const to = i + dir;
    if (to < 0 || to >= urls.length) return;
    const next = [...urls];
    [next[i], next[to]] = [next[to], next[i]];
    onReorder(next);
  }

  return (
    <div className="image-preview-strip">
      {urls.map((url, i) => (
        <div key={url} className="preview-thumb">
          <img src={url} alt="" />
          <button type="button" className="thumb-remove" onClick={() => onReorder(urls.filter((_, idx) => idx !== i))}>✕</button>
          <div className="thumb-arrows">
            <button type="button" className="thumb-arrow" disabled={i === 0} onClick={() => move(i, -1)}>‹</button>
            <button type="button" className="thumb-arrow" disabled={i === urls.length - 1} onClick={() => move(i, 1)}>›</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('commissions');
  const [commissions, setCommissions] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [users, setUsers] = useState([]);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [patchState, setPatchState] = useState({});
  const [paymentInputs, setPaymentInputs] = useState({});
  const [newItem, setNewItem] = useState({ title: '', faction: '', description: '', tier_id: '' });
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [imageMode, setImageMode] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editUploading, setEditUploading] = useState(false);
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) { navigate('/'); return; }
    Promise.all([
      api.get('/commissions'),
      api.get('/portfolio'),
      api.get('/pricing'),
      api.get('/users'),
    ]).then(([c, p, t, u]) => {
      setCommissions(c.data);
      setPortfolio(p.data);
      setPricingTiers(t.data);
      setUsers(u.data);
    }).catch(() => {
      sessionStorage.removeItem('adminToken');
      navigate('/');
    }).finally(() => setLoading(false));
  }, [navigate]);

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

  async function handleImageFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setAddError('');
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedUrls(u => [...u, ...data.urls]);
    } catch {
      setAddError('Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function addUrlInput() {
    const url = urlInput.trim();
    if (!url) return;
    setUploadedUrls(u => [...u, url]);
    setUrlInput('');
  }

  async function addPortfolioItem(e) {
    e.preventDefault();
    setAddError('');
    if (!uploadedUrls.length) { setAddError('Add at least one image.'); return; }
    try {
      const { data } = await api.post('/portfolio', { ...newItem, image_urls: uploadedUrls });
      setPortfolio(p => [data, ...p]);
      setNewItem({ title: '', faction: '', description: '', tier_id: '' });
      setUploadedUrls([]);
      setUrlInput('');
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add item.');
    }
  }

  function startEdit(item) {
    setEditingItem({
      ...item,
      image_urls: item.image_urls?.length ? item.image_urls : [item.image_url].filter(Boolean),
      tier_id: item.tier_id || '',
    });
  }

  async function handleEditImageFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setEditUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditingItem(ei => ({ ...ei, image_urls: [...ei.image_urls, ...data.urls] }));
    } catch {
      alert('Image upload failed.');
    } finally {
      setEditUploading(false);
      e.target.value = '';
    }
  }

  async function savePortfolioItem() {
    if (!editingItem.title || !editingItem.image_urls?.length) return;
    try {
      const { data } = await api.patch(`/portfolio/${editingItem.id}`, {
        title: editingItem.title,
        description: editingItem.description,
        image_urls: editingItem.image_urls,
        tier_id: editingItem.tier_id || null,
      });
      setPortfolio(p => p.map(i => i.id === data.id ? { ...data, tier_name: pricingTiers.find(t => String(t.id) === String(data.tier_id))?.name } : i));
      setEditingItem(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save. Check the server is running.');
    }
  }

  async function deletePortfolioItem(id) {
    if (!confirm('Remove this portfolio item?')) return;
    await api.delete(`/portfolio/${id}`);
    setPortfolio(p => p.filter(i => i.id !== id));
  }

  const dragPortfolioIdx = useRef(null);

  function onCardDragStart(e, idx) {
    dragPortfolioIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    e.currentTarget.classList.add('dragging');
  }

  function onCardDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }

  function onCardDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  async function onCardDrop(e, idx) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const from = dragPortfolioIdx.current;
    dragPortfolioIdx.current = null;
    if (from === null || from === idx) return;
    const next = [...portfolio];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setPortfolio(next);
    await api.post('/portfolio/reorder', { ids: next.map(i => i.id) });
  }

  function onCardDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    dragPortfolioIdx.current = null;
  }

  if (loading) return <div className="page"><div className="container loading">Loading dashboard...</div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="admin-header">
          <h1 className="page-title">Admin Dashboard</h1>
        </div>

        <div className="admin-tabs">
          <button className={`tab-btn ${tab === 'commissions' ? 'tab-active' : ''}`} onClick={() => setTab('commissions')}>
            Commissions ({commissions.length})
          </button>
          <button className={`tab-btn ${tab === 'portfolio' ? 'tab-active' : ''}`} onClick={() => setTab('portfolio')}>
            Portfolio ({portfolio.length})
          </button>
          <button className={`tab-btn ${tab === 'users' ? 'tab-active' : ''}`} onClick={() => setTab('users')}>
            Users
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
                  <label>Pricing Tier</label>
                  <select value={newItem.tier_id} onChange={e => setNewItem(n => ({ ...n, tier_id: e.target.value }))}>
                    <option value="">— None —</option>
                    {pricingTiers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (${Number(t.price_per_model).toFixed(0)}{t.price_max ? `–$${Number(t.price_max).toFixed(0)}` : ''}/model)</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <div className="image-mode-toggle">
                  <label>Images *</label>
                  <div className="toggle-btns">
                    <button type="button" className={imageMode === 'upload' ? 'toggle-active' : ''} onClick={() => setImageMode('upload')}>Upload</button>
                    <button type="button" className={imageMode === 'url' ? 'toggle-active' : ''} onClick={() => setImageMode('url')}>URL</button>
                  </div>
                </div>
                {imageMode === 'upload' ? (
                  <div className="upload-area">
                    <input type="file" accept="image/*" multiple onChange={handleImageFiles} disabled={uploading} />
                    {uploading && <span className="upload-status">Uploading...</span>}
                  </div>
                ) : (
                  <div className="url-add-row">
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrlInput())} />
                    <button type="button" className="btn-ghost btn-sm" onClick={addUrlInput}>Add</button>
                  </div>
                )}
                {uploadedUrls.length > 0 && (
                  <SortableThumbs
                    urls={uploadedUrls}
                    onReorder={setUploadedUrls}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={newItem.description} onChange={e => setNewItem(n => ({ ...n, description: e.target.value }))} rows={2} placeholder="Optional description..." />
              </div>
              {addError && <p className="error-msg">{addError}</p>}
              <button type="submit" className="btn-primary btn-sm">Add Item</button>
            </form>

            <div className="portfolio-admin-grid">
              {portfolio.map((item, idx) => (
                <div
                  key={item.id}
                  className="portfolio-admin-card card"
                  draggable
                  onDragStart={e => onCardDragStart(e, idx)}
                  onDragOver={onCardDragOver}
                  onDragLeave={onCardDragLeave}
                  onDrop={e => onCardDrop(e, idx)}
                  onDragEnd={onCardDragEnd}
                >
                  <img src={item.image_urls?.[0] || item.image_url} alt={item.title} draggable={false} />
                  <div className="portfolio-admin-info">
                    <strong>{item.title}</strong>
                    {item.tier_name && <span>{item.tier_name}</span>}
                  </div>
                  <div className="portfolio-admin-btns">
                    <button className="btn-ghost btn-sm" onClick={() => startEdit(item)}>Edit</button>
                    <button className="btn-danger btn-sm" onClick={() => deletePortfolioItem(item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {editingItem && (
              <div className="modal-overlay" onClick={() => setEditingItem(null)}>
                <div className="modal-box card edit-portfolio-modal" onClick={e => e.stopPropagation()}>
                  <h3>Edit Portfolio Item</h3>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Title *</label>
                      <input value={editingItem.title} onChange={e => setEditingItem(ei => ({ ...ei, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Pricing Tier</label>
                      <select value={editingItem.tier_id} onChange={e => setEditingItem(ei => ({ ...ei, tier_id: e.target.value }))}>
                        <option value="">— None —</option>
                        {pricingTiers.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (${Number(t.price_per_model).toFixed(0)}{t.price_max ? `–$${Number(t.price_max).toFixed(0)}` : ''}/model)</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea rows={2} value={editingItem.description || ''} onChange={e => setEditingItem(ei => ({ ...ei, description: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Images</label>
                    <SortableThumbs
                      urls={editingItem.image_urls}
                      onReorder={urls => setEditingItem(ei => ({ ...ei, image_urls: urls }))}
                    />
                    <div className="upload-area" style={{ marginTop: '0.5rem' }}>
                      <input type="file" accept="image/*" multiple onChange={handleEditImageFiles} disabled={editUploading} />
                      {editUploading && <span className="upload-status">Uploading...</span>}
                    </div>
                  </div>
                  <div className="edit-modal-actions">
                    <button className="btn-primary btn-sm" onClick={savePortfolioItem}>Save Changes</button>
                    <button className="btn-ghost btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div className="users-list">
            <p className="users-hint">Toggle admin access for registered users. Changes take effect on their next login.</p>
            {users.length === 0 && <p className="loading">No registered users yet.</p>}
            {users.map(u => (
              <div key={u.id} className="user-row card">
                <div className="user-info">
                  <strong>{u.name}</strong>
                  <span className="text-muted">{u.email}</span>
                </div>
                <div className="user-actions">
                  {u.is_admin
                    ? <span className="badge badge-complete">Admin</span>
                    : <span className="badge badge-pending">User</span>
                  }
                  <button
                    className={u.is_admin ? 'btn-danger btn-sm' : 'btn-ghost btn-sm'}
                    onClick={async () => {
                      const { data } = await api.patch(`/users/${u.id}/admin`, { isAdmin: !u.is_admin });
                      setUsers(prev => prev.map(x => x.id === data.id ? { ...x, is_admin: data.is_admin } : x));
                    }}
                  >
                    {u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
