import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';

function Home() {
  const { user, logout } = useAuth();

  return (
    <div style={styles.container} className="app-container">
      <TopNav />
      <div style={styles.content} className="app-content">
        <h2 style={styles.title}>Welcome to PC Build Configuration System</h2>
        <p style={styles.description}>
          Build your custom PC with compatibility checking. Connect with assemblers and suppliers.
        </p>
        {user ? (
          <div style={styles.actions}>
            {user.role === 'admin' && (
              <Link to="/admin" style={styles.actionButton}>
                Admin Dashboard
              </Link>
            )}
            {user.role === 'assembler' && (
              <Link to="/assembler" style={styles.actionButton}>
                Assembler Dashboard
              </Link>
            )}
            {user.role === 'supplier' && (
              <Link to="/supplier" style={styles.actionButton}>
                Supplier Dashboard
              </Link>
            )}
            {user.role === 'user' && (
              <Link to="/dashboard" style={styles.actionButton}>
                My Dashboard
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.actions}>
            <Link to="/register" style={styles.actionButton}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    margin: 0,
    color: '#333',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  userInfo: {
    color: '#666',
    marginRight: '1rem',
  },
  content: {
    maxWidth: '800px',
    margin: '4rem auto',
    padding: '2rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    color: '#333',
  },
  description: {
    fontSize: '1.25rem',
    color: '#666',
    marginBottom: '2rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  actionButton: {
    padding: '1rem 2rem',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '1.1rem',
  },
};

export default Home;
