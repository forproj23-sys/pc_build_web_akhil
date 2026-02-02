import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Register</h1>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleNameBlur}
              required
              maxLength={30}
              style={{
                ...styles.input,
                ...(nameError ? styles.inputError : {}),
              }}
            />
            {nameError && <div style={styles.fieldError}>{nameError}</div>}
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Role (for demo)</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="assembler">Assembler</option>
              <option value="supplier">Supplier</option>
            </select>
            <small style={styles.hint}>For demo purposes only</small>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !!nameError}
            style={{
              ...styles.button,
              ...((loading || nameError) ? styles.buttonDisabled : {}),
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
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
