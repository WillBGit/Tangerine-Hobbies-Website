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

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand" onClick={close}>
          <Logo size={48} />
          Tangerine Hobbies
        </NavLink>
        <button className="nav-hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
        <ul className={`navbar-links${open ? ' navbar-links--open' : ''}`}>
          <li><NavLink to="/" end onClick={close}>About</NavLink></li>
          <li><NavLink to="/gallery" onClick={close}>Gallery</NavLink></li>
          <li><NavLink to="/pricing" onClick={close}>Pricing</NavLink></li>
          <li><NavLink to="/request" onClick={close}>Request</NavLink></li>
          {user ? (
            <>
              <li><NavLink to="/my-commissions" onClick={close}>My Orders</NavLink></li>
              <li>
                <button className="nav-user-btn" onClick={() => { logout(); navigate('/'); close(); }}>
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login" onClick={close}>Log In</NavLink></li>
              <li><NavLink to="/register" className="nav-register" onClick={close}>Register</NavLink></li>
            </>
          )}
          {user?.isAdmin && <li><NavLink to="/admin/dashboard" className="nav-admin" onClick={close}>Admin</NavLink></li>}
        </ul>
      </div>
    </nav>
  );
}
