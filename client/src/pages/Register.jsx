import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

// Registration illustration SVG component
const RegisterIllustration = () => (
  <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '400px' }}>
    {/* Background elements */}
    <ellipse cx="250" cy="360" rx="180" ry="25" fill="#f0f0f0"/>
    
    {/* Clipboard/Form */}
    <rect x="180" y="100" width="140" height="200" rx="10" fill="#fff" stroke="#e5e7eb" strokeWidth="2"/>
    <rect x="200" y="80" width="100" height="30" rx="5" fill="#2563eb"/>
    <rect x="200" y="130" width="100" height="12" rx="3" fill="#e5e7eb"/>
    <rect x="200" y="155" width="80" height="12" rx="3" fill="#e5e7eb"/>
    <rect x="200" y="185" width="100" height="12" rx="3" fill="#e5e7eb"/>
    <rect x="200" y="210" width="60" height="12" rx="3" fill="#e5e7eb"/>
    <rect x="200" y="240" width="100" height="25" rx="5" fill="#e85d04"/>
    
    {/* Check marks */}
    <circle cx="340" cy="140" r="15" fill="#22c55e"/>
    <path d="M333 140 L338 145 L348 135" stroke="white" strokeWidth="3" fill="none"/>
    <circle cx="355" cy="180" r="12" fill="#22c55e"/>
    <path d="M349 180 L353 184 L361 176" stroke="white" strokeWidth="2" fill="none"/>
    
    {/* Person with laptop */}
    <circle cx="120" cy="250" r="25" fill="#fcd5ce"/>
    <path d="M80 360 Q80 310 120 300 Q160 310 160 360" fill="#667eea"/>
    <rect x="70" y="290" width="80" height="50" rx="5" fill="#374151"/>
    <rect x="75" y="295" width="70" height="35" rx="3" fill="#60a5fa"/>
    <rect x="60" y="340" width="100" height="8" rx="2" fill="#4b5563"/>
    
    {/* Person standing */}
    <circle cx="380" cy="240" r="22" fill="#fcd5ce"/>
    <path d="M355 360 L355 285 Q355 260 380 260 Q405 260 405 285 L405 360" fill="#764ba2"/>
    <ellipse cx="365" cy="360" rx="15" ry="8" fill="#374151"/>
    <ellipse cx="395" cy="360" rx="15" ry="8" fill="#374151"/>
    
    {/* Pencil */}
    <rect x="400" y="200" width="8" height="60" rx="1" fill="#fbbf24" transform="rotate(30 400 200)"/>
    <path d="M430 250 L435 260 L425 260 Z" fill="#fcd34d" transform="rotate(30 430 255)"/>
    <rect x="400" y="195" width="8" height="10" fill="#ec4899" transform="rotate(30 400 195)"/>
    
    {/* Decorative elements */}
    <circle cx="80" cy="150" r="8" fill="#e85d04" opacity="0.6"/>
    <circle cx="420" cy="120" r="6" fill="#667eea" opacity="0.6"/>
    <rect x="60" y="200" width="12" height="12" rx="2" fill="none" stroke="#94a3b8" strokeWidth="2"/>
    <path d="M440 300 L450 310 L440 320" stroke="#94a3b8" strokeWidth="2" fill="none"/>
    
    {/* Stars */}
    <path d="M150 120 L153 128 L161 128 L155 133 L157 141 L150 136 L143 141 L145 133 L139 128 L147 128 Z" fill="#fbbf24"/>
    <path d="M420 160 L422 165 L427 165 L423 168 L424 173 L420 170 L416 173 L417 168 L413 165 L418 165 Z" fill="#fbbf24"/>
  </svg>
);

// Eye icons for password toggle
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

    if (name === 'name') {
      const validationError = validateName(value);
      setNameError(validationError);
    }
  };

  const handleNameBlur = () => {
    const validationError = validateName(formData.name);
    setNameError(validationError);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nameValidationError = validateName(formData.name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

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
      if (result.user.approved) {
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
        setSuccess(
          'Registration successful! Your account is pending admin approval. You will be redirected to login page shortly.'
        );
        setError('');
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
    <div className="auth-page">
      <div className="auth-container">
        {/* Left side - Form */}
        <div className="auth-form-section">
          <h1 className="auth-heading">Create Account</h1>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}
          {success && <div className="auth-alert auth-alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleNameBlur}
                required
                maxLength={30}
                className={`auth-input ${nameError ? 'is-invalid' : ''}`}
              />
              {nameError && <div className="auth-invalid-feedback">{nameError}</div>}
            </div>

            <div className="auth-form-group">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input"
              />
            </div>

            <div className="auth-form-group">
              <div className="auth-password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="auth-form-group">
              <div className="auth-password-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="auth-input"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="auth-form-group">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="auth-select"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="assembler">Assembler</option>
                <option value="supplier">Supplier</option>
              </select>
              <small className="auth-hint">Select your role (for demo)</small>
            </div>

            <button
              type="submit"
              disabled={loading || !!nameError}
              className="auth-submit-btn"
            >
              {loading ? 'Creating...' : 'Submit'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="auth-illustration-section">
          <RegisterIllustration />
        </div>
      </div>
    </div>
  );
}

export default Register;
