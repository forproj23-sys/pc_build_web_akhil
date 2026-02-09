import { useState } from 'react';
import TopNav from '../components/TopNav';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
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
                  <input className="form-control" value={user?.name || ''} readOnly />
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
                    <input
                      type="password"
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
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

