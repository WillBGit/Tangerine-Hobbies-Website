import { useEffect, useState } from 'react';
import api from '../api';
import './GalleryPage.css';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    api.get('/portfolio')
      .then(r => setItems(r.data))
      .finally(() => setLoading(false));
  }, []);

  function openItem(item) {
    setSelected(item);
    setImgIdx(0);
  }

  function closeModal() {
    setSelected(null);
    setImgIdx(0);
    setZoomed(false);
  }

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
            {items.map(item => {
              const images = item.image_urls?.length ? item.image_urls : [item.image_url];
              return (
                <div key={item.id} className="gallery-card card" onClick={() => openItem(item)}>
                  <img src={images[0]} alt={item.title} className="gallery-img" />
                  <div className="gallery-info">
                    <h3>{item.title}</h3>
                    {item.faction && <span className="gallery-faction">{item.faction}</span>}
                    {images.length > 1 && <span className="gallery-count">{images.length} photos</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (() => {
        const images = selected.image_urls?.length ? selected.image_urls : [selected.image_url];
        const hasPrev = imgIdx > 0;
        const hasNext = imgIdx < images.length - 1;
        return (
          <div className="modal-overlay" onClick={closeModal}>
            {zoomed && (
              <div className="zoom-lightbox" onClick={() => setZoomed(false)}>
                <img src={images[imgIdx]} alt={selected.title} />
              </div>
            )}
            <div className="modal-box card" onClick={e => e.stopPropagation()}>
              <div className="modal-img-wrap" onClick={() => setZoomed(true)}>
                <img src={images[imgIdx]} alt={selected.title} className="modal-img" />
                {hasPrev && (
                  <button className="modal-nav modal-nav--prev" onClick={e => { e.stopPropagation(); setImgIdx(i => i - 1); setZoomed(false); }}>‹</button>
                )}
                {hasNext && (
                  <button className="modal-nav modal-nav--next" onClick={e => { e.stopPropagation(); setImgIdx(i => i + 1); setZoomed(false); }}>›</button>
                )}
                <span className="modal-zoom-hint">Click to zoom in</span>
                {images.length > 1 && (
                  <span className="modal-counter">{imgIdx + 1} / {images.length}</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="modal-thumbs">
                  {images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className={`modal-thumb ${i === imgIdx ? 'modal-thumb--active' : ''}`}
                      onClick={() => setImgIdx(i)}
                    />
                  ))}
                </div>
              )}
              <div className="modal-body">
                <h2>{selected.title}</h2>
                {selected.faction && <p className="modal-faction">{selected.faction}</p>}
                {selected.description && <p className="modal-desc">{selected.description}</p>}
                <button className="btn-ghost" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
