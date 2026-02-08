import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Redirect based on role
      const role = result.user.role;
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'assembler') {
        navigate('/assembler');
      } else if (role === 'supplier') {
        navigate('/supplier');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
      <div className="app-container">
        <TopNav />
        <div className="container app-content d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 4.5rem)' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div className="card form-card shadow-sm mx-auto">
              <div className="row g-0">
                <div className="col-12">
                  <div className="card-body">
                    <div className="mb-3 text-center">
                      <div className="auth-brand">PC Build Configurator</div>
                      <div className="auth-sub">Sign in to continue</div>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="form-control"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Password</label>
                        <div className="input-group">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="form-control"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label="Toggle password visibility"
                            title={showPassword ? 'Hide password' : 'Show password'}
                            style={{ color: '#0d6efd', backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' }}
                          >
                            {showPassword ? (
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
                      <div className="d-flex justify-content-end mb-3">
                        <Link to="/forgot" className="small">Forgot password?</Link>
                      </div>
                      <button type="submit" disabled={loading} className="btn btn-primary w-100">
                        {loading ? 'Logging in...' : 'Login'}
                      </button>
                    </form>
                    <div className="text-center mt-3">
                      <small>
                        Don't have an account? <Link to="/register">Register</Link>
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#555',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem',
    boxSizing: 'border-box',
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#666',
  },
};

export default Login;
