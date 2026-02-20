import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'assembler') {
        navigate('/assembler');
      } else if (user.role === 'supplier') {
        navigate('/supplier');
      } else if (user.role === 'user') {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  if (user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '3rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{ marginBottom: '1rem', color: '#333' }}>PC Build Configurator</h1>
        <p style={{ marginBottom: '2rem', color: '#666' }}>
          Build your perfect PC with our component compatibility checker
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            to="/login"
            style={{
              padding: '0.75rem 2rem',
              background: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              padding: '0.75rem 2rem',
              background: 'transparent',
              color: '#667eea',
              textDecoration: 'none',
              borderRadius: '6px',
              border: '2px solid #667eea',
              fontWeight: '600',
            }}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
