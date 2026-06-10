import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import './RequestPage.css';

const FACTIONS = [
  'Space Marines', 'Chaos Space Marines', 'Necrons', 'Tyranids', 'Orks',
  'Aeldari', 'Drukhari', 'Tau Empire', 'Adeptus Mechanicus', 'Astra Militarum',
  'Death Guard', 'Thousand Sons', 'World Eaters', 'Emperor\'s Children',
  'Grey Knights', 'Adeptus Custodes', 'Sisters of Battle', 'Leagues of Votann',
  'Genestealer Cults', 'Other / Mixed',
];

export default function RequestPage() {
  const location = useLocation();
  const [tiers, setTiers] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', faction: '', model_description: '',
    quantity: 1, tier_id: '', budget: '', message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/pricing').then(r => {
      setTiers(r.data);
      const preselect = location.state?.tierId;
      if (preselect) setForm(f => ({ ...f, tier_id: String(preselect) }));
    });
  }, [location.state]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/commissions', {
        ...form,
        quantity: Number(form.quantity),
        tier_id: form.tier_id ? Number(form.tier_id) : null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="container request-success">
          <div className="success-icon">⚔</div>
          <h1>Request Submitted!</h1>
          <p>Your commission request has been received. I'll be in touch at your provided email within 48 hours to discuss details and next steps.</p>
          <button className="btn-primary" onClick={() => setSuccess(false)}>Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Request a Commission</h1>
        <p className="page-subtitle">Fill out the form below and I'll get back to you within 48 hours.</p>

        <form className="request-form card" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Your Name *</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Commander Shepard" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="faction">Faction / Army</label>
              <select id="faction" name="faction" value={form.faction} onChange={handleChange}>
                <option value="">Select a faction...</option>
                {FACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tier_id">Desired Tier</label>
              <select id="tier_id" name="tier_id" value={form.tier_id} onChange={handleChange}>
                <option value="">Not sure yet</option>
                {tiers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — ${Number(t.price_per_model).toFixed(2)}/model</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Number of Models *</label>
              <input id="quantity" name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="budget">Budget (optional)</label>
              <input id="budget" name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. $100–150" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="model_description">Model Description *</label>
            <textarea
              id="model_description" name="model_description"
              value={form.model_description} onChange={handleChange}
              required rows={4}
              placeholder="Describe what you'd like painted — unit type, any special instructions, colour scheme preferences, conversion notes, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Additional Notes</label>
            <textarea
              id="message" name="message"
              value={form.message} onChange={handleChange}
              rows={3}
              placeholder="Anything else I should know?"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn-primary request-submit" disabled={submitting}>
            {submitting ? 'Sending...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
