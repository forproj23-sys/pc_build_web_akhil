import { useState } from 'react';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user } = useAuth();
  const role = user?.role || 'guest';
  const canEditName = ['admin', 'supplier', 'user', 'assembler'].includes(role);
  const [name, setName] = useState(user?.name || '');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState(null);
  const [nameError, setNameError] = useState(null);
  // password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChangePassword = (e) => {
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

    // NOTE: Backend change-password API is not implemented in this demo.
    // We provide the UI only to avoid changing existing functionality.
    setMessage('Password change is not implemented in this demo. Backend endpoint required.');
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
      // Attempt backend update if endpoint exists
      await api.put('/auth/me', { name });
      // update local storage and reload to refresh auth context
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name }));
      setNameMessage('Name updated. Reloading...');
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      // backend may not have endpoint; fallback to local update for demo
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name }));
      setNameMessage('Name updated locally (server endpoint unavailable). Reloading...');
      setTimeout(() => window.location.reload(), 700);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="app-container" style={{ background: 'linear-gradient(180deg, #e8f6ff 0%, #ffffff 100%)' }}>
      <TopNav />
      <div className="container app-content py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">Profile</h5>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  {!canEditName || !editingName ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="form-control" value={user?.name || ''} readOnly />
                      {canEditName && (
                        <button className="btn btn-outline-primary" onClick={() => setEditingName(true)}>
                          Edit
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                      <button className="btn btn-primary" onClick={handleSaveName} disabled={savingName}>
                        {savingName ? 'Saving...' : 'Save'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setEditingName(false); setName(user?.name || ''); }}>
                        Cancel
                      </button>
                    </div>
                  )}
                  {nameMessage && <div className="form-text text-success">{nameMessage}</div>}
                  {nameError && <div className="form-text text-danger">{nameError}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={user?.email || ''} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <input className="form-control" value={user?.role || ''} readOnly />
                </div>

                <hr />

                <h6 className="mb-3">Change Password</h6>
                {error && <div className="alert alert-danger">{error}</div>}
                {message && <div className="alert alert-info">{message}</div>}

                <form onSubmit={handleChangePassword}>
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <div className="input-group">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        className="form-control"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowCurrent((s) => !s)}
                        aria-label="Toggle password visibility"
                        title={showCurrent ? 'Hide password' : 'Show password'}
                        style={{ color: '#0d6efd', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                      >
                        {showCurrent ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M13.359 11.238C14.02 10.486 14.5 9.58 14.5 8.5c0-1.38-1.79-4.5-6.5-4.5A9.06 9.06 0 0 0 2.9 6.2a.5.5 0 0 0 .8.6A8.06 8.06 0 0 1 8 4c3.9 0 5.03 2.06 5.03 2.06a7.12 7.12 0 0 1-1.671 1.782.5.5 0 0 0 .0.39z"/>
                            <path d="M3.646 3.646a.5.5 0 0 1 .708 0L8 7.293 11.646 3.646a.5.5 0 0 1 .708.708L8.707 8l3.647 3.646a.5.5 0 0 1-.708.708L8 8.707 4.354 12.354a.5.5 0 1 1-.708-.708L7.293 8 3.646 4.354a.5.5 0 0 1 0-.708z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM8 12.5c-2.485 0-4.5-2.015-4.5-4.5S5.515 3.5 8 3.5 12.5 5.515 12.5 8 10.485 12.5 8 12.5z"/>
                            <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <div className="input-group">
                      <input
                        type={showNew ? 'text' : 'password'}
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowNew((s) => !s)}
                        aria-label="Toggle password visibility"
                        title={showNew ? 'Hide password' : 'Show password'}
                        style={{ color: '#0d6efd', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                      >
                        {showNew ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M13.359 11.238C14.02 10.486 14.5 9.58 14.5 8.5c0-1.38-1.79-4.5-6.5-4.5A9.06 9.06 0 0 0 2.9 6.2a.5.5 0 0 0 .8.6A8.06 8.06 0 0 1 8 4c3.9 0 5.03 2.06 5.03 2.06a7.12 7.12 0 0 1-1.671 1.782.5.5 0 0 0 .0.39z"/>
                            <path d="M3.646 3.646a.5.5 0 0 1 .708 0L8 7.293 11.646 3.646a.5.5 0 0 1 .708.708L8.707 8l3.647 3.646a.5.5 0 0 1-.708.708L8 8.707 4.354 12.354a.5.5 0 1 1-.708-.708L7.293 8 3.646 4.354a.5.5 0 0 1 0-.708z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM8 12.5c-2.485 0-4.5-2.015-4.5-4.5S5.515 3.5 8 3.5 12.5 5.515 12.5 8 10.485 12.5 8 12.5z"/>
                            <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-group">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label="Toggle password visibility"
                        title={showConfirm ? 'Hide password' : 'Show password'}
                        style={{ color: '#0d6efd', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                      >
                        {showConfirm ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M13.359 11.238C14.02 10.486 14.5 9.58 14.5 8.5c0-1.38-1.79-4.5-6.5-4.5A9.06 9.06 0 0 0 2.9 6.2a.5.5 0 0 0 .8.6A8.06 8.06 0 0 1 8 4c3.9 0 5.03 2.06 5.03 2.06a7.12 7.12 0 0 1-1.671 1.782.5.5 0 0 0 .0.39z"/>
                            <path d="M3.646 3.646a.5.5 0 0 1 .708 0L8 7.293 11.646 3.646a.5.5 0 0 1 .708.708L8.707 8l3.647 3.646a.5.5 0 0 1-.708.708L8 8.707 4.354 12.354a.5.5 0 1 1-.708-.708L7.293 8 3.646 4.354a.5.5 0 0 1 0-.708z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM8 12.5c-2.485 0-4.5-2.015-4.5-4.5S5.515 3.5 8 3.5 12.5 5.515 12.5 8 10.485 12.5 8 12.5z"/>
                            <path d="M8 5.5A2.5 2.5 0 1 0 8 10.5 2.5 2.5 0 0 0 8 5.5z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary">
                      Change password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

