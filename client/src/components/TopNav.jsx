import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const role = user?.role || 'guest';

  const userInitials = (nameOrEmail) => {
    if (!nameOrEmail) return '';
    const parts = String(nameOrEmail).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3 sticky-top shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          PC Build Configurator
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink end to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                Home
              </NavLink>
            </li>
            {role === 'admin' && (
              <li className="nav-item">
                <NavLink to="/admin" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  Admin
                </NavLink>
              </li>
            )}
            {role === 'supplier' && (
              <li className="nav-item">
                <NavLink to="/supplier" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  Inventory
                </NavLink>
              </li>
            )}
            {role === 'assembler' && (
              <li className="nav-item">
                <NavLink to="/assembler" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  Assignments
                </NavLink>
              </li>
            )}
            {role === 'user' && (
              <li className="nav-item">
                <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
                  Dashboard
                </NavLink>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {user ? (
              <div className="dropdown d-flex align-items-center">
                <button
                  className="btn btn-light d-flex align-items-center gap-2"
                  type="button"
                  id="userMenu"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="nav-avatar bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center me-1">
                    {userInitials(user.name || user.email)}
                  </span>
                  <span className="d-none d-md-inline">{user.name || user.email}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                  <li>
                    <NavLink className="dropdown-item" to="/profile">
                      Profile
                    </NavLink>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div>
                <Link className="btn btn-outline-primary me-2" to="/login">
                  Login
                </Link>
                <Link className="btn btn-primary" to="/register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

