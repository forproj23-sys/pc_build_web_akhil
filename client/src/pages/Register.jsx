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
        <div className="card shadow-lg mx-auto" style={{ borderRadius: 40, overflow: 'visible', paddingTop: 48, transform: 'translateY(-10px)' }}>
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
              <h2 className="text-center" style={{ fontWeight: 700 }}>Create Account</h2>

              {error && <div className="alert alert-danger mt-3">{error}</div>}
              {success && <div className="alert alert-success mt-3">{success}</div>}

              <form onSubmit={handleSubmit} className="mt-4" style={{ maxWidth: 520, margin: '0 auto' }}>
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your Name"
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
                    placeholder="Enter your Email"
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

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm your Password"
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
                      style={{ color: '#0d6efd', backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
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

                <button
                  type="submit"
                  disabled={loading || !!nameError}
                  className="btn btn-primary w-100"
                  style={{ backgroundColor: '#2b59d9', borderColor: '#2b59d9', padding: '0.75rem 1rem' }}
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>

              <div className="text-center mt-4" style={{ color: '#999' }}>
                <small>Already have an account? <Link to="/login">Login</Link></small>
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
