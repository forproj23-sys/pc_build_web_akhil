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
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" id="remember" />
                          <label className="form-check-label" htmlFor="remember">Remember me</label>
                        </div>
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
