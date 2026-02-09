import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNav from '../components/TopNav';

function Home() {
  const { user } = useAuth();

  return (
    <div className="app-container">
      <TopNav />

      <main className="container app-content py-5">
        <section className="p-4 p-md-5 mb-4 rounded bg-light shadow-sm">
          <div className="container-fluid py-4 text-center">
            <h1 className="display-5 fw-bold">PC Build Configurator</h1>
            <p className="col-md-8 fs-5 mx-auto text-muted">
              Quickly assemble compatible PC builds, manage components, and coordinate with suppliers and assemblers.
            </p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link className="btn btn-primary btn-lg" to="/admin">Admin Dashboard</Link>
                  )}
                  {user.role === 'assembler' && (
                    <Link className="btn btn-primary btn-lg" to="/assembler">Assembler Dashboard</Link>
                  )}
                  {user.role === 'supplier' && (
                    <Link className="btn btn-success btn-lg" to="/supplier">Supplier Inventory</Link>
                  )}
                  {user.role === 'user' && (
                    <Link className="btn btn-primary btn-lg" to="/dashboard">My Dashboard</Link>
                  )}
                </>
              ) : (
                <>
                  <Link className="btn btn-primary btn-lg" to="/register">Get Started</Link>
                  <Link className="btn btn-outline-primary btn-lg" to="/login">Login</Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Compatibility First</h5>
                <p className="card-text text-muted">Pick parts with confidence — the system checks component compatibility during build creation.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Supplier Integration</h5>
                <p className="card-text text-muted">Suppliers can manage inventory and add components; users can browse parts easily.</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Assembler Workflow</h5>
                <p className="card-text text-muted">Assign builds to assemblers and track build status from creation to delivery.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
