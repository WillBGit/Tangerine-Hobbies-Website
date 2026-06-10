import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './PricingPage.css';

export default function PricingPage() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/pricing')
      .then(r => setTiers(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="container loading">Loading pricing...</div></div>;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Pricing</h1>
        <p className="page-subtitle">All prices are per model. Contact me for large army discounts or special requests.</p>

        <div className="pricing-grid">
          {tiers.map((tier, i) => (
            <div key={tier.id} className={`pricing-card card ${i === 1 ? 'pricing-card--featured' : ''}`}>
              <div className="pricing-header">
                <h2>{tier.name}</h2>
                <div className="pricing-price">
                  <span className="price-amount">${Number(tier.price_per_model).toFixed(2)}</span>
                  <span className="price-unit"> / model</span>
                </div>
              </div>
              <p className="pricing-desc">{tier.description}</p>
              {tier.features?.length > 0 && (
                <ul className="pricing-features">
                  {tier.features.map((f, j) => (
                    <li key={j}><span className="feat-check">✦</span>{f}</li>
                  ))}
                </ul>
              )}
              <button className="btn-primary pricing-cta" onClick={() => navigate('/request', { state: { tierId: tier.id } })}>
                Request This Tier
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-note">
          <h3>Notes</h3>
          <ul>
            <li>Prices may vary for large centerpiece models (vehicles, monsters, named characters).</li>
            <li>Turnaround: ~1–2 weeks for small squads, longer for large orders.</li>
            <li>A 50% deposit is required before work begins.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
