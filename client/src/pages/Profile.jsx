import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/profile.css';

/* Feather-style eye icons for password toggle */
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
);

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'guest';
  const canEditName = ['admin', 'supplier', 'user', 'assembler'].includes(role);

  const [name, setName] = useState(user?.name || '');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState(null);
  const [nameError, setNameError] = useState(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const userInitials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setMessage(res.data.message || 'Password changed successfully!');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveName = async () => {
    setNameMessage(null);
    setNameError(null);
    if (!name || name.trim().length === 0) {
      setNameError('Name cannot be empty.');
      return;
    }
    setSavingName(true);
    try {
      await api.put('/auth/me', { name });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name }));
      setNameMessage('Name updated. Reloading...');
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name }));
      setNameMessage('Name updated locally (server endpoint unavailable). Reloading...');
      setTimeout(() => window.location.reload(), 700);
    } finally {
      setSavingName(false);
    }
  };

  /* Navigate back based on role */
  const handleBack = () => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'assembler') navigate('/assembler');
    else if (role === 'supplier') navigate('/supplier');
    else navigate('/dashboard');
  };

  return (
    <div className="profile-page">
      {/* Back button */}
      <button className="profile-back" onClick={handleBack}>
        <ArrowLeftIcon /> Back
      </button>

      <div className="profile-card">
        {/* Avatar header */}
        <div className="profile-avatar-section">
          <div className="profile-avatar">{userInitials}</div>
          <h2 className="profile-avatar-name">{user?.name || 'User'}</h2>
          <p className="profile-avatar-role">{user?.role || 'guest'}</p>
        </div>

        <div className="profile-body">
          {/* ---- Account Info ---- */}
          <h3 className="profile-section-title">Account Information</h3>

          <div className="profile-form-group">
            <label className="profile-label">Name</label>
            {!canEditName || !editingName ? (
              <div className="profile-input-row">
                <input className="profile-input" value={user?.name || ''} readOnly />
                {canEditName && (
                  <button className="profile-btn-primary profile-btn-sm" onClick={() => setEditingName(true)}>
                    Edit
                  </button>
                )}
              </div>
            ) : (
              <div className="profile-input-row">
                <input
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
                <button className="profile-btn-primary profile-btn-sm" onClick={handleSaveName} disabled={savingName}>
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="profile-btn-secondary profile-btn-sm"
                  onClick={() => { setEditingName(false); setName(user?.name || ''); }}
                >
                  Cancel
                </button>
              </div>
            )}
            {nameMessage && <div className="profile-alert profile-alert-success" style={{ marginTop: '0.65rem' }}>{nameMessage}</div>}
            {nameError && <div className="profile-alert profile-alert-error" style={{ marginTop: '0.65rem' }}>{nameError}</div>}
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Email</label>
            <input className="profile-input" value={user?.email || ''} readOnly />
          </div>

          <div className="profile-form-group">
            <label className="profile-label">Role</label>
            <div>
              <span className="profile-role-badge">{user?.role || 'guest'}</span>
            </div>
          </div>

          {/* ---- Divider ---- */}
          <hr className="profile-divider" />

          {/* ---- Change Password ---- */}
          <h3 className="profile-section-title">Change Password</h3>

          {error && <div className="profile-alert profile-alert-error">{error}</div>}
          {message && <div className="profile-alert profile-alert-info">{message}</div>}

          <form onSubmit={handleChangePassword}>
            <div className="profile-form-group">
              <label className="profile-label">Current Password</label>
              <div className="profile-password-group">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="profile-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() => setShowCurrent((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-label">New Password</label>
              <div className="profile-password-group">
                <input
                  type={showNew ? 'text' : 'password'}
                  className="profile-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() => setShowNew((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-label">Confirm New Password</label>
              <div className="profile-password-group">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="profile-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="profile-password-toggle"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="profile-actions">
              <button type="submit" className="profile-btn-primary" disabled={changingPassword}>
                {changingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
