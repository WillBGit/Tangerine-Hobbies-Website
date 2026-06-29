import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function close() { setOpen(false); }

  function handleLogout() {
    logout();
    navigate('/');
    close();
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={close}>
          <Logo size={48} />
          Tangerine Hobbies
        </NavLink>

        <ul className={`navbar-links${open ? ' navbar-links--open' : ''}`}>
          <li><NavLink to="/" end onClick={close}>About</NavLink></li>
          <li><NavLink to="/gallery" onClick={close}>Gallery</NavLink></li>
          <li><NavLink to="/pricing" onClick={close}>Pricing</NavLink></li>
          <li><NavLink to="/request" onClick={close}>Request</NavLink></li>
          {user && <li><NavLink to="/my-commissions" onClick={close}>My Orders</NavLink></li>}
          {!user && <li><NavLink to="/login" onClick={close}>Log In</NavLink></li>}
          {!user && <li><NavLink to="/register" className="nav-register" onClick={close}>Register</NavLink></li>}
          {user?.isAdmin && <li><NavLink to="/admin/dashboard" className="nav-admin" onClick={close}>Admin</NavLink></li>}
        </ul>

        <div className="navbar-right">
          {user && (
            <div className="navbar-user">
              <span className="navbar-username">{user.name}</span>
              <button className="btn-ghost btn-sm" onClick={handleLogout}>Log Out</button>
            </div>
          )}
          <button className="nav-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
