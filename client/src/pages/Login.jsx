import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

// Security illustration SVG component
const SecurityIllustration = () => (
  <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '400px' }}>
    {/* Background elements */}
    <ellipse cx="250" cy="350" rx="180" ry="30" fill="#f0f0f0"/>
    
    {/* Plant left */}
    <path d="M80 350 Q70 320 85 300 Q75 310 80 350" fill="#a8d5ba"/>
    <path d="M85 350 Q95 315 80 290 Q100 305 85 350" fill="#7bc89c"/>
    <path d="M90 350 Q80 325 95 305 Q85 320 90 350" fill="#a8d5ba"/>
    
    {/* Plant right */}
    <path d="M420 350 Q410 320 425 300 Q415 310 420 350" fill="#a8d5ba"/>
    <path d="M425 350 Q435 315 420 290 Q440 305 425 350" fill="#7bc89c"/>
    
    {/* Computer monitor */}
    <rect x="180" y="180" width="160" height="120" rx="8" fill="#2563eb" stroke="#1e40af" strokeWidth="4"/>
    <rect x="190" y="190" width="140" height="90" rx="4" fill="#dbeafe"/>
    <rect x="230" y="300" width="60" height="20" fill="#64748b"/>
    <rect x="210" y="320" width="100" height="10" rx="2" fill="#475569"/>
    
    {/* Lock icon on screen */}
    <rect x="235" y="210" width="50" height="40" rx="4" fill="#2563eb"/>
    <path d="M245 210 V200 Q245 185 260 185 Q275 185 275 200 V210" stroke="#2563eb" strokeWidth="6" fill="none"/>
    <circle cx="260" cy="230" r="6" fill="white"/>
    <rect x="257" y="232" width="6" height="10" fill="white"/>
    
    {/* Person sitting (left) */}
    <circle cx="150" cy="280" r="20" fill="#fcd5ce"/>
    <path d="M130 350 Q130 310 150 305 Q170 310 170 350" fill="#e85d04"/>
    <ellipse cx="135" cy="340" rx="15" ry="8" fill="#1e3a5f"/>
    <ellipse cx="165" cy="340" rx="15" ry="8" fill="#1e3a5f"/>
    
    {/* Person standing (right) with key */}
    <circle cx="380" cy="240" r="18" fill="#fcd5ce"/>
    <path d="M365 350 L365 280 Q365 260 380 260 Q395 260 395 280 L395 350" fill="#1e3a5f"/>
    <ellipse cx="370" cy="350" rx="12" ry="6" fill="#374151"/>
    <ellipse cx="390" cy="350" rx="12" ry="6" fill="#374151"/>
    
    {/* Key */}
    <ellipse cx="420" cy="270" rx="25" ry="12" fill="#f97316" transform="rotate(-30 420 270)"/>
    <rect x="400" y="275" width="60" height="8" rx="4" fill="#f97316" transform="rotate(-30 420 270)"/>
    <rect x="445" y="268" width="8" height="15" fill="#f97316" transform="rotate(-30 445 275)"/>
    <rect x="455" y="265" width="8" height="12" fill="#f97316" transform="rotate(-30 455 270)"/>
    
    {/* Paper airplane */}
    <path d="M120 120 L180 150 L140 160 Z" fill="#e85d04"/>
    <path d="M120 120 L140 160 L130 170 Z" fill="#dc2626"/>
    
    {/* Dashed curved line */}
    <path d="M180 150 Q280 100 380 120 Q450 140 470 200" stroke="#374151" strokeWidth="2" strokeDasharray="8 4" fill="none"/>
    
    {/* Decorative elements */}
    <rect x="300" y="100" width="15" height="15" rx="2" fill="none" stroke="#94a3b8" strokeWidth="2"/>
    <rect x="340" y="140" width="10" height="10" rx="1" fill="none" stroke="#94a3b8" strokeWidth="2"/>
    <circle cx="450" y="160" r="4" fill="#94a3b8"/>
    <path d="M470 300 L480 310 L470 320" stroke="#94a3b8" strokeWidth="2" fill="none"/>
    <path d="M100 200 L90 210 L100 220" stroke="#94a3b8" strokeWidth="2" fill="none"/>
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
    <div className="auth-page">
      <div className="auth-container">
        {/* Left side - Form */}
        <div className="auth-form-section">
          <h1 className="auth-heading">User Login</h1>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <input
                type="text"
                name="email"
                placeholder="Username"
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
                  placeholder="••••••••"
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

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? 'Signing in...' : 'Submit'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="auth-illustration-section">
          <SecurityIllustration />
        </div>
      </div>
    </div>
  );
}

export default Login;
