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
    <div
      className="app-container d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        backgroundImage: "url('https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3&s=abcd')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 760, padding: '2rem' }}>
        <div className="card shadow-lg mx-auto" style={{ borderRadius: 40, overflow: 'visible', paddingTop: 48 }}>
          {/* avatar circle */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: '#2b59d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 40,
                position: 'absolute',
                top: -48,
                left: '50%',
                transform: 'translateX(-50%)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="card-body" style={{ paddingTop: 64 }}>
              <h2 className="text-center" style={{ fontWeight: 700 }}>Welcome Back</h2>

              {error && <div className="alert alert-danger mt-3">{error}</div>}

              <form onSubmit={handleSubmit} className="mt-4" style={{ maxWidth: 520, margin: '0 auto' }}>
                <div className="mb-3">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter your Username"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-control"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password *</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Enter your Password"
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
                      style={{ color: '#0d6efd', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary w-100" style={{ backgroundColor: '#2b59d9', borderColor: '#2b59d9', padding: '0.75rem 1rem' }}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              
              <div className="text-center mb-3" style={{ color: '#999' }}>
                <small>Don't have an account? <Link to="/register">Create new account</Link></small>
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
