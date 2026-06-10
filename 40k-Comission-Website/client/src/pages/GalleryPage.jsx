import { useEffect, useState } from 'react';
import api from '../api';
import './GalleryPage.css';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/portfolio')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="container loading">Loading gallery...</div></div>;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Portfolio</h1>
        <p className="page-subtitle">Completed commissions — click any piece for details.</p>

        {items.length === 0 ? (
          <p className="loading">No portfolio items yet. Check back soon!</p>
        ) : (
          <div className="gallery-grid">
            {items.map(item => (
              <div key={item.id} className="gallery-card card" onClick={() => setSelected(item)}>
                <img src={item.image_url} alt={item.title} className="gallery-img" />
                <div className="gallery-info">
                  <h3>{item.title}</h3>
                  {item.faction && <span className="gallery-faction">{item.faction}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box card" onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt={selected.title} className="modal-img" />
            <div className="modal-body">
              <h2>{selected.title}</h2>
              {selected.faction && <p className="modal-faction">{selected.faction}</p>}
              {selected.description && <p className="modal-desc">{selected.description}</p>}
              <button className="btn-ghost" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
