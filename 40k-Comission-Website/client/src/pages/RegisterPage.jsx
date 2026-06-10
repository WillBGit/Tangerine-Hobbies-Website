import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const { data } = await api.post('/users/register', { name: form.name, email: form.email, password: form.password });
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
        <h2>Create Account</h2>
        <p className="auth-sub">Join to track your commissions and message directly.</p>
        <div className="form-group">
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name" />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min. 8 characters" />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input name="confirm" type="password" value={form.confirm} onChange={handleChange} required placeholder="Repeat password" />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
