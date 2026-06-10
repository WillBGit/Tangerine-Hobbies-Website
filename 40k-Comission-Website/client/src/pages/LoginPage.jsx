import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/users/login', form);
      login(data.token, data.user);
      navigate('/my-commissions');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page auth-page">
      <form className="auth-form card" onSubmit={handleSubmit}>
        <h2>Log In</h2>
        <p className="auth-sub">Welcome back — view your commissions and messages.</p>
        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" autoFocus />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Your password" />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
        <p className="auth-switch">No account? <Link to="/register">Create one</Link></p>
      </form>
    </div>
  );
}
