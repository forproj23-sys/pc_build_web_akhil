import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Validate name field
  const validateName = (name) => {
    if (!name || name.trim() === '') {
      return 'Name is required';
    }
    
    if (name.length < 3) {
      return 'Name must be at least 3 characters';
    }
    
    if (name.length > 30) {
      return 'Name must not exceed 30 characters';
    }
    
    // Only alphabetic characters and spaces allowed
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(name)) {
      return 'Name can only contain alphabetic characters and spaces';
    }
    
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    setSuccess('');

    // Validate name field in real-time
    if (name === 'name') {
      const validationError = validateName(value);
      setNameError(validationError);
    }
  };

  const handleNameBlur = () => {
    // Validate on blur to ensure error is shown if field is left invalid
    const validationError = validateName(formData.name);
    setNameError(validationError);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate name field before submission
    const nameValidationError = validateName(formData.name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role
    );

    if (result.success) {
      // Check if user is approved
      if (result.user.approved) {
        // Redirect based on role if approved
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
        // User registered but needs approval
        setSuccess(
          'Registration successful! Your account is pending admin approval. You will be redirected to login page shortly.'
        );
        setError('');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      setError(result.message);
      setSuccess('');
    }

    setLoading(false);
  };

  return (
    <div className="app-container" style={{ background: 'linear-gradient(180deg, #e8f6ff 0%, #ffffff 100%)' }}>
      <TopNav />
      <div className="container app-content d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 4.5rem)' }}>
          <div style={{ width: '100%', maxWidth: '520px' }}>
            <div className="card form-card shadow-sm mx-auto">
              <div className="row g-0">
                <div className="col-12">
                  <div className="card-body">
                    <div className="mb-3 text-center">
                      <div className="auth-brand">PC Build Configurator</div>
                      <div className="form-note">Create an account to start building and managing orders.</div>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}
                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleNameBlur}
                          required
                          maxLength={30}
                          className={`form-control ${nameError ? 'is-invalid' : ''}`}
                        />
                        {nameError && <div className="invalid-feedback">{nameError}</div>}
                      </div>
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
                        <label className="form-label">Role (for demo)</label>
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="form-select"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="assembler">Assembler</option>
                          <option value="supplier">Supplier</option>
                        </select>
                        <small className="form-text text-muted">For demo purposes only</small>
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
                      <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <div className="input-group">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="form-control"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setShowConfirmPassword((s) => !s)}
                            aria-label="Toggle confirm password visibility"
                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                            style={{ color: '#0d6efd', backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' }}
                          >
                            {showConfirmPassword ? (
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
                      <button
                        type="submit"
                        disabled={loading || !!nameError}
                        className="btn btn-primary w-100"
                      >
                        {loading ? 'Registering...' : 'Register'}
                      </button>
                    </form>
                    <div className="text-center mt-3">
                      <small>
                        Already have an account? <Link to="/login">Login</Link>
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
  inputError: {
    border: '1px solid #dc3545',
  },
  fieldError: {
    color: '#dc3545',
    fontSize: '0.875rem',
    marginTop: '0.25rem',
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
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  success: {
    backgroundColor: '#d1e7dd',
    color: '#0f5132',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem',
    color: '#666',
  },
  hint: {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '0.875rem',
    color: '#888',
  },
};

export default Register;
