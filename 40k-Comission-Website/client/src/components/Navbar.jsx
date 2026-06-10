import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <Logo size={48} />
          Tangerine Hobbies
        </NavLink>
        <ul className="navbar-links">
          <li><NavLink to="/" end>About</NavLink></li>
          <li><NavLink to="/gallery">Gallery</NavLink></li>
          <li><NavLink to="/pricing">Pricing</NavLink></li>
          <li><NavLink to="/request">Request</NavLink></li>
          {user ? (
            <>
              <li><NavLink to="/my-commissions">My Orders</NavLink></li>
              <li>
                <button className="nav-user-btn" onClick={() => { logout(); navigate('/'); }}>
                  Log Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login">Log In</NavLink></li>
              <li><NavLink to="/register" className="nav-register">Register</NavLink></li>
            </>
          )}
          <li><NavLink to="/admin" className="nav-admin">Admin</NavLink></li>
        </ul>
      </div>
    </nav>
  );
}
