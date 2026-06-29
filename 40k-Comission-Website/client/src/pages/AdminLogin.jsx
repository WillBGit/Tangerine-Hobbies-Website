import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './AdminLogin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { password });
      sessionStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
    } catch {
      setError('Invalid password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page login-page">
      <form className="login-form card" onSubmit={handleSubmit}>
        <h2>Admin Access</h2>
        <p className="login-sub">For the Dark Prince's eyes only.</p>
        <div className="form-group">
          <label htmlFor="pw">Password</label>
          <input id="pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}
